import { createReadStream, promises as fs } from "node:fs";
import { Readable } from "node:stream";
import { localPathFor, MIME_BY_EXT } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ name: string }> };

/** Sirve los archivos subidos en modo local, con soporte de Range (necesario para <video>). */
export async function GET(req: Request, { params }: Ctx) {
  const { name } = await params;
  const file = localPathFor(name);
  if (!file) return new Response("No encontrado", { status: 404 });

  let size: number;
  try {
    size = (await fs.stat(file)).size;
  } catch {
    return new Response("No encontrado", { status: 404 });
  }

  const type = MIME_BY_EXT[name.split(".").pop() || ""] || "application/octet-stream";
  const baseHeaders = {
    "content-type": type,
    "accept-ranges": "bytes",
    "cache-control": "public, max-age=86400, immutable",
  };

  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") || "");
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(size - 1, end);
    if (start > end) return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
    const stream = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: { ...baseHeaders, "content-length": String(end - start + 1), "content-range": `bytes ${start}-${end}/${size}` },
    });
  }

  const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;
  return new Response(stream, { headers: { ...baseHeaders, "content-length": String(size) } });
}
