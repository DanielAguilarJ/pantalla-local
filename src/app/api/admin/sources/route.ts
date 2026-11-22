import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { newId, parseJson } from "@/lib/api";
import { SourceInputSchema } from "@/lib/schema";
import { KEYS, updateKey } from "@/lib/storage";
import type { FallbackCourseSource } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SOURCES = 30;

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { data, error } = await parseJson(req, SourceInputSchema);
  if (error) return error;

  const source: FallbackCourseSource = {
    id: newId("src"),
    url: data.url,
    title: data.title || undefined,
    price: data.price || undefined,
    image_url: data.image_url || undefined,
    createdAt: new Date().toISOString(),
  };

  let rejected = "";
  await updateKey(KEYS.sources, (list) => {
    const current = list || [];
    if (current.length >= MAX_SOURCES) rejected = `Máximo ${MAX_SOURCES} URLs de respaldo.`;
    else if (current.some((s) => s.url === source.url)) rejected = "Esa URL ya está registrada.";
    return rejected ? current : [...current, source];
  });
  if (rejected) return NextResponse.json({ error: rejected }, { status: 400 });
  return NextResponse.json({ ok: true, source });
}
