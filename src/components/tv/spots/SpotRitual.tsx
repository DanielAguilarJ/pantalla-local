"use client";

import type { ReactElement } from "react";
import { BRAND_CONTENT, type BrandPlay } from "../engine";
import { EdFooter, Masthead, Reveal, Stage } from "./kit";

const ICONS: Record<string, ReactElement> = {
  body: (
    <>
      <circle cx="12" cy="4.5" r="2.2" />
      <path d="M5 9.5 12 8l7 1.5M12 8v6m0 0-3.5 7M12 14l3.5 7" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15" />
      <path d="M5 19 13 11" />
    </>
  ),
  dice: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3.5" />
      <circle cx="9" cy="9" r="1.2" className="fill" />
      <circle cx="15" cy="15" r="1.2" className="fill" />
      <circle cx="15" cy="9" r="1.2" className="fill" />
      <circle cx="9" cy="15" r="1.2" className="fill" />
    </>
  ),
};

const ITEM_START = 1500;
const ITEM_EVERY = 1500;

/** Anuncio de marca · "Los 5 Minutos": anillo que se completa por cuartos mientras aparecen los 4 momentos. */
export function SpotRitual({ play }: { play: BrandPlay }) {
  const r = BRAND_CONTENT.ritual;
  return (
    <Stage className="sp-ritual">
      <Masthead label={r.kicker} />
      <div className="ri-head ed-serif">
        <Reveal text={r.headline} startMs={250} stepMs={90} />
      </div>
      <div className="ri-ring ed-up" style={{ animationDelay: "500ms" }}>
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle className="ri-track" cx="60" cy="60" r="52" />
          <circle className="ri-progress" cx="60" cy="60" r="52" pathLength={100} transform="rotate(-90 60 60)" />
        </svg>
        <div className="ri-center">
          <span className="ri-five display">5</span>
          <span className="ed-mono ri-min">minutos</span>
        </div>
      </div>
      <div className="ri-items">
        {r.items.map((it, i) => (
          <div key={it.title} className="ri-item ed-up" style={{ animationDelay: `${ITEM_START + i * ITEM_EVERY}ms` }}>
            <span className="ri-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {ICONS[it.icon]}
              </svg>
            </span>
            <span className="ri-copy">
              <span className="ri-title">{it.title}</span>
              <span className="ri-text">{it.text}</span>
            </span>
          </div>
        ))}
      </div>
      <EdFooter featured={play.featured} palette={play.palette} delayMs={ITEM_START + 4 * ITEM_EVERY} />
    </Stage>
  );
}
