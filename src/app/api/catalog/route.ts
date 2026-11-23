import { NextResponse } from "next/server";
import { BRAND } from "@/lib/brand";
import { enabledPrograms } from "@/lib/catalog";
import { getKey, KEYS } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Catálogo público de programas de WorldBrain México (solo datos que ya están en ultravelozmente.com).
 * Make.com lo lee para armar `courses` sin tener que hacer scraping del sitio:
 * cada elemento ya trae los campos del contrato del webhook (hook_* vacíos para que la IA los redacte),
 * más `benefit`, `ages` y `audience` como contexto para el copy.
 */
export async function GET() {
  const settings = await getKey(KEYS.settings);
  const programs = enabledPrograms(settings?.catalogDisabled || []);
  return NextResponse.json({
    brand: {
      name: BRAND.name,
      tagline: BRAND.tagline,
      site: BRAND.site,
      whatsapp: BRAND.whatsappDisplay,
      facts: BRAND.facts,
    },
    count: programs.length,
    courses: programs.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      image_url: p.image_url,
      course_url: p.course_url,
      price: p.price,
      hook_headline: "",
      hook_subheadline: "",
      benefit: p.benefit,
      ages: p.ages,
      audience: p.audience,
    })),
  });
}
