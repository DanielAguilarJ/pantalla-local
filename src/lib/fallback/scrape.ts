import * as cheerio from "cheerio";
import type { Course, FallbackCourseSource } from "../types";
import { hashString } from "../seed";
import { isHttpUrl } from "../schema";
import { fetchText } from "./http";

type Doc = cheerio.CheerioAPI;

function meta($: Doc, ...selectors: string[]): string {
  for (const sel of selectors) {
    const v = $(sel).first().attr("content");
    if (v && v.trim()) return v.trim();
  }
  return "";
}

function absolute(src: string, base: string): string {
  if (!src) return "";
  try {
    const u = new URL(src, base);
    return isHttpUrl(u.toString()) ? u.toString() : "";
  } catch {
    return "";
  }
}

export function formatPrice(amount: string | number, currency?: string): string {
  const n = typeof amount === "number" ? amount : Number(String(amount).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n)) return "";
  if (n === 0) return "Gratis";
  const cur = (currency || "MXN").toUpperCase();
  try {
    const formatted = new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: cur,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: Number.isInteger(n) ? 0 : 2,
    }).format(n);
    return `${formatted} ${cur}`;
  } catch {
    return `$${n} ${cur}`;
  }
}

/** Busca offers.price / lowPrice en bloques JSON-LD (Product, Course, Offer...). */
function jsonLdPrice($: Doc): string {
  let found = "";
  const visit = (node: unknown, depth: number): void => {
    if (found || !node || depth > 8) return;
    if (Array.isArray(node)) {
      node.forEach((n) => visit(n, depth + 1));
      return;
    }
    if (typeof node !== "object") return;
    const obj = node as Record<string, unknown>;
    const price = obj.price ?? obj.lowPrice;
    if ((typeof price === "string" || typeof price === "number") && String(price).trim() !== "") {
      found = formatPrice(price, typeof obj.priceCurrency === "string" ? obj.priceCurrency : undefined);
      return;
    }
    Object.values(obj).forEach((v) => visit(v, depth + 1));
  };
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      visit(JSON.parse($(el).text()), 0);
    } catch {
      /* JSON-LD inválido: se ignora */
    }
  });
  return found;
}

const PRICE_RE =
  /(?:US\$|MX\$|\$|€|USD|MXN|EUR)\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?(?:\s?(?:MXN|USD|EUR|COP|ARS|CLP|PEN))?/;

function findPrice($: Doc): string {
  const ld = jsonLdPrice($);
  if (ld) return ld;
  const amount = meta($, 'meta[property="product:price:amount"]', 'meta[property="og:price:amount"]');
  if (amount) {
    return formatPrice(amount, meta($, 'meta[property="product:price:currency"]', 'meta[property="og:price:currency"]'));
  }
  const itemprop = $('[itemprop="price"]').first();
  const ip = itemprop.attr("content") || itemprop.text();
  if (ip && /\d/.test(ip)) return formatPrice(ip, $('[itemprop="priceCurrency"]').first().attr("content"));
  const bodyText = $("body").text().replace(/\s+/g, " ");
  const m = PRICE_RE.exec(bodyText);
  return m ? m[0].trim() : "";
}

function cleanTitle(raw: string): string {
  const t = raw.replace(/\s+/g, " ").trim();
  // "Curso X | Academia" -> "Curso X" (solo si el primer segmento es suficientemente descriptivo).
  const first = t.split(/\s[|–—·]\s|\s-\s/)[0]?.trim() || t;
  return first.length >= 6 ? first : t;
}

function truncateWords(text: string, max: number): string {
  const w = text.replace(/\s+/g, " ").trim().split(" ");
  return w.length <= max ? w.join(" ") : `${w.slice(0, max).join(" ")}…`;
}

export interface ScrapeResult {
  course: Course | null;
  error?: string;
}

/** Convierte una URL de curso (configurada en /admin) en un Course del contrato, sin IA. */
export async function scrapeCourse(source: FallbackCourseSource): Promise<ScrapeResult> {
  const base: Course = {
    id: `fb-${hashString(source.url).toString(36)}`,
    title: source.title?.trim() || "",
    description: "",
    image_url: source.image_url?.trim() || "",
    course_url: source.url,
    price: source.price?.trim() || "",
    hook_headline: "",
    hook_subheadline: "",
  };

  try {
    const { text, finalUrl } = await fetchText(source.url);
    const $ = cheerio.load(text);
    const title =
      base.title ||
      cleanTitle(
        meta($, 'meta[property="og:title"]', 'meta[name="twitter:title"]') ||
          $("h1").first().text() ||
          $("title").first().text(),
      );
    const description = truncateWords(
      meta($, 'meta[property="og:description"]', 'meta[name="description"]', 'meta[name="twitter:description"]') ||
        $("main p, article p, p").first().text(),
      40,
    );
    const image =
      base.image_url ||
      absolute(
        meta($, 'meta[property="og:image"]', 'meta[property="og:image:url"]', 'meta[name="twitter:image"]') ||
          $('link[rel="image_src"]').attr("href") ||
          $("main img, article img").first().attr("src") ||
          "",
        finalUrl,
      );
    const price = base.price || findPrice($);

    if (!title) return { course: null, error: "No se encontró título en la página" };
    return { course: { ...base, title, description, image_url: image, price } };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Si el admin escribió un título manual, el curso sigue sirviendo aunque la página no responda.
    if (base.title) return { course: base, error: `Sin scraping (${message}); se usaron los datos manuales` };
    return { course: null, error: message };
  }
}
