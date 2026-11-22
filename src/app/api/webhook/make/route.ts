import { NextResponse } from "next/server";
import { hasBearer } from "@/lib/auth";
import { validateMakePayload } from "@/lib/schema";
import { KEYS, setKey } from "@/lib/storage";

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
  await setKey(KEYS.make, { source: "make", receivedAt, payload: result.payload });

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
