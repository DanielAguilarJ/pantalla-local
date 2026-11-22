import { NextResponse } from "next/server";
import { hasBearer } from "@/lib/auth";
import { runFallbackSync } from "@/lib/fallback/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron llama a esta ruta con `Authorization: Bearer ${CRON_SECRET}`.
 * También acepta SYNC_SECRET para dispararla a mano (curl) o desde otro cron externo.
 * `?force=1` ignora la ventana de 26 h.
 */
export async function GET(req: Request) {
  const { CRON_SECRET, SYNC_SECRET } = process.env;
  if (!CRON_SECRET && !SYNC_SECRET) {
    return NextResponse.json({ ok: false, error: "Configura CRON_SECRET o SYNC_SECRET." }, { status: 500 });
  }
  if (!hasBearer(req, CRON_SECRET, SYNC_SECRET)) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const force = new URL(req.url).searchParams.get("force") === "1";
  try {
    const report = await runFallbackSync({ trigger: "cron", force });
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    console.error("[cron] fallback-sync falló:", err);
    return NextResponse.json({ ok: false, error: "Error interno al ejecutar el respaldo" }, { status: 500 });
  }
}
