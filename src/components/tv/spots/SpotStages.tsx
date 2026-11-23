"use client";

import { findProgram } from "@/lib/catalog";
import { BRAND_CONTENT, type BrandPlay, type RosterItem } from "../engine";
import { useOrientation } from "../useOrientation";
import { EdFooter, Masthead, pad2, Reveal, Stage } from "./kit";

// Vertical: una sola fila de chips. Horizontal: las tarjetas tienen alto para varias filas.
const MAX_CHIPS = { portrait: 2, landscape: 4 };

/** Reparte los programas en pantalla entre las 3 etapas que publica el sitio. */
function stageOf(r: RosterItem): number {
  const id = findProgram(r.course)?.id;
  if (id === "lectoescritura") return 0;
  if (r.audience.indexOf("ninos") >= 0) return 1;
  if (r.audience.length) return 2;
  return -1;
}

/** Anuncio de marca · "¿Para quién buscas el programa?": tres etapas con sus programas reales. */
export function SpotStages({ play }: { play: BrandPlay }) {
  const s = BRAND_CONTENT.stages;
  const featuredStage = stageOf(play.featured);
  const maxChips = MAX_CHIPS[useOrientation()];
  return (
    <Stage className="sp-stages">
      <Masthead label={s.kicker} />
      <div className="sg-head ed-serif">
        <Reveal text={s.headline} startMs={250} stepMs={90} />
      </div>
      <div className="sg-list">
        {s.items.map((it, i) => {
          const programs = play.roster.filter((r) => stageOf(r) === i);
          // El programa recomendado va primero en su etapa.
          programs.sort((a, b) => Number(b.id === play.featured.id) - Number(a.id === play.featured.id));
          const shown = programs.slice(0, maxChips);
          const extra = programs.length - shown.length;
          return (
            <div
              key={it.label}
              className={`sg-card${i === featuredStage ? " on" : ""}`}
              style={{ animationDelay: `${1100 + i * 450}ms` }}
            >
              <div className="sg-top">
                <span className="ed-mono sg-num">{pad2(i + 1)}</span>
                <span className="ed-mono sg-ages">{it.ages}</span>
              </div>
              <div className="sg-label display">{it.label}</div>
              <div className="sg-summary ed-serif">{it.summary}</div>
              {/* Si la etapa tiene un solo programa y ya es el resumen, no se repite como chip. */}
              {shown.length && !(programs.length === 1 && programs[0].course.title === it.summary) ? (
                <div className="sg-chips">
                  {shown.map((p) => (
                    <span key={p.id} className={`sg-chip${p.id === play.featured.id ? " hot" : ""}`}>
                      {p.course.title}
                    </span>
                  ))}
                  {extra > 0 ? <span className="sg-chip more">+{extra}</span> : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <EdFooter featured={play.featured} palette={play.palette} delayMs={3000} />
    </Stage>
  );
}
