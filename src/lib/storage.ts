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

function redis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  redisClient = url && token ? new Redis({ url, token }) : null;
  return redisClient;
}

export function storageBackend(): "redis" | "file" {
  return redis() ? "redis" : "file";
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
