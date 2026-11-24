import brandData from "@data/worldbrain-brand.json";
import { findProgram } from "@/lib/catalog";
import { FLASH_LABELS, isSensitiveNews, relatedNews, TICKER_INTROS } from "@/lib/copy";
import { paletteForSeed, type Palette } from "@/lib/palettes";
import { tvMediaUrl } from "@/lib/media-proxy";
import { DAYPART_WEIGHTS, daypartAt, type Daypart } from "@/lib/sede-time";
import { dailySeed, pick, rngFrom, shuffle } from "@/lib/seed";
import type { Course, NewsItem, Playlist, PlaylistManual, PlaylistReel } from "@/lib/types";

export const COMMERCIAL_MS = 12_000;

/**
 * Escenas de comercial de un curso (1–5 originales; 6–8 pensadas primero para vertical;
 * 9–12 "texto gigante": cada renglón llena el ancho de la pantalla, para leerse desde lejos).
 */
export type SceneId =
  | "mockup" | "kinetic" | "ticker" | "split" | "flash" | "cover" | "index" | "scan"
  | "beats" | "question" | "age" | "checklist";
export const SCENES: SceneId[] = [
  "mockup", "kinetic", "ticker", "split", "flash", "cover", "index", "scan",
  "beats", "question", "age", "checklist",
];
/** Escenas de texto gigante: cuentan triple en el orden del día (60 % de los comerciales de curso). */
export const BIG_SCENES: SceneId[] = ["beats", "question", "age", "checklist"];

/** Anuncios institucionales de WorldBrain (no dependen de un solo curso). */
export type SpotId =
  | "testimonial" | "method" | "numbers" | "ritual" | "stages" | "contact" | "hours" | "gallery" | "story"
  | "slogan" | "free";
export const SPOTS: SpotId[] = [
  "testimonial", "method", "numbers", "ritual", "stages", "contact", "hours", "gallery", "story", "slogan", "free",
];

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
  /** Oferta real del programa (vacía si su página no publica una). */
  offer: string;
  offerShort: string;
  urgency: string;
  /** Foto con personas (por el proxy /wb-media/); vacía si el programa no tiene. */
  photo: string;
  /** Pregunta publicitaria del programa (vacía si el curso no está en el catálogo). */
  question: string;
}

export type CommercialSource =
  | { id: string; weight: number; kind: "course"; course: Course; news: NewsItem[]; roster: RosterItem[] }
  | { id: string; weight: number; group: string; kind: "brand"; spot: SpotId; roster: RosterItem[]; testimonials: Testimonial[] };

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
      offer: p?.offer || "",
      offerShort: p?.offer_short || "",
      urgency: p?.urgency || "",
      photo: p?.photo_url ? tvMediaUrl(p.photo_url) : "",
      question: p?.question || "",
    };
  });
}

function rosterFind(roster: RosterItem[], programId: string): RosterItem | undefined {
  return roster.find((r) => findProgram(r.course)?.id === programId || r.id === programId);
}

/** Peso por franja: el público del programa con mayor peso en esta hora (programas sin público → 1). */
function audienceWeight(r: RosterItem, daypart: Daypart | undefined): number {
  if (!daypart || !r.audience.length) return 1;
  const w = DAYPART_WEIGHTS[daypart] as Record<string, number>;
  return Math.max(...r.audience.map((a) => (w[a] === undefined ? 1 : w[a])));
}

/** En la noche y el domingo la sede está cerrada: se refuerzan "escríbenos" y el horario. */
function spotWeight(spot: SpotId, daypart: Daypart | undefined): number {
  if (daypart === "noche" && (spot === "contact" || spot === "hours")) return 2;
  return 1;
}

function weightedPick(rng: () => number, roster: RosterItem[], daypart: Daypart): RosterItem {
  const weights = roster.map((r) => audienceWeight(r, daypart));
  let x = rng() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < roster.length; i++) {
    x -= weights[i];
    if (x <= 0) return roster[i];
  }
  return roster[roster.length - 1];
}

export function toSources(
  p: Playlist,
  daypart?: Daypart,
): { reel: PlaylistReel[]; commercial: CommercialSource[]; manual: PlaylistManual[] } {
  const news = p.news.filter((n) => !isSensitiveNews(n.headline));
  const roster = buildRoster(p.courses);
  const courseSources: CommercialSource[] = roster.map((r) => ({
    id: r.id,
    weight: audienceWeight(r, daypart),
    kind: "course",
    course: r.course,
    news,
    roster,
  }));
  // Testimonios solo de programas que están en pantalla (si el admin apaga uno, sus testimonios desaparecen).
  const testimonials = brandData.testimonials.filter((t) => rosterFind(roster, t.program));
  // Los testimonios (prueba social) entran 3 veces en la bolsa: salen más seguido que los demás anuncios de marca
  // y, como comparten contador, cada aparición muestra un testimonio distinto.
  // La historia Antes/Después (caras reales + transformación) cuenta doble; solo si su programa está en pantalla.
  const storyOn = !!rosterFind(roster, brandData.transformation.program);
  const offers = roster.filter((r) => r.offer).length;
  const spotSlots: SpotId[] = roster.length
    ? SPOTS.reduce<SpotId[]>((acc, s) => {
        if (s === "testimonial") return testimonials.length ? acc.concat([s, s, s]) : acc;
        if (s === "story") return storyOn ? acc.concat([s, s]) : acc;
        // "GRATIS" gigante: necesita al menos 2 programas con oferta publicada; cuenta doble.
        if (s === "free") return offers >= 2 ? acc.concat([s, s]) : acc;
        return acc.concat(s);
      }, [])
    : [];
  const brandSources: CommercialSource[] = spotSlots.map((spot, i) => ({
    id: `brand-${spot}-${i}`,
    group: `brand-${spot}`,
    weight: spotWeight(spot, daypart),
    kind: "brand",
    spot,
    roster,
    testimonials,
  }));
  return { reel: p.reels, commercial: courseSources.concat(brandSources), manual: p.manual };
}

/** Separa repetidos contiguos en un ciclo (también entre el último y el primero). */
function noAdjacent<T>(deck: T[]): T[] {
  const n = deck.length;
  const ok = (i: number) => deck[i] !== deck[(i + 1) % n] && deck[i] !== deck[(i - 1 + n) % n];
  for (let i = 0; i < n; i++) {
    const k = (i + 1) % n;
    if (deck[i] !== deck[k]) continue;
    for (let j = 0; j < n; j++) {
      if (j === i || j === k) continue;
      const t = deck[k];
      deck[k] = deck[j];
      deck[j] = t;
      if (ok(k) && ok(j)) break;
      deck[j] = deck[k];
      deck[k] = t;
    }
  }
  return deck;
}

const deckCache: { seed: string; deck: SceneId[] } = { seed: "", deck: [] };

/**
 * Orden de escenas del día: todas aparecen en ciclo, las de texto gigante tres veces por ciclo,
 * y nunca se repite escena en dos comerciales seguidos.
 */
export function sceneFor(seed: string, playIndex: number): SceneId {
  if (deckCache.seed !== seed) {
    deckCache.seed = seed;
    deckCache.deck = noAdjacent(shuffle(rngFrom("scenes", seed), SCENES.concat(BIG_SCENES, BIG_SCENES)));
  }
  const order = deckCache.deck;
  return order[playIndex % order.length];
}

export function isSceneId(v: unknown): v is SceneId {
  return typeof v === "string" && (SCENES as string[]).includes(v);
}

export function isSpotId(v: unknown): v is SpotId {
  return typeof v === "string" && (SPOTS as string[]).includes(v);
}

/** "endcard" = solo cierres (QR + WhatsApp gigante), para revisarlos en /admin. */
export type PreviewTarget = SceneId | SpotId | "endcard";

export function isPreviewTarget(v: unknown): v is PreviewTarget {
  return v === "endcard" || isSceneId(v) || isSpotId(v);
}

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
    // El programa recomendado también sigue la franja horaria (p. ej. infantiles a la salida de escuelas).
    let featured = weightedPick(rng, src.roster, daypartAt(now));
    if (src.spot === "story") featured = rosterFind(src.roster, brandData.transformation.program) || featured;
    if (src.spot === "free") {
      const withOffer = src.roster.filter((r) => r.offer);
      if (withOffer.length) featured = weightedPick(rng, withOffer, daypartAt(now));
    }
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
    offer: "",
    offerShort: "",
    urgency: "",
    photo: "",
    question: "",
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
