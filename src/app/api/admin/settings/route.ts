import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseJson } from "@/lib/api";
import { SettingsSchema } from "@/lib/schema";
import { KEYS, setKey } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { data, error } = await parseJson(req, SettingsSchema);
  if (error) return error;
  await setKey(KEYS.settings, data);
  return NextResponse.json({ ok: true, settings: data });
}
