/**
 * ultravelozmente.com responde con `Cross-Origin-Resource-Policy: same-origin`, así que el navegador de la TV
 * bloquea sus imágenes y videos dentro de pantalla-local.vercel.app (ERR_BLOCKED_BY_RESPONSE.NotSameOrigin).
 * next.config.ts reescribe /wb-media/* hacia https://ultravelozmente.com/images/* (proxy en el CDN de Vercel),
 * con lo que los archivos llegan como "mismo origen" sin copiarlos ni guardarlos aparte.
 */
export const WB_MEDIA_PREFIX = "/wb-media/";
const WB_IMAGES = /^https?:\/\/(?:www\.)?ultravelozmente\.com\/images\/([A-Za-z0-9._\-/]+)$/;

export function tvMediaUrl(url: string): string {
  const m = WB_IMAGES.exec(url.trim());
  return m ? `${WB_MEDIA_PREFIX}${m[1]}` : url;
}
