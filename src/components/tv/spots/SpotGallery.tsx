"use client";

import { shuffle, rngFrom } from "@/lib/seed";
import { BRAND_CONTENT, type BrandPlay, type RosterItem } from "../engine";
import { CourseImage } from "../scenes/shared";
import { EdFooter, Masthead, pad2, Reveal, Stage } from "./kit";

const COLUMNS = 3;
const PER_COLUMN = 2; // 6 fotos distintas como máximo: cuida la memoria de video de la TV

function Tile({ r, hot }: { r: RosterItem; hot: boolean }) {
  return (
    <div className={`gl-tile${hot ? " hot" : ""}`}>
      <div className="gl-img">
        <CourseImage src={r.course.image_url} title={r.course.title} />
      </div>
      <div className="gl-cap">
        <span className="ed-mono gl-num">{pad2(r.number)}</span>
        <span className="gl-name">{r.course.title}</span>
      </div>
    </div>
  );
}

/**
 * Anuncio de marca · Muro de programas: columnas de fotos que se deslizan en sentidos opuestos
 * (bucle perfecto con contenido duplicado) y el programa recomendado al frente con su QR.
 */
export function SpotGallery({ play }: { play: BrandPlay }) {
  const g = BRAND_CONTENT.gallery;
  const others = shuffle(rngFrom("gallery", play.seed), play.roster.filter((r) => r.id !== play.featured.id));
  const picks = [play.featured].concat(others).slice(0, COLUMNS * PER_COLUMN);
  const columns: RosterItem[][] = [];
  for (let c = 0; c < COLUMNS; c++) {
    const col = picks.filter((_, i) => i % COLUMNS === c);
    if (col.length) columns.push(col);
  }

  return (
    <Stage className="sp-gallery">
      <div className="gl-wall" aria-hidden="true">
        {columns.map((col, c) => (
          <div key={c} className={`gl-col${c % 2 ? " down" : ""}`}>
            <div className="gl-track">
              {col.concat(col, col, col).map((r, i) => (
                <Tile key={`${r.id}-${i}`} r={r} hot={r.id === play.featured.id} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <Masthead label={g.kicker} />
      <div className="gl-card">
        <div className="gl-title ed-serif">
          <Reveal text={g.headline} startMs={500} stepMs={80} />
        </div>
      </div>
      <EdFooter featured={play.featured} palette={play.palette} delayMs={1800} />
    </Stage>
  );
}
