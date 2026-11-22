import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { loadAdminState } from "@/lib/admin-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json(await loadAdminState());
}
