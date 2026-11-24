// Prompt listo para pegar en Maia (Make.com, Plan Mode). También está en docs/make-com.md.
export const PRODUCTION_ORIGIN = "https://pantalla-local.vercel.app";

export function makeMaiaPrompt(origin: string = PRODUCTION_ORIGIN): string {
  return `Crea un escenario de Make.com que alimente la pantalla del local de WorldBrain México todos los días.

DISPARADOR
- Programación diaria a las 06:00 (zona horaria America/Mexico_City).

PASO 1 · Catálogo de programas
- Módulo HTTP "Make a request": GET ${origin}/api/catalog
- Parsear la respuesta como JSON. Usar el arreglo "courses" (programas oficiales con id, title, description, image_url, course_url, price, benefit, ages, audience, offer, offer_short, urgency y question).

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
  · hook_subheadline: máximo 14 palabras. Si el programa trae "offer", úsala tal cual como protagonista
    (p. ej. "Clase muestra gratis + diagnóstico de nivel: escanea y agenda"). Si no, beneficio concreto
    basado en description, benefit y ages. Si trae "urgency", puede cerrar con ella.
  · Si trae "question" (pregunta directa al público), puede usarse tal cual como hook_headline.
  · Reglas de publicidad exterior: se lee en 3 segundos, una sola idea, verbos de acción, sin signos de más.
- Prohibido inventar precios, descuentos, becas, garantías, ofertas o resultados: solo las ofertas que vienen en "offer". WorldBrain tiene grupos de máximo 7 participantes y está en Cuautitlán Izcalli desde 2000; solo usa esos datos.
- Conservar sin cambios id, title, description, image_url, course_url y price tal como llegan del Paso 1.

PASO 5 · Enviar a la pantalla
- Módulo HTTP "Make a request":
  · URL: ${origin}/api/webhook/make
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
- Ante cualquier error, enviarme una notificación por correo.`;
}
