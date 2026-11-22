import { z } from "zod";
import type { Course, InstagramVideo, MakePayload, NewsItem } from "./types";

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

const text = (max: number) => z.string().trim().max(max);
const requiredText = (max: number) => text(max).min(1, "No puede estar vacío");
const httpUrl = z.string().trim().max(2048).refine(isHttpUrl, "Debe ser una URL http(s) válida");
const optionalHttpUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => v === "" || isHttpUrl(v), "Debe ser una URL http(s) válida o vacía");

export const InstagramVideoSchema = z.object({
  id: requiredText(200),
  mp4_url: httpUrl,
});

export const CourseSchema = z.object({
  id: requiredText(200),
  title: requiredText(200),
  description: text(2000),
  image_url: optionalHttpUrl,
  course_url: httpUrl,
  price: text(60),
  hook_headline: text(200),
  hook_subheadline: text(300),
});

export const NewsItemSchema = z.object({
  headline: requiredText(300),
  source: text(120),
});

const EnvelopeSchema = z.object({
  generated_at: z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Debe ser una fecha ISO-8601"),
  instagram_videos: z.array(z.unknown()).max(200),
  courses: z.array(z.unknown()).max(100),
  daily_news: z.array(z.unknown()).max(100),
});

export interface ValidationIssue {
  path: string;
  message: string;
}

function issuesOf(error: z.ZodError, prefix: string): ValidationIssue[] {
  return error.issues.map((i) => ({
    path: [prefix, ...i.path.map(String)].filter(Boolean).join("."),
    message: i.message,
  }));
}

export type MakeValidation =
  | { ok: true; payload: MakePayload; dropped: ValidationIssue[] }
  | { ok: false; issues: ValidationIssue[] };

/**
 * Valida el JSON de Make.com.
 * La estructura de primer nivel es obligatoria; los elementos individuales inválidos se descartan
 * (y se reportan) para que un solo curso mal formado no tumbe la actualización completa del día.
 * Las claves desconocidas se eliminan: solo se guarda exactamente el esquema del contrato.
 */
export function validateMakePayload(input: unknown): MakeValidation {
  const envelope = EnvelopeSchema.safeParse(input);
  if (!envelope.success) return { ok: false, issues: issuesOf(envelope.error, "") };

  const dropped: ValidationIssue[] = [];
  function collect<T>(items: unknown[], schema: z.ZodType<T>, name: string): T[] {
    const out: T[] = [];
    items.forEach((item, i) => {
      const r = schema.safeParse(item);
      if (r.success) out.push(r.data);
      else dropped.push(...issuesOf(r.error, `${name}.${i}`));
    });
    return out;
  }

  const payload: MakePayload = {
    generated_at: new Date(envelope.data.generated_at).toISOString(),
    instagram_videos: collect<InstagramVideo>(envelope.data.instagram_videos, InstagramVideoSchema, "instagram_videos"),
    courses: collect<Course>(envelope.data.courses, CourseSchema, "courses"),
    daily_news: collect<NewsItem>(envelope.data.daily_news, NewsItemSchema, "daily_news"),
  };

  const total = payload.instagram_videos.length + payload.courses.length + payload.daily_news.length;
  if (total === 0) {
    return {
      ok: false,
      issues: dropped.length
        ? dropped
        : [{ path: "", message: "El payload no trae videos, cursos ni noticias; se conserva el contenido anterior." }],
    };
  }
  return { ok: true, payload, dropped };
}

// ---- Entradas del panel /admin ----
export const AdCreateSchema = z.object({
  kind: z.enum(["image", "video"]),
  url: z.string().trim().min(1).max(2048),
  storage: z.enum(["blob", "local"]),
  title: text(120).default(""),
  durationSec: z.coerce.number().int().min(3).max(300).default(10),
});

export const AdUpdateSchema = z
  .object({
    title: text(120),
    durationSec: z.coerce.number().int().min(3).max(300),
    active: z.boolean(),
  })
  .partial();

export const SourceInputSchema = z.object({
  url: httpUrl,
  title: text(200).optional(),
  price: text(60).optional(),
  image_url: optionalHttpUrl.optional(),
});

export const SettingsSchema = z.object({
  newsRssUrl: httpUrl,
});
