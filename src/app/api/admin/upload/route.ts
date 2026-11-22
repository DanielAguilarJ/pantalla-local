import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { ALLOWED_TYPES, blobConfigured } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Subida directa celular -> Vercel Blob (sin pasar el archivo por la función, así no aplica el
 * límite de 4.5 MB de Vercel). Esta ruta solo emite el token de subida, y únicamente a un admin.
 */
export async function POST(req: Request) {
  if (!blobConfigured()) {
    return NextResponse.json({ error: "Vercel Blob no está configurado (BLOB_READ_WRITE_TOKEN)." }, { status: 501 });
  }

  let body: HandleUploadBody;
  try {
    body = (await req.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // El aviso de "subida completada" lo firma Vercel y handleUpload lo verifica; el token lo pide el admin.
  if (body.type === "blob.generate-client-token" && !(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!/^signage\/[a-z0-9-]+\.(jpg|png|webp|mp4)$/.test(pathname)) throw new Error("Nombre de archivo inválido");
        return {
          allowedContentTypes: Object.keys(ALLOWED_TYPES),
          maximumSizeInBytes: Math.max(...Object.values(ALLOWED_TYPES).map((t) => t.maxBytes)),
          addRandomSuffix: true,
        };
      },
      // El registro del anuncio lo crea el panel con POST /api/admin/ads (funciona también en localhost).
      onUploadCompleted: async () => undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error de subida" }, { status: 400 });
  }
}
