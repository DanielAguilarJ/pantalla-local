import { after, NextResponse } from "next/server";
import { buildPlaylist, demoPlaylist } from "@/lib/playlist";
import { hoursSince, MAKE_STALE_HOURS, runFallbackSync, shouldAttemptLazySync } from "@/lib/fallback/sync";
import { getKey, KEYS, setKey } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (new URL(req.url).searchParams.get("demo") === "1") {
    return NextResponse.json(demoPlaylist());
  }

  const { playlist, active } = await buildPlaylist();

  // Red de seguridad además del cron diario: si el contenido activo es viejo (> 26 h),
  // la propia consulta de la TV dispara el motor de respaldo en segundo plano.
  const age = hoursSince(active?.receivedAt);
  if (age === null || age > MAKE_STALE_HOURS) {
    after(async () => {
      try {
        if (!shouldAttemptLazySync(await getKey(KEYS.lastAttempt))) return;
        await setKey(KEYS.lastAttempt, new Date().toISOString());
        await runFallbackSync({ trigger: "lazy" });
      } catch (err) {
        console.error("[playlist] respaldo perezoso falló:", err);
      }
    });
  }

  return NextResponse.json(playlist);
}
