import { NextResponse } from "next/server";
import type { z } from "zod";

/** Lee y valida un cuerpo JSON. Devuelve los datos o una respuesta 400 lista para retornar. */
export async function parseJson<T>(
  req: Request,
  schema: z.ZodType<T>,
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { data: null, error: NextResponse.json({ error: "JSON inválido" }, { status: 400 }) };
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ");
    return { data: null, error: NextResponse.json({ error: message }, { status: 400 }) };
  }
  return { data: result.data, error: null };
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
