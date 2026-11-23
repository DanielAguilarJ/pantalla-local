"use client";

import { Fragment, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { BRAND } from "@/lib/brand";
import type { Palette } from "@/lib/palettes";
import { QrBadge } from "../QrCode";
import type { RosterItem } from "../engine";

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
export function Reveal({ text, startMs = 0, stepMs = 70, className = "" }: { text: string; startMs?: number; stepMs?: number; className?: string }) {
  const words = text.trim().split(/\s+/).filter(Boolean);
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
  delayMs = 900,
}: {
  featured: RosterItem;
  palette: Palette;
  label?: string;
  variant?: "program" | "contact";
  delayMs?: number;
}) {
  const style = { animationDelay: `${delayMs}ms` } as CSSProperties;
  return (
    <div className="ed-foot">
      <div className="ed-foot-info ed-up" style={style}>
        {variant === "program" ? (
          <>
            <div className="ed-mono ed-foot-label">{label}</div>
            <div className="ed-foot-title display">{featured.course.title}</div>
            <div className="ed-mono ed-foot-meta">
              {[featured.ages, featured.benefit].filter(Boolean).join(" · ")}
            </div>
          </>
        ) : (
          <>
            <div className="ed-mono ed-foot-label">Informes por WhatsApp</div>
            <div className="ed-foot-title display">{BRAND.whatsappDisplay}</div>
            <div className="ed-mono ed-foot-meta">{BRAND.siteLabel}</div>
          </>
        )}
      </div>
      <QrBadge url={featured.course.course_url} dark={palette.qrDark} className="qr-inline" />
    </div>
  );
}

export function Stage({ className, children }: { className: string; children: ReactNode }) {
  return <div className={`slide ed ${className}`}>{children}</div>;
}
