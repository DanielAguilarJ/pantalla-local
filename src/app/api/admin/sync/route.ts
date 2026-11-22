import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { runFallbackSync } from "@/lib/fallback/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Botón "Forzar sincronización ahora": ejecuta el motor de respaldo sin esperar la ventana de 26 h. */
export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const report = await runFallbackSync({ trigger: "manual", force: true });
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    console.error("[admin] sync falló:", err);
    return NextResponse.json({ error: "Error interno al sincronizar" }, { status: 500 });
  }
}
