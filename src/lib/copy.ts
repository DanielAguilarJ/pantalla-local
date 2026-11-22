import templates from "@data/benfrank-templates.json";
import type { Course, NewsItem } from "./types";
import { pick, rngFrom, shuffle, type Rng } from "./seed";

export type CopyAudience = "ninos" | "jovenes" | "adultos";

interface Template {
  id: string;
  audience: string; // "todos" | CopyAudience
  text: string;
}

/** Datos del programa que afinan el copy (vienen del catálogo de WorldBrain cuando el curso está ahí). */
export interface CopyProfile {
  audience: CopyAudience[];
  benefit: string;
  ages: string;
}

const HEADLINES: Template[] = templates.headlines;
const SUBHEADLINES: Template[] = templates.subheadlines;
export const FLASH_LABELS: string[] = templates.flash_labels;
export const TICKER_INTROS: string[] = templates.ticker_intros;

const STOPWORDS = new Set(
  "el la los las un una unos unas de del al a en y o u que por para con sin sobre tras entre ante bajo hacia hasta según su sus se lo le les es son fue ser ha han hay como más menos muy ya no si sí este esta estos estas ese esa eso aquí allí cuando donde qué cómo cuál quién nuevo nueva nuevos nuevas hoy ayer mañana tu tus mi mis".split(
    " ",
  ),
);

// Una pantalla comercial no debe usar tragedias como gancho publicitario.
const SENSITIVE = /(muert|muri[óo]|fallec|asesin|homicid|feminicid|v[íi]ctima|herid[oa]|sismo|terremoto|tsunami|hurac[áa]n|inundaci|incendio|tragedia|accidente|explosi[óo]n|guerra|bombarde|ataque|atentado|terroris|violencia|violaci[óo]n|abuso|secuestr|desaparec|narco|c[áa]rtel|balacera|bloqueo|disparo|cad[áa]ver|fosa|suicid|c[áa]ncer|epidemia|pandemia|detenid|crimen|criminal|delincu|asalto|extorsi|migrante|deporta)/i;
// Palabras cortas que solo cuentan como palabra completa ("robo" sí, "robot" no; "arma" sí, "farmacia" no).
const SENSITIVE_WORDS = /(^|[^a-záéíóúñü])(robos?|rob[óo]|armas?|choques?|captura|capturan?|brotes?|presos?)(?=$|[^a-záéíóúñü])/i;

export function isSensitiveNews(headline: string): boolean {
  return SENSITIVE.test(headline) || SENSITIVE_WORDS.test(headline);
}

function words(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

/** "Curso de Excel Avanzado para Finanzas | Academia X" -> "Excel Avanzado" */
export function shortCourseName(title: string): string {
  let t = title.split(/\s[|–—·-]\s/)[0] || title;
  t = t.replace(/^(curso|taller|diplomado|masterclass|programa|bootcamp|certificaci[óo]n|clase)s?\s+(online\s+|en\s+l[ií]nea\s+)?(de|en|sobre|para)?\s*/i, "");
  t = t.replace(/[.:;,!¡?¿]+$/g, "").trim();
  const w = words(t).slice(0, 3);
  // Si el corte deja una palabra vacía colgando ("Marketing Digital desde"), se quita.
  while (w.length > 1 && (STOPWORDS.has(w[w.length - 1].toLowerCase()) || /^(desde|hasta|sobre)$/i.test(w[w.length - 1]))) w.pop();
  return w.join(" ") || title.trim();
}

/** Extrae un tema corto (1–2 palabras) de un titular: prioriza nombres propios. */
export function newsTopic(headline: string): string | null {
  const clean = headline.replace(/[«»"“”'‘’()]/g, " ").replace(/\s+/g, " ").trim();
  const w = words(clean);
  // Nombres propios (mayúscula inicial, no la primera palabra salvo siglas).
  for (let i = 0; i < w.length; i++) {
    const token = w[i].replace(/[.,:;!?¡¿]+$/g, "");
    // Siglas cortas (UNAM, IPN, SEP, IA); una palabra larga en mayúsculas suele ser énfasis, no un nombre.
    const isAcronym = /^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ0-9]{1,4}$/.test(token);
    const isProper = /^[A-ZÁÉÍÓÚÑ][a-záéíóúñü]{2,}$/.test(token) && i > 0;
    if ((isAcronym || isProper) && !STOPWORDS.has(token.toLowerCase())) {
      const nextTok = (w[i + 1] || "").replace(/[.,:;!?¡¿]+$/g, "");
      if (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñü]{2,}$/.test(nextTok)) return `${token} ${nextTok}`;
      return token;
    }
  }
  const candidates = w
    .map((x) => x.replace(/[.,:;!?¡¿]+$/g, ""))
    .filter((x) => x.length > 4 && !STOPWORDS.has(x.toLowerCase()));
  return candidates[0] ? candidates[0].toLowerCase() : null;
}

interface Vars {
  curso: string;
  noticia: string | null;
  precio: string;
  beneficio: string;
  edad: string;
}

function fill(text: string, vars: Vars): string | null {
  const values: Record<string, string> = {
    curso: vars.curso,
    noticia: vars.noticia || "",
    precio: vars.precio,
    beneficio: vars.beneficio,
    // "Todas las edades" -> "Para todas las edades."
    edad: vars.edad && !/^\d/.test(vars.edad) ? vars.edad.charAt(0).toLowerCase() + vars.edad.slice(1) : vars.edad,
  };
  let missing = false;
  const out = text.replace(/{{(\w+)}}/g, (_, key: string) => {
    const v = values[key];
    if (!v) missing = true;
    return v || "";
  });
  if (missing) return null;
  // Mayúscula inicial tras sustituir (p. ej. "{{noticia}} va y viene").
  return out.charAt(0).toUpperCase() + out.slice(1);
}

/**
 * Elige una fórmula del banco. Si se conoce el público del programa, ~65% de las veces prueba primero
 * las fórmulas de ese público (p. ej. "Tu hijo…" para MatheKids) y después las generales.
 * Si no se conoce, solo usa las generales ("todos"), para no hablarle de "tu hijo" a un curso ejecutivo.
 */
function fromBank(rng: Rng, bank: Template[], vars: Vars, maxWords: number, audience: CopyAudience[]): string {
  const general = shuffle(rng, bank.filter((t) => t.audience === "todos"));
  const specific = shuffle(rng, bank.filter((t) => (audience as string[]).includes(t.audience)));
  const ordered = rng() < 0.65 ? specific.concat(general) : general.concat(specific);
  for (const tpl of ordered) {
    const text = fill(tpl.text, vars);
    if (text && words(text).length <= maxWords) return text;
  }
  return vars.curso || "Aprende algo nuevo hoy.";
}

/** Escoge la noticia "relacionada" con un curso por coincidencia de palabras (si no hay, una al azar). */
export function relatedNews(rng: Rng, course: Pick<Course, "title" | "description">, news: NewsItem[]): NewsItem | null {
  const safe = news.filter((n) => !isSensitiveNews(n.headline));
  if (!safe.length) return null;
  const courseWords = new Set(
    words(`${course.title} ${course.description}`.toLowerCase())
      .map((x) => x.replace(/[^a-záéíóúñü0-9]/g, ""))
      .filter((x) => x.length > 3 && !STOPWORDS.has(x)),
  );
  let best: NewsItem | null = null;
  let bestScore = 0;
  for (const n of safe) {
    let score = 0;
    for (const token of words(n.headline.toLowerCase())) {
      if (courseWords.has(token.replace(/[^a-záéíóúñü0-9]/g, ""))) score++;
    }
    if (score > bestScore) {
      best = n;
      bestScore = score;
    }
  }
  return best || pick(rng, safe);
}

export interface HookInput {
  seed: string;
  course: Pick<Course, "id" | "title" | "description" | "price">;
  news: NewsItem[];
  profile?: CopyProfile;
}

/** Genera hook_headline + hook_subheadline deterministas para (día, curso). */
export function generateHooks({ seed, course, news, profile }: HookInput): { hook_headline: string; hook_subheadline: string } {
  const rng = rngFrom("hooks", seed, course.id);
  const related = relatedNews(rng, course, news);
  const vars: Vars = {
    curso: shortCourseName(course.title),
    noticia: related ? newsTopic(related.headline) : null,
    precio: course.price.trim(),
    beneficio: profile?.benefit || "",
    edad: profile?.ages || "",
  };
  const audience = profile?.audience || [];
  return {
    hook_headline: fromBank(rng, HEADLINES, vars, 10, audience),
    hook_subheadline: fromBank(rng, SUBHEADLINES, vars, 16, audience),
  };
}

/** Rellena ganchos vacíos sin tocar los que ya vienen (p. ej. redactados por Make.com). */
export function withHooks(course: Course, seed: string, news: NewsItem[], profile?: CopyProfile): Course {
  if (course.hook_headline.trim() && course.hook_subheadline.trim()) return course;
  const hooks = generateHooks({ seed, course, news, profile });
  return {
    ...course,
    hook_headline: course.hook_headline.trim() || hooks.hook_headline,
    hook_subheadline: course.hook_subheadline.trim() || hooks.hook_subheadline,
  };
}
