import { promises as fs } from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";
import type { FallbackCourseSource, ManualAd, Settings, StoredContent, SyncReport } from "./types";

/**
 * Almacenamiento clave-valor:
 * - Upstash Redis / Vercel KV cuando hay credenciales (producción).
 * - Archivo JSON (/tmp/signage-state.json) como respaldo en desarrollo local.
 */

export const KEYS = {
  make: "signage:content:make",
  fallback: "signage:content:fallback",
  ads: "signage:ads",
  sources: "signage:fallback-sources",
  settings: "signage:settings",
  lastReport: "signage:sync:last-report",
  lastAttempt: "signage:sync:last-attempt",
} as const;

interface Schema {
  [KEYS.make]: StoredContent;
  [KEYS.fallback]: StoredContent;
  [KEYS.ads]: ManualAd[];
  [KEYS.sources]: FallbackCourseSource[];
  [KEYS.settings]: Settings;
  [KEYS.lastReport]: SyncReport;
  [KEYS.lastAttempt]: string;
}

type Key = keyof Schema;

export const STATE_FILE = process.env.SIGNAGE_STATE_FILE || "/tmp/signage-state.json";

let redisClient: Redis | null | undefined;

/**
 * Busca credenciales REST de Upstash. Acepta los nombres estándar y también los que Vercel crea cuando
 * se conecta el store con un prefijo personalizado (p. ej. STORAGE_KV_REST_API_URL).
 */
function redisCredentials(): { url: string; token: string } | null {
  const env = process.env;
  const pairs: Array<[string, string]> = [
    ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    ["KV_REST_API_URL", "KV_REST_API_TOKEN"],
  ];
  for (const key of Object.keys(env)) {
    for (const suffix of ["_UPSTASH_REDIS_REST_URL", "_KV_REST_API_URL"]) {
      if (key.endsWith(suffix)) pairs.push([key, key.replace(/_URL$/, "_TOKEN")]);
    }
  }
  for (const [urlKey, tokenKey] of pairs) {
    const url = env[urlKey];
    const token = env[tokenKey];
    if (url && token) return { url, token };
  }
  return null;
}

function redis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const creds = redisCredentials();
  redisClient = creds ? new Redis(creds) : null;
  return redisClient;
}

export function storageBackend(): "redis" | "file" {
  return redis() ? "redis" : "file";
}

/**
 * En Vercel cada ruta corre en su propia función con su propio /tmp: sin Redis, lo que guarda el webhook
 * no lo ve /api/playlist. Ahí el almacenamiento de archivo no sirve para compartir datos.
 */
export function storageIsShared(): boolean {
  return storageBackend() === "redis" || !process.env.VERCEL;
}

// ---- Backend de archivo ----
// Las escrituras se encadenan para que dos peticiones simultáneas no se pisen dentro del mismo proceso.
let fileChain: Promise<unknown> = Promise.resolve();

async function readFileState(): Promise<Record<string, unknown>> {
  try {
    const raw = await fs.readFile(STATE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("[storage] No se pudo leer el estado local:", err);
    }
    return {};
  }
}

async function writeFileState(state: Record<string, unknown>): Promise<void> {
  await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
  const tmp = `${STATE_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(state, null, 2), "utf8");
  await fs.rename(tmp, STATE_FILE); // rename es atómico: nunca queda un JSON a medias.
}

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = fileChain.then(task, task);
  fileChain = run.catch(() => undefined);
  return run;
}

// ---- API pública ----
export async function getKey<K extends Key>(key: K): Promise<Schema[K] | null> {
  const r = redis();
  if (r) return ((await r.get<Schema[K]>(key)) ?? null) as Schema[K] | null;
  const state = await enqueue(readFileState);
  return (state[key] as Schema[K] | undefined) ?? null;
}

export async function getKeys<K extends Key>(keys: K[]): Promise<{ [P in K]: Schema[P] | null }> {
  const out = {} as { [P in K]: Schema[P] | null };
  const r = redis();
  if (r) {
    const values = await r.mget<unknown[]>(...keys);
    keys.forEach((k, i) => {
      out[k] = (values[i] ?? null) as Schema[typeof k] | null;
    });
    return out;
  }
  const state = await enqueue(readFileState);
  for (const k of keys) out[k] = (state[k] as Schema[typeof k] | undefined) ?? null;
  return out;
}

export async function setKey<K extends Key>(key: K, value: Schema[K]): Promise<void> {
  const r = redis();
  if (r) {
    await r.set(key, value);
    return;
  }
  await enqueue(async () => {
    const state = await readFileState();
    state[key] = value;
    await writeFileState(state);
  });
}

/** Lectura-modificación-escritura (listas del panel /admin). */
export async function updateKey<K extends Key>(
  key: K,
  fn: (current: Schema[K] | null) => Schema[K],
): Promise<Schema[K]> {
  const r = redis();
  if (r) {
    const next = fn(((await r.get<Schema[K]>(key)) ?? null) as Schema[K] | null);
    await r.set(key, next);
    return next;
  }
  return enqueue(async () => {
    const state = await readFileState();
    const next = fn((state[key] as Schema[K] | undefined) ?? null);
    state[key] = next;
    await writeFileState(state);
    return next;
  });
}
