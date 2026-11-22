import { FLASH_LABELS, isSensitiveNews, relatedNews, TICKER_INTROS } from "@/lib/copy";
import { paletteForSeed, type Palette } from "@/lib/palettes";
import { dailySeed, pick, rngFrom, shuffle } from "@/lib/seed";
import type { Course, NewsItem, Playlist, PlaylistManual, PlaylistReel } from "@/lib/types";

export const COMMERCIAL_MS = 12_000;

export type SceneId = "mockup" | "kinetic" | "ticker" | "split" | "flash";
export const SCENES: SceneId[] = ["mockup", "kinetic", "ticker", "split", "flash"];
export type PatternId = "truchet" | "rings" | "stripes" | "dots" | "blocks";
const PATTERNS: PatternId[] = ["truchet", "rings", "stripes", "dots", "blocks"];

export interface CommercialSource {
  id: string;
  course: Course;
  news: NewsItem[];
}

export interface CommercialPlay {
  seed: string;
  palette: Palette;
  scene: SceneId;
  course: Course;
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

export function toSources(p: Playlist): { reel: PlaylistReel[]; commercial: CommercialSource[]; manual: PlaylistManual[] } {
  const news = p.news.filter((n) => !isSensitiveNews(n.headline));
  return {
    reel: p.reels,
    commercial: p.courses.map((course) => ({ id: course.id, course, news })),
    manual: p.manual,
  };
}

/** Orden de escenas del día: las 5 aparecen en ciclo y nunca se repite escena en dos comerciales seguidos. */
export function sceneFor(seed: string, playIndex: number): SceneId {
  const order = shuffle(rngFrom("scenes", seed), SCENES);
  return order[playIndex % order.length];
}

/** Todo lo visual se decide con la semilla del día (YYYY-MM-DD) + curso: cambia sola cada 24 h. */
export function isSceneId(v: unknown): v is SceneId {
  return typeof v === "string" && (SCENES as string[]).includes(v);
}

export function planCommercial(
  src: CommercialSource,
  playIndex: number,
  now = new Date(),
  forceScene?: SceneId,
): CommercialPlay {
  const seed = dailySeed(now);
  const rng = rngFrom("variant", seed, src.course.id, playIndex);
  const words = src.course.hook_headline.split(/\s+/).filter(Boolean);
  let underlineIndex = 0;
  words.forEach((w, i) => {
    if (w.replace(/[^\wáéíóúñü]/gi, "").length > words[underlineIndex].replace(/[^\wáéíóúñü]/gi, "").length) underlineIndex = i;
  });
  return {
    seed,
    palette: paletteForSeed(seed),
    scene: forceScene || sceneFor(seed, playIndex),
    course: src.course,
    news: src.news,
    featuredNews: relatedNews(rng, src.course, src.news),
    device: rng() < 0.5 ? "phone" : "laptop",
    pattern: pick(rng, PATTERNS),
    flashLabel: pick(rng, FLASH_LABELS),
    tickerIntro: pick(rng, TICKER_INTROS),
    underlineIndex,
  };
}
