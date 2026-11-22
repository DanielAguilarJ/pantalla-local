import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** La TV consulta esto antes de recargarse: si el servidor no responde, no se recarga (evita pantallas de error). */
export function GET() {
  return NextResponse.json({ ok: true, time: new Date().toISOString() });
}
