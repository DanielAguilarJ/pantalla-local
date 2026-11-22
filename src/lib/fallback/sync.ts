import type { Course, MakePayload, NewsItem, StoredContent, SyncReport, SyncTrigger } from "../types";
import { generateHooks, withHooks } from "../copy";
import { dailySeedInZone } from "../seed";
import { getKeys, KEYS, setKey } from "../storage";
import { DEFAULT_NEWS_RSS, fetchNews } from "./news";
import { scrapeCourse } from "./scrape";

/** Si Make.com lleva más de este tiempo sin enviar datos, el motor de respaldo toma el control. */
export const MAKE_STALE_HOURS = 26;
const MAX_COURSES = 30;

export function hoursSince(iso: string | null | undefined, now = Date.now()): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : (now - t) / 3_600_000;
}

export function serverSeed(now = new Date()): string {
  return dailySeedInZone(now, process.env.SIGNAGE_TZ || "America/Mexico_City");
}

function dedupeByUrl(courses: Course[]): Course[] {
  const seen = new Set<string>();
  return courses.filter((c) => {
    const key = c.course_url.replace(/[#?].*$/, "").replace(/\/$/, "").toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export interface RunOptions {
  trigger: SyncTrigger;
  /** Ignora la ventana de 26 h (botón "Forzar sincronización ahora"). */
  force?: boolean;
}

/**
 * Motor autónomo de respaldo: scraping de cursos + RSS de noticias + banco local de copys.
 * No depende de ninguna API de IA ni de Make.com.
 */
export async function runFallbackSync({ trigger, force = false }: RunOptions): Promise<SyncReport> {
  const now = new Date();
  const state = await getKeys([KEYS.make, KEYS.fallback, KEYS.sources, KEYS.settings]);
  const make = state[KEYS.make];
  const previous = state[KEYS.fallback];
  const makeAge = hoursSince(make?.receivedAt, now.getTime());
  const makeFresh = makeAge !== null && makeAge < MAKE_STALE_HOURS;

  const report: SyncReport = {
    at: now.toISOString(),
    trigger,
    ran: false,
    reason: "",
    hoursSinceMake: makeAge === null ? null : Math.round(makeAge * 10) / 10,
    courses: [],
    news: { ok: false, count: 0 },
    saved: null,
  };

  if (makeFresh && !force) {
    report.reason = `Make.com envió datos hace ${report.hoursSinceMake} h (< ${MAKE_STALE_HOURS} h). No hace falta el respaldo.`;
    await setKey(KEYS.lastReport, report);
    return report;
  }

  report.ran = true;
  const seed = serverSeed(now);
  const sources = state[KEYS.sources] || [];
  const rssUrl = state[KEYS.settings]?.newsRssUrl || DEFAULT_NEWS_RSS;

  // 1) Noticias del día (si fallan, se conservan las últimas conocidas).
  let news: NewsItem[] = [];
  try {
    news = await fetchNews(rssUrl);
    report.news = { ok: true, count: news.length };
  } catch (err) {
    report.news = { ok: false, count: 0, error: err instanceof Error ? err.message : String(err) };
  }
  if (!news.length) {
    const latest = [make, previous]
      .filter((c): c is StoredContent => !!c)
      .sort((a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt))[0];
    news = latest?.payload.daily_news || [];
  }

  // 2) Scraping de las URLs de respaldo configuradas en /admin (en paralelo, cada una con timeout).
  const scraped = await Promise.all(sources.map((s) => scrapeCourse(s)));
  const scrapedCourses: Course[] = [];
  scraped.forEach((r, i) => {
    report.courses.push({ url: sources[i].url, ok: !!r.course, title: r.course?.title, error: r.error });
    if (r.course) scrapedCourses.push(r.course);
  });

  // 3) Ganchos con el banco local de fórmulas (semilla = fecha del día).
  const hooked = scrapedCourses.map((c) => ({ ...c, ...generateHooks({ seed, course: c, news }) }));
  // Los cursos de Make se conservan: con copy original si siguen frescos, con copy renovado si no.
  const makeCourses = (make?.payload.courses || []).map((c) =>
    makeFresh ? withHooks(c, seed, news) : { ...c, ...generateHooks({ seed, course: c, news }) },
  );
  const courses = dedupeByUrl([...hooked, ...makeCourses]).slice(0, MAX_COURSES);

  const videos = make?.payload.instagram_videos || previous?.payload.instagram_videos || [];

  if (!courses.length && !videos.length) {
    report.reason = "No hay cursos (ni URLs de respaldo válidas ni datos previos de Make.com) ni videos. Se conserva el contenido anterior.";
    await setKey(KEYS.lastReport, report);
    return report;
  }

  const payload: MakePayload = {
    generated_at: now.toISOString(),
    instagram_videos: videos,
    courses,
    daily_news: news,
  };
  await setKey(KEYS.fallback, { source: "fallback", receivedAt: now.toISOString(), payload });

  report.saved = { courses: courses.length, news: news.length, videos: videos.length };
  report.reason = force
    ? "Sincronización forzada desde /admin."
    : makeAge === null
      ? "Make.com nunca ha enviado datos; se generó contenido de respaldo."
      : `Make.com lleva ${report.hoursSinceMake} h sin enviar datos; se generó contenido de respaldo.`;
  await setKey(KEYS.lastReport, report);
  return report;
}

/** Throttle para el disparo "perezoso" desde /api/playlist (evita estampidas de varias TVs). */
export function shouldAttemptLazySync(lastAttempt: string | null, now = Date.now()): boolean {
  const h = hoursSince(lastAttempt, now);
  return h === null || h > 0.5;
}
