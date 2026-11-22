import demo from "@data/demo-content.json";
import type { Course, ManualAd, Playlist, StoredContent } from "./types";
import { withHooks } from "./copy";
import { hashString } from "./seed";
import { serverSeed } from "./fallback/sync";
import { getKeys, KEYS } from "./storage";

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

export interface PlaylistBuild {
  playlist: Playlist;
  active: StoredContent | null;
}

export async function buildPlaylist(now = new Date()): Promise<PlaylistBuild> {
  const state = await getKeys([KEYS.make, KEYS.fallback, KEYS.ads]);
  const active = pickActive(state[KEYS.make], state[KEYS.fallback]);
  const seed = serverSeed(now);
  const news = active?.payload.daily_news || [];
  // Si a un curso le faltan ganchos, se completan con el banco local (nunca se muestra vacío).
  const courses: Course[] = (active?.payload.courses || []).map((c) => withHooks(c, seed, news));

  const body: Omit<Playlist, "version" | "serverTime"> = {
    source: active ? active.source : "empty",
    contentReceivedAt: active?.receivedAt || null,
    reels: (active?.payload.instagram_videos || []).map((v) => ({ id: v.id, src: v.mp4_url })),
    courses,
    news,
    manual: manualToPlaylist(state[KEYS.ads] || []),
  };
  return { playlist: { ...body, version: versionOf(body), serverTime: now.toISOString() }, active };
}

/** Contenido de demostración (?demo=1) para probar el motor sin Make.com. */
export function demoPlaylist(now = new Date()): Playlist {
  const seed = serverSeed(now);
  const body: Omit<Playlist, "version" | "serverTime"> = {
    source: "demo",
    contentReceivedAt: now.toISOString(),
    reels: demo.instagram_videos.map((v) => ({ id: v.id, src: v.mp4_url })),
    courses: (demo.courses as Course[]).map((c) => withHooks(c, seed, demo.daily_news)),
    news: demo.daily_news,
    manual: demo.manual as Playlist["manual"],
  };
  return { ...body, version: versionOf(body), serverTime: now.toISOString() };
}
