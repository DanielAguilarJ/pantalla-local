import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseJson } from "@/lib/api";
import { SourceInputSchema } from "@/lib/schema";
import { KEYS, updateKey } from "@/lib/storage";
import type { FallbackCourseSource } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;

  const { data, error } = await parseJson(req, SourceInputSchema);
  if (error) return error;

  let updated: FallbackCourseSource | null = null;
  await updateKey(KEYS.sources, (list) =>
    (list || []).map((s) => {
      if (s.id !== id) return s;
      updated = {
        ...s,
        url: data.url,
        title: data.title || undefined,
        price: data.price || undefined,
        image_url: data.image_url || undefined,
      };
      return updated;
    }),
  );
  if (!updated) return NextResponse.json({ error: "URL no encontrada" }, { status: 404 });
  return NextResponse.json({ ok: true, source: updated });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;

  let found = false;
  await updateKey(KEYS.sources, (list) =>
    (list || []).filter((s) => {
      if (s.id === id) found = true;
      return s.id !== id;
    }),
  );
  if (!found) return NextResponse.json({ error: "URL no encontrada" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
