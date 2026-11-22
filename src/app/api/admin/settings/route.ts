import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseJson } from "@/lib/api";
import { DEFAULT_NEWS_RSS } from "@/lib/fallback/news";
import { SettingsSchema } from "@/lib/schema";
import { KEYS, updateKey } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Actualización parcial: solo cambia los campos enviados (feed de noticias y/o programas apagados). */
export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { data, error } = await parseJson(req, SettingsSchema);
  if (error) return error;
  const settings = await updateKey(KEYS.settings, (current) => ({
    newsRssUrl: data.newsRssUrl ?? current?.newsRssUrl ?? DEFAULT_NEWS_RSS,
    catalogDisabled: data.catalogDisabled ?? current?.catalogDisabled ?? [],
  }));
  return NextResponse.json({ ok: true, settings });
}
