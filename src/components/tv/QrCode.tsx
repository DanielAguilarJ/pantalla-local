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

function ScanIcon() {
  return (
    <svg className="qr-ico" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="2" width="12" height="20" rx="2.6" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M9.5 8h2v2h-2zM12.5 8h2v2h-2zM9.5 11h2v2h-2zM13 12h1.5v1.5H13z" fill="currentColor" />
      <path d="M10.5 18.5h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Tarjeta blanca con QR + "Escanea para ver temario", con esquinas de visor que "respiran" y un pulso
 * alrededor para atraer la mirada (solo transform/opacity; las esquinas nunca tapan los módulos del QR).
 * La posición la decide cada escena vía className.
 */
export function QrBadge({
  url,
  dark,
  className = "",
  offer = "",
  urgency = "",
}: {
  url: string;
  dark: string;
  className?: string;
  /** Oferta real del programa: se cuelga como etiqueta sobre el QR (la razón para escanear). */
  offer?: string;
  /** Escasez real publicada (p. ej. "Cupos limitados por semana"): segunda línea de la etiqueta. */
  urgency?: string;
}) {
  return (
    <div className={`qr-badge ${className}${offer ? " has-offer" : ""}`}>
      {offer ? (
        <div className="qr-offer">
          <span className="qr-offer-txt">{offer}</span>
          {urgency ? <span className="qr-offer-urg">{urgency}</span> : null}
        </div>
      ) : null}
      <div className="qr-frame">
        <span className="qr-pulse" aria-hidden="true" />
        <span className="qr-corner c-tl" aria-hidden="true" />
        <span className="qr-corner c-tr" aria-hidden="true" />
        <span className="qr-corner c-bl" aria-hidden="true" />
        <span className="qr-corner c-br" aria-hidden="true" />
        <div className="qr-card">
          <QrCode value={url} dark={dark} className="qr-svg" />
          <div className="qr-label">
            <ScanIcon />
            <span>Escanea para ver temario</span>
          </div>
        </div>
      </div>
    </div>
  );
}
