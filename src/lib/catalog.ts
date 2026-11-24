import catalogData from "@data/worldbrain-catalog.json";
import type { CopyProfile } from "./copy";
import type { Course } from "./types";

export type Audience = "ninos" | "jovenes" | "adultos";

export interface CatalogProgram extends Course {
  benefit: string;
  ages: string;
  audience: Audience[];
  showreel_url: string;
  /** Oferta publicada en la página del programa (p. ej. "Clase muestra gratis + diagnóstico de nivel"). */
  offer: string;
  /** Versión corta para etiquetas (≤ 26 caracteres). */
  offer_short: string;
  /** Escasez real publicada en la página (p. ej. "Cupos limitados por semana"). */
  urgency: string;
  /** Foto con personas publicada en la página del programa (vacía si no hay). */
  photo_url: string;
  /** Pregunta publicitaria para la pantalla (≤ 7 palabras): segmenta al público de un vistazo. */
  question: string;
}

export const CATALOG: CatalogProgram[] = (catalogData.programs as Array<Omit<CatalogProgram, "hook_headline" | "hook_subheadline">>).map(
  (p) => ({ ...p, hook_headline: "", hook_subheadline: "" }),
);

function normalizeUrl(u: string): string {
  return u.replace(/^https?:\/\/(www\.)?/i, "").replace(/[#?].*$/, "").replace(/\/$/, "").toLowerCase();
}

const BY_ID = new Map(CATALOG.map((p) => [p.id, p]));
const BY_URL = new Map(CATALOG.map((p) => [normalizeUrl(p.course_url), p]));

/** Encuentra el programa del catálogo que corresponde a un curso (por id o por URL). */
export function findProgram(course: Pick<Course, "id" | "course_url">): CatalogProgram | undefined {
  return BY_ID.get(course.id) || BY_URL.get(normalizeUrl(course.course_url));
}

export function enabledPrograms(disabledIds: readonly string[] = []): CatalogProgram[] {
  const off = new Set(disabledIds);
  return CATALOG.filter((p) => !off.has(p.id));
}

/** Completa campos vacíos de un curso (p. ej. enviado por Make.com) con los datos oficiales del catálogo. */
export function enrichCourse(course: Course): Course {
  const p = findProgram(course);
  if (!p) return course;
  return {
    ...course,
    description: course.description.trim() || p.description,
    image_url: course.image_url.trim() || p.image_url,
    price: course.price.trim() || p.price,
  };
}

/** Contrato público del curso (sin campos internos), listo para enviarse a Make.com o a la TV. */
export function programAsCourse(p: CatalogProgram): Course {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    image_url: p.image_url,
    course_url: p.course_url,
    price: p.price,
    hook_headline: p.hook_headline,
    hook_subheadline: p.hook_subheadline,
  };
}

/** Público, beneficio y edades del programa, para que el copy automático le hable a quien corresponde. */
export function profileFor(course: Pick<Course, "id" | "course_url">): CopyProfile | undefined {
  const p = findProgram(course);
  return p ? { audience: p.audience, benefit: p.benefit, ages: p.ages, offer: p.offer_short } : undefined;
}

export function isDisabled(course: Pick<Course, "id" | "course_url">, disabledIds: readonly string[]): boolean {
  if (!disabledIds.length) return false;
  const p = findProgram(course);
  return !!p && disabledIds.includes(p.id);
}
