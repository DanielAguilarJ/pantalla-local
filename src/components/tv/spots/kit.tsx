"use client";

import { Fragment, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { BRAND } from "@/lib/brand";
import type { Palette } from "@/lib/palettes";
import { QrBadge } from "../QrCode";
import type { RosterItem } from "../engine";
import { PhoneCta, WhatsIcon } from "../scenes/shared";

/** Fases temporizadas de un anuncio: devuelve cuántos tiempos (ms) ya pasaron desde el montaje. */
export function usePhase(times: number[]): number {
  const [phase, setPhase] = useState(0);
  const key = times.join(",");
  useEffect(() => {
    const timers = times.map((t, i) => setTimeout(() => setPhase((p) => Math.max(p, i + 1)), t));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return phase;
}

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

export function issueLabel(seed: string): string {
  const [y, m] = seed.split("-").map(Number);
  return `${MONTHS[(m || 1) - 1]} ${y}`;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Revelado editorial: cada palabra sube desde detrás de una máscara (overflow: hidden).
 * Solo anima transform, así que es fluido en la TV.
 */
/** Tope de escalonado: por larga que sea la frase, la última palabra entra a más tardar 0,6 s después de la primera. */
export const MAX_STAGGER_MS = 600;

export function Reveal({ text, startMs = 0, stepMs = 70, className = "" }: { text: string; startMs?: number; stepMs?: number; className?: string }) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  stepMs = words.length > 1 ? Math.min(stepMs, MAX_STAGGER_MS / (words.length - 1)) : stepMs;
  return (
    <span className={className}>
      {words.map((w, i) => (
        <Fragment key={`${w}-${i}`}>
          {i > 0 ? " " : null}
          <span className="rv-w">
            <span className="rv-i" style={{ animationDelay: `${startMs + i * stepMs}ms` }}>
              {w}
            </span>
          </span>
        </Fragment>
      ))}
    </span>
  );
}

/** Letras que suben una por una (palabra protagonista de la portada). */
export function LetterRise({ text, startMs = 0, stepMs = 45 }: { text: string; startMs?: number; stepMs?: number }) {
  stepMs = text.length > 1 ? Math.min(stepMs, MAX_STAGGER_MS / (text.length - 1)) : stepMs;
  return (
    <span className="rv-w">
      {Array.from(text).map((ch, i) => (
        <span key={i} className="rv-i" style={{ animationDelay: `${startMs + i * stepMs}ms` }}>
          {ch === " " ? "\u00a0" : ch}
        </span>
      ))}
    </span>
  );
}

function StarIcon() {
  return (
    <svg className="ed-star" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.5l2.6 6.1 6.6.6-5 4.4 1.5 6.5L12 16.7l-5.7 3.4 1.5-6.5-5-4.4 6.6-.6z" fill="currentColor" />
    </svg>
  );
}

/** Cabecera tipo revista: logo, etiqueta en monoespaciada y filete que se traza. */
export function Masthead({ label }: { label: string }) {
  return (
    <div className="ed-mast">
      <div className="ed-mast-row">
        <BrandLogo className="ed-mast-logo" />
        <span className="ed-mono ed-mast-label">{label}</span>
      </div>
      <div className="ed-rule" />
    </div>
  );
}

/**
 * Cierre de cada anuncio: programa recomendado (o contacto) + QR al temario.
 * Vertical: banda inferior. Horizontal: columna derecha.
 */
export function EdFooter({
  featured,
  palette,
  label = "Programa recomendado",
  variant = "program",
  delayMs = 700,
}: {
  featured: RosterItem;
  palette: Palette;
  label?: string;
  variant?: "program" | "contact";
  delayMs?: number;
}) {
  // Prueba del "cuadro congelado": la llamada a la acción tiene que estar visible desde el primer segundo,
  // porque quien pasa caminando mira la pantalla 2–3 s.
  const style = { animationDelay: `${Math.min(delayMs, 900)}ms` } as CSSProperties;
  return (
    <div className="ed-foot">
      <div className="ed-foot-info ed-up" style={style}>
        {variant === "program" ? (
          <>
            <div className="ed-mono ed-foot-label">{label}</div>
            <div className="ed-foot-title display">{featured.course.title}</div>
            {featured.offer ? (
              // La oferta real reemplaza a los datos secundarios: es la razón para escanear.
              <div className="ed-foot-offer">
                <StarIcon />
                <span>{featured.offerShort}</span>
              </div>
            ) : (
              <div className="ed-mono ed-foot-meta">{[featured.ages, featured.benefit].filter(Boolean).join(" · ")}</div>
            )}
            <PhoneCta size="s" className="ed-foot-phone" />
          </>
        ) : (
          <>
            <div className="ed-mono ed-foot-label ed-foot-wa">
              <span className="ed-foot-wa-ico">
                <WhatsIcon />
              </span>
              Informes por WhatsApp
            </div>
            <div className="ed-foot-number display">{BRAND.whatsappDisplay}</div>
            <div className="ed-mono ed-foot-meta">{BRAND.siteLabel}</div>
          </>
        )}
      </div>
      <QrBadge url={featured.course.course_url} dark={palette.qrDark} className="qr-inline" offer={featured.urgency ? "Cupo limitado" : ""} />
    </div>
  );
}

export function Stage({ className, children }: { className: string; children: ReactNode }) {
  return <div className={`slide ed ${className}`}>{children}</div>;
}
