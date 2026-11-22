import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ALLOWED_TYPES, blobConfigured, LOCAL_MEDIA_PREFIX, LOCAL_UPLOAD_DIR, localPathFor, sniffMime } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Subida para desarrollo local (sin Vercel Blob). Guarda en /tmp/signage-uploads. */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (blobConfigured()) {
    return NextResponse.json({ error: "Usa la subida a Vercel Blob" }, { status: 400 });
  }
  if (process.env.VERCEL) {
    // En Vercel, /tmp es temporal y no se comparte entre instancias: los anuncios desaparecerían.
    return NextResponse.json(
      { error: "En Vercel necesitas un Blob Store público (BLOB_READ_WRITE_TOKEN) para subir archivos." },
      { status: 501 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formulario inválido" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });

  const declared = ALLOWED_TYPES[file.type];
  if (!declared) return NextResponse.json({ error: "Formato no permitido (JPG, PNG, WebP o MP4)" }, { status: 400 });
  if (file.size > declared.maxBytes) {
    return NextResponse.json({ error: `Archivo demasiado grande (máx. ${declared.maxBytes / 1024 / 1024} MB)` }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const real = sniffMime(bytes.subarray(0, 16));
  if (!real || ALLOWED_TYPES[real]?.kind !== declared.kind) {
    return NextResponse.json({ error: "El contenido del archivo no coincide con su formato" }, { status: 400 });
  }

  const name = `${randomUUID()}.${ALLOWED_TYPES[real].ext}`;
  const target = localPathFor(name);
  if (!target) return NextResponse.json({ error: "Nombre inválido" }, { status: 500 });
  await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  await fs.writeFile(target, bytes);

  return NextResponse.json({ ok: true, url: `${LOCAL_MEDIA_PREFIX}${name}`, kind: declared.kind, storage: "local" });
}
