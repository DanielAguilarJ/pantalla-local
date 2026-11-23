import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // /admin muestra /tv dentro de un iframe propio; nadie más puede incrustar la app.
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  // Ver src/lib/media-proxy.ts: proxy de solo lectura para las imágenes y showreels de ultravelozmente.com.
  async rewrites() {
    return [{ source: "/wb-media/:file*", destination: "https://ultravelozmente.com/images/:file*" }];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // La TV nunca debe servir HTML o JSON viejo desde caché.
      // no-referrer: el CDN de Instagram responde CORP same-origin cuando ve un Referer externo.
      {
        source: "/tv",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
      // Todas las APIs sin caché, excepto /api/media (archivos subidos en modo local).
      { source: "/api/:path((?!media/).*)", headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }] },
      { source: "/admin", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
