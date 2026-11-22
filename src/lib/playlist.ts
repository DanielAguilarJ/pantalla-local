import demo from "@data/demo-content.json";
import type { Course, ManualAd, NewsItem, Playlist, PlaylistReel, StoredContent } from "./types";
import { enabledPrograms, enrichCourse, isDisabled, profileFor, programAsCourse } from "./catalog";
import { withHooks } from "./copy";
import { tvMediaUrl } from "./media-proxy";
import { hashString } from "./seed";
import { serverSeed } from "./fallback/sync";
import { getKeys, KEYS } from "./storage";

/** Si hay menos reels de Instagram que esto, se suman los showreels oficiales de los programas. */
const MIN_INSTAGRAM_REELS = 3;
const SHOWREEL_MAX_SEC = 30;

/** El contenido más reciente gana: Make.com al día, o el respaldo cuando Make se calla > 26 h (o se fuerza). */
export function pickActive(make: StoredContent | null, fallback: StoredContent | null): StoredContent | null {
  if (make && fallback) return Date.parse(fallback.receivedAt) > Date.parse(make.receivedAt) ? fallback : make;
  return make || fallback;
}

function versionOf(p: Omit<Playlist, "version" | "serverTime">): string {
  return hashString(JSON.stringify(p)).toString(36);
}

function manualToPlaylist(ads: ManualAd[]): Playlist["manual"] {
  return ads
    .filter((a) => a.active)
    .map((a) => ({ id: a.id, kind: a.kind, src: a.url, durationSec: a.durationSec }));
}

/** Showreels de ultravelozmente.com para los programas activos (con marca y QR en pantalla). */
function showreels(disabled: readonly string[]): PlaylistReel[] {
  return enabledPrograms(disabled)
    .filter((p) => p.showreel_url)
    .map((p) => ({
      id: `showreel-${p.id}`,
      src: tvMediaUrl(p.showreel_url),
      maxSec: SHOWREEL_MAX_SEC,
      showreel: { title: p.title, course_url: p.course_url, benefit: p.benefit, ages: p.ages },
    }));
}

/** Prepara cursos para la TV: quita programas apagados, completa datos con el catálogo y rellena ganchos vacíos. */
export function prepareCourses(courses: Course[], seed: string, news: NewsItem[], disabled: readonly string[]): Course[] {
  return courses
    .filter((c) => !isDisabled(c, disabled))
    .map((c) => {
      const ready = withHooks(enrichCourse(c), seed, news, profileFor(c));
      return { ...ready, image_url: tvMediaUrl(ready.image_url) };
    });
}

export interface PlaylistBuild {
  playlist: Playlist;
  active: StoredContent | null;
}

export async function buildPlaylist(now = new Date()): Promise<PlaylistBuild> {
  const state = await getKeys([KEYS.make, KEYS.fallback, KEYS.ads, KEYS.settings]);
  const active = pickActive(state[KEYS.make], state[KEYS.fallback]);
  const disabled = state[KEYS.settings]?.catalogDisabled || [];
  const seed = serverSeed(now);
  const news = active?.payload.daily_news || [];

  // Sin datos todavía (recién desplegado): la pantalla arranca con el catálogo oficial de WorldBrain.
  const baseCourses = active?.payload.courses.length ? active.payload.courses : enabledPrograms(disabled).map(programAsCourse);
  const courses = prepareCourses(baseCourses, seed, news, disabled);

  const instagram: PlaylistReel[] = (active?.payload.instagram_videos || []).map((v) => ({ id: v.id, src: v.mp4_url }));
  const reels = instagram.length >= MIN_INSTAGRAM_REELS ? instagram : instagram.concat(showreels(disabled));

  const body: Omit<Playlist, "version" | "serverTime"> = {
    source: active ? active.source : "catalog",
    contentReceivedAt: active?.receivedAt || null,
    reels,
    courses,
    news,
    manual: manualToPlaylist(state[KEYS.ads] || []),
  };
  return { playlist: { ...body, version: versionOf(body), serverTime: now.toISOString() }, active };
}

/** Contenido de demostración (?demo=1): catálogo real + noticias y anuncio manual de ejemplo. */
export function demoPlaylist(now = new Date()): Playlist {
  const seed = serverSeed(now);
  const courses = prepareCourses(enabledPrograms().map(programAsCourse), seed, demo.daily_news, []);
  const body: Omit<Playlist, "version" | "serverTime"> = {
    source: "demo",
    contentReceivedAt: now.toISOString(),
    reels: showreels([]),
    courses,
    news: demo.daily_news,
    manual: demo.manual as Playlist["manual"],
  };
  return { ...body, version: versionOf(body), serverTime: now.toISOString() };
}
