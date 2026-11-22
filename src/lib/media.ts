import path from "node:path";
import type { ManualAdKind, MediaStorage } from "./types";

export const LOCAL_UPLOAD_DIR = process.env.SIGNAGE_UPLOAD_DIR || "/tmp/signage-uploads";
export const LOCAL_MEDIA_PREFIX = "/api/media/";
export const LOCAL_FILE_RE = /^[a-z0-9-]{8,64}\.(jpg|png|webp|mp4)$/;

export const ALLOWED_TYPES: Record<string, { ext: string; kind: ManualAdKind; maxBytes: number }> = {
  "image/jpeg": { ext: "jpg", kind: "image", maxBytes: 15 * 1024 * 1024 },
  "image/png": { ext: "png", kind: "image", maxBytes: 15 * 1024 * 1024 },
  "image/webp": { ext: "webp", kind: "image", maxBytes: 15 * 1024 * 1024 },
  "video/mp4": { ext: "mp4", kind: "video", maxBytes: 250 * 1024 * 1024 },
};

export const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp4: "video/mp4",
};

export function blobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

/** Comprueba la firma binaria real del archivo (no basta con confiar en la extensión o el MIME del navegador). */
export function sniffMime(bytes: Uint8Array): string | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length >= 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") {
    return "image/webp";
  }
  if (b.length >= 12 && String.fromCharCode(...b.slice(4, 8)) === "ftyp") return "video/mp4";
  return null;
}

/** Solo se aceptan URLs de anuncios que vengan de nuestro Blob Store o de la carpeta local de subidas. */
export function isAllowedAdUrl(url: string, storage: MediaStorage): boolean {
  if (storage === "local") {
    if (!url.startsWith(LOCAL_MEDIA_PREFIX)) return false;
    return LOCAL_FILE_RE.test(url.slice(LOCAL_MEDIA_PREFIX.length));
  }
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export function localPathFor(fileName: string): string | null {
  if (!LOCAL_FILE_RE.test(fileName)) return null;
  return path.join(LOCAL_UPLOAD_DIR, fileName);
}
