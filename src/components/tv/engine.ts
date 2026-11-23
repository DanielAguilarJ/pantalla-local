import brandData from "@data/worldbrain-brand.json";
import { findProgram } from "@/lib/catalog";
import { FLASH_LABELS, isSensitiveNews, relatedNews, TICKER_INTROS } from "@/lib/copy";
import { paletteForSeed, type Palette } from "@/lib/palettes";
import { dailySeed, pick, rngFrom, shuffle } from "@/lib/seed";
import type { Course, NewsItem, Playlist, PlaylistManual, PlaylistReel } from "@/lib/types";

export const COMMERCIAL_MS = 12_000;

/** Escenas de comercial de un curso (1–5 originales, 6–7 pensadas primero para pantalla vertical). */
export type SceneId = "mockup" | "kinetic" | "ticker" | "split" | "flash" | "cover" | "index";
export const SCENES: SceneId[] = ["mockup", "kinetic", "ticker", "split", "flash", "cover", "index"];

/** Anuncios institucionales de WorldBrain (no dependen de un solo curso). */
export type SpotId = "testimonial" | "method" | "numbers" | "ritual" | "stages";
export const SPOTS: SpotId[] = ["testimonial", "method", "numbers", "ritual", "stages"];

export type PatternId = "truchet" | "rings" | "stripes" | "dots" | "blocks";
const PATTERNS: PatternId[] = ["truchet", "rings", "stripes", "dots", "blocks"];

export type Testimonial = (typeof brandData.testimonials)[number];
export const BRAND_CONTENT = brandData;

/** Fila del índice de programas (datos del catálogo cuando el curso está ahí). */
export interface RosterItem {
  id: string;
  number: number;
  course: Course;
  benefit: string;
  ages: string;
  audience: string[];
}

export type CommercialSource =
  | { id: string; kind: "course"; course: Course; news: NewsItem[]; roster: RosterItem[] }
  | { id: string; kind: "brand"; spot: SpotId; roster: RosterItem[]; testimonials: Testimonial[] };

interface PlayBase {
  seed: string;
  palette: Palette;
  /** Curso al que apunta el QR ("Escanea para ver temario"). */
  course: Course;
  roster: RosterItem[];
  featured: RosterItem;
}

export interface CoursePlay extends PlayBase {
  kind: "course";
  scene: SceneId;
  /** Noticias aptas para el ticker (sin tragedias). */
  news: NewsItem[];
  featuredNews: NewsItem | null;
  device: "phone" | "laptop";
  pattern: PatternId;
  flashLabel: string;
  tickerIntro: string;
  /** Índice de la palabra del titular que recibe el subrayado SVG. */
  underlineIndex: number;
}

export interface BrandPlay extends PlayBase {
  kind: "brand";
  spot: SpotId;
  testimonial: Testimonial | null;
  /** Posición del testimonio en la serie (para "03 / 12"). */
  testimonialIndex: number;
}

export type CommercialPlay = CoursePlay | BrandPlay;

function buildRoster(courses: Course[]): RosterItem[] {
  return courses.map((course, i) => {
    const p = findProgram(course);
    return {
      id: course.id,
      number: i + 1,
      course,
      benefit: p?.benefit || "",
      ages: p?.ages || "",
      audience: p?.audience || [],
    };
  });
}

function rosterFind(roster: RosterItem[], programId: string): RosterItem | undefined {
  return roster.find((r) => findProgram(r.course)?.id === programId || r.id === programId);
}

export function toSources(p: Playlist): { reel: PlaylistReel[]; commercial: CommercialSource[]; manual: PlaylistManual[] } {
  const news = p.news.filter((n) => !isSensitiveNews(n.headline));
  const roster = buildRoster(p.courses);
  const courseSources: CommercialSource[] = roster.map((r) => ({ id: r.id, kind: "course", course: r.course, news, roster }));
  // Testimonios solo de programas que están en pantalla (si el admin apaga uno, sus testimonios desaparecen).
  const testimonials = brandData.testimonials.filter((t) => rosterFind(roster, t.program));
  // Los testimonios (prueba social) entran 3 veces en la bolsa: salen más seguido que los demás anuncios de marca
  // y, como comparten contador, cada aparición muestra un testimonio distinto.
  const spotSlots: SpotId[] = roster.length
    ? SPOTS.reduce<SpotId[]>((acc, s) => {
        if (s !== "testimonial") return acc.concat(s);
        return testimonials.length ? acc.concat([s, s, s]) : acc;
      }, [])
    : [];
  const brandSources: CommercialSource[] = spotSlots.map((spot, i) => ({
    id: `brand-${spot}-${i}`,
    kind: "brand",
    spot,
    roster,
    testimonials,
  }));
  return { reel: p.reels, commercial: courseSources.concat(brandSources), manual: p.manual };
}

/** Orden de escenas del día: todas aparecen en ciclo y nunca se repite escena en dos comerciales seguidos. */
export function sceneFor(seed: string, playIndex: number): SceneId {
  const order = shuffle(rngFrom("scenes", seed), SCENES);
  return order[playIndex % order.length];
}

export function isSceneId(v: unknown): v is SceneId {
  return typeof v === "string" && (SCENES as string[]).includes(v);
}

export function isSpotId(v: unknown): v is SpotId {
  return typeof v === "string" && (SPOTS as string[]).includes(v);
}

export type PreviewTarget = SceneId | SpotId;

/** Todo lo visual se decide con la semilla del día (YYYY-MM-DD) + curso: cambia sola cada 24 h. */
export function planCommercial(
  src: CommercialSource,
  playIndex: number,
  now = new Date(),
  forceScene?: SceneId,
): CommercialPlay {
  const seed = dailySeed(now);
  const palette = paletteForSeed(seed);

  if (src.kind === "brand") {
    const rng = rngFrom("spot", seed, src.spot, playIndex);
    let testimonial: Testimonial | null = null;
    let testimonialIndex = 0;
    let featured = pick(rng, src.roster);
    if (src.spot === "testimonial" && src.testimonials.length) {
      // Recorre los testimonios en orden barajado del día: no se repite uno hasta mostrarlos todos.
      const order = shuffle(rngFrom("testimonials", seed), src.testimonials);
      testimonial = order[playIndex % order.length];
      testimonialIndex = brandData.testimonials.indexOf(testimonial);
      featured = rosterFind(src.roster, testimonial.program) || featured;
    }
    return { kind: "brand", spot: src.spot, seed, palette, roster: src.roster, featured, course: featured.course, testimonial, testimonialIndex };
  }

  const rng = rngFrom("variant", seed, src.course.id, playIndex);
  const words = src.course.hook_headline.split(/\s+/).filter(Boolean);
  let underlineIndex = 0;
  words.forEach((w, i) => {
    if (w.replace(/[^\wáéíóúñü]/gi, "").length > words[underlineIndex].replace(/[^\wáéíóúñü]/gi, "").length) underlineIndex = i;
  });
  const featured = src.roster.find((r) => r.id === src.course.id) || {
    id: src.course.id,
    number: 1,
    course: src.course,
    benefit: "",
    ages: "",
    audience: [],
  };
  return {
    kind: "course",
    seed,
    palette,
    scene: forceScene || sceneFor(seed, playIndex),
    course: src.course,
    roster: src.roster,
    featured,
    news: src.news,
    featuredNews: relatedNews(rng, src.course, src.news),
    device: rng() < 0.5 ? "phone" : "laptop",
    pattern: pick(rng, PATTERNS),
    flashLabel: pick(rng, FLASH_LABELS),
    tickerIntro: pick(rng, TICKER_INTROS),
    underlineIndex,
  };
}
