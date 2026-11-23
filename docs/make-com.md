# Conexión con Make.com

La pantalla recibe un JSON diario en `POST https://pantalla-local.vercel.app/api/webhook/make`.
Si Make.com deja de enviar datos más de 26 h, el motor de respaldo (sin IA) toma el control solo.

## 1. Requisito en Vercel (sin esto el webhook responde 500)

En **Vercel → Project → Settings → Environment Variables** deben existir, en *Production*:

| Variable | Para qué |
| --- | --- |
| `SYNC_SECRET` | Token que Make.com manda en `Authorization: Bearer ...` |
| `ADMIN_PASSWORD` | Contraseña de `/admin` |
| `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` (o `KV_REST_API_*`) | Guardar lo que manda Make (sin esto los datos se pierden entre instancias) |

Después de agregarlas: **Deployments → ⋯ → Redeploy**. Las variables solo aplican a despliegues nuevos.

Comprobación rápida (sin token debe responder **401**, no 500):

```bash
curl -i -X POST https://pantalla-local.vercel.app/api/webhook/make -H "content-type: application/json" -d "{}"
```

Y el almacenamiento debe ser compartido (`"storage":"redis"`, `"storageShared":true`):

```bash
curl https://pantalla-local.vercel.app/api/health
```

## 2. Módulo HTTP final del escenario

| Campo | Valor |
| --- | --- |
| URL | `https://pantalla-local.vercel.app/api/webhook/make` |
| Method | POST |
| Headers | `Authorization: Bearer <SYNC_SECRET>` y `Content-Type: application/json` |
| Body type | Raw · JSON (application/json) |
| Parse response | Sí |

Respuestas: **200** guardado (revisa `dropped` si viene algo), **401** token distinto a `SYNC_SECRET`,
**422** estructura inválida (se conserva lo anterior), **500** falta `SYNC_SECRET` en Vercel, **503** falta conectar Upstash Redis (sin él la pantalla no ve lo que manda Make).

## 3. Catálogo para Make

`GET https://pantalla-local.vercel.app/api/catalog` devuelve los programas activos de WorldBrain con los campos del
contrato (`id, title, description, image_url, course_url, price`, `hook_*` vacíos) más `benefit`, `ages` y
`audience` como contexto para la IA. Así Make no necesita hacer scraping del sitio. Los programas que apagues en
`/admin → Cursos` dejan de aparecer aquí y en la pantalla.

## 4. Prompt para Maia (Plan Mode)

También se puede copiar desde `/admin → Sincronizar → Copiar prompt para Maia`.

```text
Crea un escenario de Make.com que alimente la pantalla del local de WorldBrain México todos los días.

DISPARADOR
- Programación diaria a las 06:00 (zona horaria America/Mexico_City).

PASO 1 · Catálogo de programas
- Módulo HTTP "Make a request": GET https://pantalla-local.vercel.app/api/catalog
- Parsear la respuesta como JSON. Usar el arreglo "courses" (programas oficiales con id, title, description, image_url, course_url, price, benefit, ages y audience).

PASO 2 · Reels de Instagram
- Módulo Instagram for Business: listar las publicaciones más recientes de la cuenta de WorldBrain (límite 25).
- Filtrar solo media_type = VIDEO (Reels). Tomar como máximo 15.
- Para cada uno: id = id de la publicación, mp4_url = media_url (enlace directo .mp4, sin iframe ni permalink).

PASO 3 · Noticias del día
- Módulo RSS: leer https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=es-419&gl=MX&ceid=MX:es-419
- Tomar 6 titulares: headline = título sin el " - Medio" del final, source = nombre del medio.
- Descartar titulares de violencia, tragedias, accidentes, crimen o enfermedad.

PASO 4 · Copy con IA (un registro por programa)
- Para cada programa del Paso 1 redactar:
  · hook_headline: máximo 8 palabras, ingenioso, irónico y directo (estilo Ben & Frank), español de México.
    Si audience incluye "ninos" háblale a mamás y papás; "jovenes" a estudiantes; "adultos" a profesionales.
    Puede mencionar con respeto una noticia del Paso 3 si encaja.
  · hook_subheadline: máximo 14 palabras, beneficio concreto basado en description, benefit y ages.
- Prohibido inventar precios, descuentos, becas, garantías o resultados. WorldBrain tiene grupos de máximo 7 participantes y está en Cuautitlán Izcalli desde 2000; solo usa esos datos.
- Conservar sin cambios id, title, description, image_url, course_url y price tal como llegan del Paso 1.

PASO 5 · Enviar a la pantalla
- Módulo HTTP "Make a request":
  · URL: https://pantalla-local.vercel.app/api/webhook/make
  · Método: POST
  · Header: Authorization = Bearer <SYNC_SECRET>   (el mismo valor que la variable SYNC_SECRET en Vercel)
  · Header: Content-Type = application/json
  · Body type: Raw · Content type: JSON (application/json)
  · Cuerpo EXACTO (solo estas 4 claves):
    {
      "generated_at": "<fecha y hora actual en ISO-8601>",
      "instagram_videos": [{ "id": "...", "mp4_url": "..." }],
      "courses": [{ "id": "...", "title": "...", "description": "...", "image_url": "...", "course_url": "...", "price": "...", "hook_headline": "...", "hook_subheadline": "..." }],
      "daily_news": [{ "headline": "...", "source": "..." }]
    }
- Respuesta esperada: HTTP 200 con {"ok": true, "saved": {...}}. Si "dropped" trae elementos, revisar esos campos.
- Si responde 401 el token no coincide con SYNC_SECRET; 422 el JSON no tiene la estructura; 500 falta configurar SYNC_SECRET en Vercel; 503 falta conectar Upstash Redis en Vercel.
- Ante cualquier error, enviarme una notificación por correo.
```
