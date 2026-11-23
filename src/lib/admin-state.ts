import type { FallbackCourseSource, ManualAd, Settings, StoredContent, SyncReport } from "./types";
import { blobConfigured } from "./media";
import { pickActive } from "./playlist";
import { DEFAULT_NEWS_RSS } from "./fallback/news";
import { hoursSince, MAKE_STALE_HOURS } from "./fallback/sync";
import { getKeys, KEYS, storageBackend } from "./storage";

export interface ContentSummary {
  receivedAt: string;
  generatedAt: string;
  ageHours: number | null;
  counts: { videos: number; courses: number; news: number };
}

export interface AdminState {
  ads: ManualAd[];
  sources: FallbackCourseSource[];
  settings: Settings;
  status: {
    storage: "redis" | "file";
    blob: boolean;
    onVercel: boolean;
    syncSecretConfigured: boolean;
    staleHours: number;
    make: ContentSummary | null;
    fallback: ContentSummary | null;
    active: "make" | "fallback" | null;
    lastReport: SyncReport | null;
  };
}

function summarize(c: StoredContent | null): ContentSummary | null {
  if (!c) return null;
  const age = hoursSince(c.receivedAt);
  return {
    receivedAt: c.receivedAt,
    generatedAt: c.payload.generated_at,
    ageHours: age === null ? null : Math.round(age * 10) / 10,
    counts: {
      videos: c.payload.instagram_videos.length,
      courses: c.payload.courses.length,
      news: c.payload.daily_news.length,
    },
  };
}

export async function loadAdminState(): Promise<AdminState> {
  const s = await getKeys([KEYS.make, KEYS.fallback, KEYS.ads, KEYS.sources, KEYS.settings, KEYS.lastReport]);
  const active = pickActive(s[KEYS.make], s[KEYS.fallback]);
  return {
    ads: s[KEYS.ads] || [],
    sources: s[KEYS.sources] || [],
    settings: {
      newsRssUrl: s[KEYS.settings]?.newsRssUrl || DEFAULT_NEWS_RSS,
      catalogDisabled: s[KEYS.settings]?.catalogDisabled || [],
    },
    status: {
      storage: storageBackend(),
      blob: blobConfigured(),
      onVercel: !!process.env.VERCEL,
      syncSecretConfigured: !!process.env.SYNC_SECRET,
      staleHours: MAKE_STALE_HOURS,
      make: summarize(s[KEYS.make]),
      fallback: summarize(s[KEYS.fallback]),
      active: active ? active.source : null,
      lastReport: s[KEYS.lastReport],
    },
  };
}
