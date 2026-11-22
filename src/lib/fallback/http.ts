import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const USER_AGENT =
  "Mozilla/5.0 (compatible; PantallaLocalBot/1.0; +https://vercel.com) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateIp(v6.slice(7));
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
}

/**
 * Las URLs las escribe el administrador, pero el servidor las descarga: se bloquean destinos
 * internos (localhost, redes privadas, metadatos de la nube) para evitar SSRF.
 */
export async function assertPublicUrl(raw: string): Promise<URL> {
  const url = new URL(raw);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Solo se permiten URLs http(s)");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("Destino no permitido");
  }
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addresses.length || addresses.some((a) => isPrivateIp(a.address))) throw new Error("Destino no permitido");
  return url;
}

export interface FetchedText {
  text: string;
  finalUrl: string;
}

/** fetch con timeout, límite de tamaño y verificación anti-SSRF en cada salto de redirección. */
export async function fetchText(
  rawUrl: string,
  { timeoutMs = 8000, maxBytes = 2_500_000, accept = "text/html,application/xhtml+xml" } = {},
): Promise<FetchedText> {
  let current = await assertPublicUrl(rawUrl);
  const signal = AbortSignal.timeout(timeoutMs);

  for (let hop = 0; hop < 5; hop++) {
    const res = await fetch(current, {
      redirect: "manual",
      signal,
      cache: "no-store",
      headers: { "user-agent": USER_AGENT, accept, "accept-language": "es-MX,es;q=0.9,en;q=0.5" },
    });

    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      current = await assertPublicUrl(new URL(res.headers.get("location") as string, current).toString());
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (!res.body) return { text: "", finalUrl: current.toString() };

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        break; // Para meta-etiquetas basta con el inicio del documento.
      }
      chunks.push(value);
    }
    return { text: Buffer.concat(chunks).toString("utf8"), finalUrl: current.toString() };
  }
  throw new Error("Demasiadas redirecciones");
}
