import { NextResponse } from "next/server";
import { storageBackend, storageIsShared } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * La TV consulta esto antes de recargarse: si el servidor no responde, no se recarga (evita pantallas de error).
 * También sirve para revisar de un vistazo si el almacenamiento está bien configurado (sin exponer secretos).
 */
export function GET() {
  return NextResponse.json({
    ok: true,
    time: new Date().toISOString(),
    storage: storageBackend(),
    storageShared: storageIsShared(),
  });
}
