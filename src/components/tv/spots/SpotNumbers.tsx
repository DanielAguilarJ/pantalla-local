"use client";

import type { CSSProperties } from "react";
import { BRAND_CONTENT, type BrandPlay } from "../engine";
import { EdFooter, Masthead, Reveal, Stage, usePhase } from "./kit";

const DIGITS = "01234567890123456789".split("");

/** Contador tipo odómetro: cada dígito es una tira que se desliza (solo transform, 60 FPS). */
function Odometer({ value, on, delayMs }: { value: string; on: boolean; delayMs: number }) {
  return (
    <span className="od">
      {Array.from(value).map((ch, i) => {
        if (!/\d/.test(ch)) return <span key={i}>{ch}</span>;
        const target = 10 + Number(ch);
        const style = {
          transform: on ? `translateY(${-target * 5}%)` : "translateY(0)",
          transitionDelay: `${delayMs + i * 120}ms`,
        } as CSSProperties;
        return (
          <span key={i} className="od-col">
            <span className="od-strip" style={style}>
              {DIGITS.map((d, j) => (
                <span key={j} className="od-d">
                  {d}
                </span>
              ))}
            </span>
            <span className="od-ghost" aria-hidden="true">
              {ch}
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** Anuncio de marca · WorldBrain en números (datos publicados en el sitio). */
export function SpotNumbers({ play }: { play: BrandPlay }) {
  const n = BRAND_CONTENT.numbers;
  const phase = usePhase([500]);
  return (
    <Stage className="sp-numbers">
      <Masthead label={n.kicker} />
      <div className="nu-head ed-serif">
        <Reveal text={n.headline} startMs={200} stepMs={110} />
      </div>
      <div className="nu-grid">
        {n.items.map((it, i) => (
          <div key={it.label} className="nu-tile ed-up" style={{ animationDelay: `${300 + i * 180}ms` }}>
            <div className="nu-value display">
              {"prefix" in it && it.prefix ? <span className="nu-prefix ed-mono">{it.prefix}</span> : null}
              {"value" in it && it.value ? (
                <Odometer value={it.value} on={phase >= 1} delayMs={i * 350} />
              ) : (
                <span className="nu-text">{"text" in it ? it.text : ""}</span>
              )}
            </div>
            <div className="ed-mono nu-label">{it.label}</div>
          </div>
        ))}
      </div>
      <EdFooter featured={play.featured} palette={play.palette} delayMs={3200} />
    </Stage>
  );
}
