"use client";

import { FitLines } from "../FitLines";
import { usePhase } from "./kit";

export interface Beat {
  lines: string[];
  /** plain = texto sobre el fondo · pop / accent = bloque de color (interrupción de patrón). */
  tone: "plain" | "pop" | "accent";
  sub?: string;
  /** Flecha grande hacia el QR (abajo a la derecha en vertical, a la derecha en horizontal). */
  arrow?: boolean;
  maxVmin?: number;
}

export function BigArrow() {
  return (
    <span className="bt-arrow" aria-hidden="true">
      <svg viewBox="0 0 40 40">
        <path d="M5 20h28M22 8l12 12-12 12" />
      </svg>
    </span>
  );
}

/**
 * "Golpes de texto": una idea por golpe, a tamaño cartel, cambiando de color cada ~3 s.
 * Quien pasa caminando ve al menos un golpe completo; el cambio de color vuelve a llamar la mirada.
 */
export function BeatStack({ beats, times }: { beats: Beat[]; times: number[] }) {
  const phase = usePhase(times.slice(1));
  const i = Math.min(phase, beats.length - 1);
  const b = beats[i];
  return (
    <div className="bt-hero">
      <div key={i} className={`bt-beat tone-${b.tone}`}>
        <FitLines lines={b.lines} maxVmin={b.maxVmin || 30} startMs={60} stepMs={90} />
        {b.sub ? <div className="bt-sub">{b.sub}</div> : null}
        {b.arrow ? <BigArrow /> : null}
      </div>
      <div className="bt-steps" aria-hidden="true">
        {beats.map((_, k) => (
          <span key={k} className={k === i ? "on" : k < i ? "done" : ""} />
        ))}
      </div>
    </div>
  );
}
