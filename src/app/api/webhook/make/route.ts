import { NextResponse } from "next/server";
import { hasBearer } from "@/lib/auth";
import { validateMakePayload } from "@/lib/schema";
import { KEYS, setKey, storageIsShared } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 1_000_000;

export async function POST(req: Request) {
  if (!process.env.SYNC_SECRET) {
    return NextResponse.json({ ok: false, error: "SYNC_SECRET no está configurado en el servidor." }, { status: 500 });
  }
  if (!hasBearer(req, process.env.SYNC_SECRET)) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }
  // Responder 200 sin almacenamiento compartido haría creer a Make.com que todo salió bien
  // mientras la pantalla nunca ve los datos. Mejor un error claro que Make marque como fallido.
  if (!storageIsShared()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Falta Upstash Redis en Vercel (UPSTASH_REDIS_REST_URL/TOKEN o KV_REST_API_URL/TOKEN). Sin él la pantalla no puede leer lo que envía Make.com. Conéctalo en Vercel → Storage y vuelve a desplegar.",
      },
      { status: 503 },
    );
  }

  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "Payload demasiado grande (máx. 1 MB)" }, { status: 413 });
  }
  const raw = await req.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "Payload demasiado grande (máx. 1 MB)" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "El cuerpo no es JSON válido" }, { status: 400 });
  }

  const result = validateMakePayload(body);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: "Esquema inválido", issues: result.issues }, { status: 422 });
  }

  const receivedAt = new Date().toISOString();
  try {
    await setKey(KEYS.make, { source: "make", receivedAt, payload: result.payload });
  } catch (err) {
    console.error("[webhook] No se pudo guardar el contenido:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo guardar en el almacenamiento (revisa las credenciales de Upstash Redis). Make.com puede reintentar." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    receivedAt,
    saved: {
      instagram_videos: result.payload.instagram_videos.length,
      courses: result.payload.courses.length,
      daily_news: result.payload.daily_news.length,
    },
    dropped: result.dropped,
  });
}
