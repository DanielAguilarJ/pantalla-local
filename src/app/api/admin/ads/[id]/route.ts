import { promises as fs } from "node:fs";
import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseJson } from "@/lib/api";
import { LOCAL_MEDIA_PREFIX, localPathFor } from "@/lib/media";
import { AdUpdateSchema } from "@/lib/schema";
import { KEYS, updateKey } from "@/lib/storage";
import type { ManualAd } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;

  const { data, error } = await parseJson(req, AdUpdateSchema);
  if (error) return error;

  let updated: ManualAd | null = null;
  await updateKey(KEYS.ads, (ads) =>
    (ads || []).map((a) => {
      if (a.id !== id) return a;
      updated = { ...a, ...data };
      return updated;
    }),
  );
  if (!updated) return NextResponse.json({ error: "Anuncio no encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true, ad: updated });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;

  let removed: ManualAd | null = null;
  await updateKey(KEYS.ads, (ads) =>
    (ads || []).filter((a) => {
      if (a.id === id) removed = a;
      return a.id !== id;
    }),
  );
  if (!removed) return NextResponse.json({ error: "Anuncio no encontrado" }, { status: 404 });

  // Borra también el archivo para no acumular almacenamiento.
  const ad = removed as ManualAd;
  try {
    if (ad.storage === "blob" && process.env.BLOB_READ_WRITE_TOKEN) {
      await del(ad.url);
    } else if (ad.storage === "local") {
      const file = localPathFor(ad.url.slice(LOCAL_MEDIA_PREFIX.length));
      if (file) await fs.unlink(file).catch(() => undefined);
    }
  } catch (err) {
    console.error("[admin] No se pudo borrar el archivo del anuncio:", err);
  }
  return NextResponse.json({ ok: true });
}
