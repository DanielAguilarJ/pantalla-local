import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const ADMIN_COOKIE = "signage_admin";
const SESSION_DAYS = 30;

function sha256(input: string): Buffer {
  return createHash("sha256").update(input, "utf8").digest();
}

/** Comparación en tiempo constante (se comparan hashes para igualar longitudes). */
export function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(sha256(a), sha256(b));
}

/** Valida `Authorization: Bearer <secret>` contra cualquiera de los secretos configurados. */
export function hasBearer(req: Request, ...secrets: Array<string | undefined>): boolean {
  const header = req.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return false;
  const token = match[1].trim();
  return secrets.some((s) => typeof s === "string" && s.length > 0 && safeEqual(token, s));
}

function sessionSecret(): string | null {
  if (process.env.ADMIN_SESSION_SECRET) return process.env.ADMIN_SESSION_SECRET;
  if (!process.env.ADMIN_PASSWORD) return null;
  // Derivado de la contraseña: si se cambia ADMIN_PASSWORD, todas las sesiones quedan inválidas.
  return sha256(`signage-session::${process.env.ADMIN_PASSWORD}::${process.env.SYNC_SECRET || ""}`).toString("hex");
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(now = Date.now()): { token: string; maxAge: number } | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const maxAge = SESSION_DAYS * 86_400;
  const exp = Math.floor(now / 1000) + maxAge;
  return { token: `${exp}.${sign(`admin:${exp}`, secret)}`, maxAge };
}

export function verifySessionToken(token: string | undefined | null, now = Date.now()): boolean {
  const secret = sessionSecret();
  if (!secret || !token) return false;
  const [expStr, sig] = token.split(".");
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || !sig || exp * 1000 < now) return false;
  return safeEqual(sig, sign(`admin:${exp}`, secret));
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(password, expected);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

/** Devuelve una respuesta 401 si la petición no tiene sesión de administrador válida. */
export async function requireAdmin(): Promise<NextResponse | null> {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "ADMIN_PASSWORD no está configurada en el servidor." }, { status: 500 });
  }
  if (await isAdmin()) return null;
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}
