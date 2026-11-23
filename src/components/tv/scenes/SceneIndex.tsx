"use client";

import type { CSSProperties } from "react";
import type { CoursePlay } from "../engine";
import { EdFooter, Masthead, pad2, Reveal, Stage, usePhase } from "../spots/kit";
import { ArrowIcon } from "./shared";

const VISIBLE_ROWS = 6;

/**
 * Escena 7 · Índice de programas (como el índice de ultravelozmente.com).
 * La lista se desplaza hasta el programa del anuncio, la fila se marca con un bloque de color
 * y aparece su gancho; cierra con el programa y el QR.
 */
export function SceneIndex({ play }: { play: CoursePlay }) {
  const { course, featured, palette, roster } = play;
  const phase = usePhase([700, 3300]);
  const k = Math.max(0, roster.findIndex((r) => r.id === featured.id));
  const offset = Math.max(0, Math.min(k - 2, roster.length - VISIBLE_ROWS));
  const listStyle = {
    transform: phase >= 1 ? `translateY(calc(${-offset} * var(--row)))` : "translateY(0)",
  } as CSSProperties;

  return (
    <Stage className={`sc-index ph-${phase}`}>
      <Masthead label={`Índice · ${pad2(roster.length)} programas`} />

      <div className="ix-head">
        <div className="ix-title ed-serif">
          <Reveal text={`${roster.length} rutas. Un mismo destino:`} startMs={250} />{" "}
          <em>
            <Reveal text="aprender mejor." startMs={650} />
          </em>
        </div>
      </div>

      <div className="ix-window">
        <div className="ix-list" style={listStyle}>
          {roster.map((r, i) => (
            <div key={r.id} className={`ix-row${i === k ? " on" : ""}`} style={{ animationDelay: `${150 + Math.min(i, 8) * 60}ms` }}>
              <span className="ix-hl" />
              <span className="ed-mono ix-num">{pad2(r.number)}</span>
              <span className="ix-name ed-serif">{r.course.title}</span>
              <span className="ix-benefit ed-serif">{r.benefit}</span>
              <span className="ed-mono ix-ages">{r.ages}</span>
              <span className="ix-arrow">
                <ArrowIcon />
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="ix-detail">
        <div className="ix-hook display ed-up" style={{ animationDelay: "3500ms" }}>
          {course.hook_headline}
        </div>
        {course.hook_subheadline ? (
          <div className="ix-sub ed-up" style={{ animationDelay: "3800ms" }}>
            {course.hook_subheadline}
          </div>
        ) : null}
      </div>

      <EdFooter featured={featured} palette={palette} delayMs={4200} />
    </Stage>
  );
}
