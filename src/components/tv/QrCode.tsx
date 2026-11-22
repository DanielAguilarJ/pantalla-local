"use client";

import { create } from "qrcode";
import { memo, useMemo } from "react";

interface Props {
  value: string;
  dark: string;
  light?: string;
  className?: string;
}

const QUIET = 3; // zona de silencio (módulos) para que los celulares lo detecten a distancia

/** QR generado al vuelo como un único <path> SVG (nítido a cualquier tamaño y orientación). */
function QrCodeImpl({ value, dark, light = "#FFFFFF", className }: Props) {
  const { d, size } = useMemo(() => {
    try {
      const qr = create(value, { errorCorrectionLevel: "M" });
      const n = qr.modules.size;
      const data = qr.modules.data;
      let path = "";
      for (let y = 0; y < n; y++) {
        let x = 0;
        while (x < n) {
          if (!data[y * n + x]) {
            x++;
            continue;
          }
          const start = x;
          while (x < n && data[y * n + x]) x++;
          path += `M${start + QUIET} ${y + QUIET}h${x - start}v1h-${x - start}z`;
        }
      }
      return { d: path, size: n + QUIET * 2 };
    } catch {
      return { d: "", size: 0 };
    }
  }, [value]);

  if (!size) return null;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`Código QR: ${value}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <rect width={size} height={size} fill={light} />
      <path d={d} fill={dark} />
    </svg>
  );
}

export const QrCode = memo(QrCodeImpl);

/** Tarjeta blanca con QR + "Escanea para ver temario". La posición la decide cada escena vía className. */
export function QrBadge({ url, dark, className = "" }: { url: string; dark: string; className?: string }) {
  return (
    <div className={`qr-badge ${className}`}>
      <QrCode value={url} dark={dark} className="qr-svg" />
      <div className="qr-label">Escanea para ver temario</div>
    </div>
  );
}
