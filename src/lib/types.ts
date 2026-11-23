// ---- Contrato de Make.com (POST /api/webhook/make) ----
export interface InstagramVideo {
  id: string;
  mp4_url: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  image_url: string;
  course_url: string;
  price: string;
  hook_headline: string;
  hook_subheadline: string;
}

export interface NewsItem {
  headline: string;
  source: string;
}

export interface MakePayload {
  generated_at: string;
  instagram_videos: InstagramVideo[];
  courses: Course[];
  daily_news: NewsItem[];
}

// ---- Almacenamiento ----
export type ContentSource = "make" | "fallback";

export interface StoredContent {
  source: ContentSource;
  /** Momento en que el servidor recibió/generó el contenido (no se confía en el reloj de Make). */
  receivedAt: string;
  payload: MakePayload;
}

export type ManualAdKind = "image" | "video";
export type MediaStorage = "blob" | "local";

export interface ManualAd {
  id: string;
  kind: ManualAdKind;
  url: string;
  title: string;
  /** Solo aplica a imágenes; los videos se reproducen completos. */
  durationSec: number;
  active: boolean;
  storage: MediaStorage;
  createdAt: string;
}

export interface FallbackCourseSource {
  id: string;
  url: string;
  /** Valores manuales opcionales: tienen prioridad sobre lo que encuentre el scraping. */
  title?: string;
  price?: string;
  image_url?: string;
  createdAt: string;
}

export interface Settings {
  newsRssUrl: string;
  /** IDs de programas del catálogo de WorldBrain que NO deben aparecer en pantalla. */
  catalogDisabled?: string[];
}

export type SyncTrigger = "cron" | "manual" | "lazy";

export interface SyncReport {
  at: string;
  trigger: SyncTrigger;
  ran: boolean;
  reason: string;
  hoursSinceMake: number | null;
  courses: { url: string; ok: boolean; title?: string; error?: string }[];
  news: { ok: boolean; count: number; error?: string };
  saved: { courses: number; news: number; videos: number } | null;
}

// ---- API pública del reproductor (GET /api/playlist) ----
export interface PlaylistReel {
  id: string;
  src: string;
  /** Corta la reproducción a los N segundos (showreels largos del sitio). */
  maxSec?: number;
  /** Presente cuando el video es el showreel oficial de un programa (se muestra con marca y QR). */
  showreel?: { title: string; course_url: string; benefit: string; ages: string; offer: string };
}

export interface PlaylistManual {
  id: string;
  kind: ManualAdKind;
  src: string;
  durationSec: number;
}

export interface Playlist {
  version: string;
  serverTime: string;
  source: ContentSource | "catalog" | "demo";
  contentReceivedAt: string | null;
  reels: PlaylistReel[];
  courses: Course[];
  news: NewsItem[];
  manual: PlaylistManual[];
}
