# Pantalla WorldBrain México · Señalización digital para LG webOS

Pantalla de escaparate de [WorldBrain México](https://ultravelozmente.com/), en producción en
`https://pantalla-local.vercel.app/tv`. Next.js 15 (App Router) + TypeScript + Tailwind CSS 3.

| Ruta | Qué hace |
| --- | --- |
| `/tv` | Reproductor 24/7 para el navegador de la LG (reels, showreels, comerciales animados y anuncios manuales). |
| `/admin` | Panel móvil con contraseña: anuncios, programas del catálogo, URLs extra, sincronización, conexión con Make.com y vista previa 9:16 / 16:9. |
| `POST /api/webhook/make` | Recibe el JSON diario de Make.com (`Authorization: Bearer $SYNC_SECRET`). Guía: [docs/make-com.md](docs/make-com.md). |
| `GET /api/catalog` | Programas activos de WorldBrain en el formato del contrato, para que Make.com no tenga que hacer scraping. |
| `GET /api/cron/fallback-sync` | Motor de respaldo sin IA (Vercel Cron). Solo actúa si Make.com lleva > 26 h sin enviar datos. |
| `GET /api/playlist` | JSON que consume la TV cada 15 min. |

## Anuncios generados (12 s cada uno, CSS/SVG/Canvas, cero IA)

| Tipo | Diseño | `?scene=` |
| --- | --- | --- |
| Curso | Celular / laptop 3D con cursor que hace clic | `mockup` |
| Curso | Tipografía cinética con subrayado SVG y bloque de color | `kinetic` |
| Curso | Cintas de noticias + curso relacionado | `ticker` |
| Curso | Pantalla dividida con patrón generativo en Canvas | `split` |
| Curso | Oferta flash tipo cartel | `flash` |
| Curso | **Portada editorial** (vertical primero): foto que se destapa y palabra-beneficio gigante | `cover` |
| Curso | **Índice de programas** (vertical primero): la lista se desplaza hasta el programa y lo marca | `index` |
| Curso | **«Apunta tu cámara aquí»**: QR gigante (más de la mitad del ancho) con visor, láser y flecha | `scan` |
| Marca | **Testimonios** de ultravelozmente.com con sello giratorio (12, rotan sin repetirse) | `testimonial` |
| Marca | **El método** en tres momentos con línea de avance | `method` |
| Marca | **En números**: 2000 · máx. 7 · 17 · Izcalli con contador tipo odómetro | `numbers` |
| Marca | **Los 5 Minutos** con anillo que se completa por cuartos | `ritual` |
| Marca | **¿Para quién?**: tres etapas con sus programas reales | `stages` |
| Marca | **WhatsApp gigante**: «El siguiente paso empieza con una conversación», con ondas en el ícono | `contact` |
| Marca | **Horario en vivo**: «Abierto ahora» / «Abrimos mañana a las 9:00» con el reloj de la TV | `hours` |
| Marca | **Muro de programas**: columnas de fotos que se deslizan en sentidos opuestos | `gallery` |

Todos cierran con un QR al temario del programa (en los de marca, el programa recomendado o el del
testimonio) y muestran el WhatsApp. El QR es grande (31 % del ancho en vertical, 24 % del alto en horizontal)
y lleva un visor con esquinas animadas y un pulso; las animaciones nunca tapan los módulos, salvo el láser
delgado y translúcido de `scan`. Cada anuncio entra con una cortinilla de dos colores y lleva una barra de
progreso de 12 s. Los textos institucionales están en `data/worldbrain-brand.json`, copiados del sitio.
En la rotación, los anuncios de marca ocupan ~37 % de los comerciales (los testimonios cuentan triple).
Para revisar un diseño: `/tv?preview=1&scene=<id>&palette=<acido|worldbrain|coral|menta|senal|chicle>`, o desde
`/admin → Vista previa → Diseño`.

## WorldBrain en la pantalla

- **Catálogo oficial** (`data/worldbrain-catalog.json`): los 17 programas de ultravelozmente.com con descripción, imagen,
  edades, público y palabra clave de beneficio. La TV lo muestra desde el primer minuto (aunque Make.com no haya enviado
  nada) y el motor de respaldo lo usa siempre. Se apagan/encienden programas en `/admin → Cursos`.
- **Showreels**: los 14 programas con video en el sitio aportan su showreel (30 s, con logo, ficha y QR) cuando Instagram
  trae menos de 3 reels.
- **Copy por público** (`data/benfrank-templates.json`): 50 fórmulas de ≤ 8 palabras etiquetadas para niños (le hablan a
  mamás y papás), jóvenes, adultos o todos. Solo usan datos reales del sitio (grupos de máx. 7, desde 2000, sede en
  Cuautitlán Izcalli); nunca inventan precios ni promesas.
- **Marca**: tipografías Geist + Instrument Serif, logotipo de texto World*Brain*, paleta Porcelana + Azul Klein entre
  las 6 paletas anti-reflejo, y el WhatsApp de informes (55 7810 7837) donde un curso no tiene precio publicado.
- **Proxy `/wb-media/*`**: ultravelozmente.com envía `Cross-Origin-Resource-Policy: same-origin`, así que el navegador
  bloquea sus imágenes y videos dentro de otro dominio. `next.config.ts` reescribe `/wb-media/*` hacia
  `https://ultravelozmente.com/images/*` para que lleguen como mismo origen. Si cambia la ruta de las imágenes del
  sitio, hay que actualizar el catálogo.

## Por qué Next 15 y Tailwind 3 (y no Next 16 / Tailwind 4)

Next 16 y Tailwind 4 exigen Chrome 111+. Las LG con webOS 6–24 traen Chromium 79–108.
Este proyecto apunta a **webOS 6.0 o superior (Chromium 79+)**. `npm run check:tv` (después de `npm run build`)
verifica que el JS de `/tv` sea ES2019 y que su CSS no use propiedades que Chromium 79 no entiende.

## Variables de entorno

Copia `.env.example` a `.env.local`. Mínimo:

- `SYNC_SECRET`: token que enviará Make.com.
- `ADMIN_PASSWORD`: contraseña de `/admin`.
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (o `KV_REST_API_URL` + `KV_REST_API_TOKEN`): almacenamiento persistente.
  Sin ellas se usa `/tmp/signage-state.json`, que **solo sirve en local**.
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob para subir imágenes/videos desde el celular. El Blob Store debe ser **público**.
- Opcional: `CRON_SECRET` (Vercel lo manda al cron), `SIGNAGE_TZ` (zona horaria de la semilla del servidor, por defecto `America/Mexico_City`).

## Desarrollo

```bash
npm install
npm run dev          # http://localhost:3000/tv?demo=1  y  http://localhost:3000/admin
npm run typecheck
npm run check:templates
npm run build && npm run check:tv
```

`/tv?demo=1` usa el catálogo con noticias y un anuncio manual de ejemplo. `/tv?preview=1&demo=1&scene=mockup` (o `kinetic`, `ticker`, `split`, `flash`)
muestra solo una escena; `scene` se ignora fuera de `preview=1`.

## Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. Storage → conecta **Upstash Redis** (Marketplace) y un **Blob Store público**. Vercel crea las variables solas.
3. Agrega `SYNC_SECRET` y `ADMIN_PASSWORD` (y opcionalmente `CRON_SECRET`) y vuelve a desplegar.
4. `vercel.json` programa el cron una vez al día (`0 11 * * *` UTC ≈ 5:00 en CDMX), que es lo que permite el plan Hobby.
   Además, si el contenido activo tiene más de 26 h, la propia consulta de la TV a `/api/playlist` dispara el respaldo
   en segundo plano (máximo un intento cada 30 min), así que no depende solo del cron.

## Contrato con Make.com

`POST https://pantalla-local.vercel.app/api/webhook/make` con `Authorization: Bearer <SYNC_SECRET>` y este JSON:

```json
{
  "generated_at": "ISO-8601",
  "instagram_videos": [{ "id": "string", "mp4_url": "string" }],
  "courses": [{ "id": "", "title": "", "description": "", "image_url": "", "course_url": "",
                "price": "", "hook_headline": "", "hook_subheadline": "" }],
  "daily_news": [{ "headline": "string", "source": "string" }]
}
```

Respuestas: `200` (guardado; incluye `dropped` si se descartó algún elemento inválido), `401`, `400` (JSON roto),
`413` (> 1 MB), `422` (estructura inválida; se conserva el contenido anterior), `500` (falta `SYNC_SECRET`), `503` (en Vercel sin Upstash Redis). Las claves extra se eliminan.
Si `hook_headline`/`hook_subheadline` llegan vacíos, se completan con `data/benfrank-templates.json`.

## Cómo funciona `/tv`

- **Cola**: ~40% reels, ~35% comerciales, ~25% anuncios manuales; nunca dos del mismo tipo seguidos y ningún ítem se repite
  hasta agotar los de su tipo (`src/lib/queue.ts`).
- **Comerciales de 12 s** (`src/components/tv/scenes`): 5 escenas en CSS/SVG/Canvas. Paleta, orden de escenas, patrón
  generativo y dispositivo se derivan de la fecha local de la TV (`YYYY-MM-DD`), así que cambian solos cada día.
  Cada comercial lleva un QR SVG generado al vuelo con `course_url`.
- **Anti-congelamiento**: `pause()` + `removeAttribute('src')` + `load()` antes de desmontar cada `<video>`, watchdog si el
  video se atasca 15 s, Wake Lock + `<video>` 1×1 en bucle, sincronización cada 15 min sin cortar el anuncio, y recarga
  limpia cada 6 h durante una transición **solo si el servidor respondió hace menos de 90 s**.

## Configurar la LG

Abre `https://pantalla-local.vercel.app/tv` en el navegador de webOS, ponlo en pantalla completa y desactiva el ahorro de energía /
apagado automático. Si la TV no gira el contenido del navegador al montarla en vertical, revisa la opción de rotación de
pantalla del modelo: el layout responde a la orientación que reporte el navegador.

## Avisos

- El feed de Google Noticias indica en su `<copyright>` que es para uso personal y no comercial. Para un escaparate
  comercial conviene usar un RSS cuya licencia lo permita (se cambia en `/admin` → Cursos → Feed de noticias).
- Las URLs `.mp4` de Instagram son enlaces firmados del CDN que caducan (parámetro `oe=`). Si Make.com deja de enviar
  datos, los reels viejos acabarán fallando y el reproductor los saltará al instante (`onError`), mientras los
  comerciales siguen renovándose.
