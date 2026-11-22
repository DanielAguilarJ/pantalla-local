import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { newId, parseJson } from "@/lib/api";
import { isAllowedAdUrl } from "@/lib/media";
import { AdCreateSchema } from "@/lib/schema";
import { KEYS, updateKey } from "@/lib/storage";
import type { ManualAd } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ADS = 60;

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { data, error } = await parseJson(req, AdCreateSchema);
  if (error) return error;
  if (!isAllowedAdUrl(data.url, data.storage)) {
    return NextResponse.json({ error: "La URL del archivo no pertenece al almacenamiento de la app" }, { status: 400 });
  }

  const ad: ManualAd = {
    id: newId("ad"),
    kind: data.kind,
    url: data.url,
    title: data.title,
    durationSec: data.durationSec,
    active: true,
    storage: data.storage,
    createdAt: new Date().toISOString(),
  };

  let tooMany = false;
  await updateKey(KEYS.ads, (ads) => {
    const list = ads || [];
    if (list.length >= MAX_ADS) {
      tooMany = true;
      return list;
    }
    return [ad, ...list];
  });
  if (tooMany) return NextResponse.json({ error: `Máximo ${MAX_ADS} anuncios. Elimina alguno.` }, { status: 400 });
  return NextResponse.json({ ok: true, ad });
}
