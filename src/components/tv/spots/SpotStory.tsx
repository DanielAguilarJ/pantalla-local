"use client";

import { tvMediaUrl } from "@/lib/media-proxy";
import { BRAND_CONTENT, type BrandPlay } from "../engine";
import { CourseImage } from "../scenes/shared";
import { EdFooter, Masthead, Stage } from "./kit";

/**
 * Anuncio de marca · Antes / Después con caras reales (fotos publicadas en /grandes-lideres).
 * Dos recursos que el cerebro procesa antes de leer: rostros y contraste de transformación.
 * El texto sale del testimonio publicado de Jorge M. («En dos meses pasó de no participar a coordinar su equipo»).
 */
export function SpotStory({ play }: { play: BrandPlay }) {
  const s = BRAND_CONTENT.transformation;
  const t = BRAND_CONTENT.testimonials.find((x) => x.id === s.testimonial);

  return (
    <Stage className="sp-story">
      <Masthead label={s.kicker} />
      <div className="st-panels">
        <div className="st-panel st-before">
          <div className="st-photo">
            <CourseImage src={tvMediaUrl(s.before.image)} title={s.before.label} />
          </div>
          <span className="st-label">{s.before.label}</span>
          <div className="st-cap">
            <span className="st-text display">{s.before.text}</span>
          </div>
        </div>
        <div className="st-time display" aria-hidden="true">
          <span>{s.time}</span>
        </div>
        <div className="st-panel st-after">
          <div className="st-photo">
            <CourseImage src={tvMediaUrl(s.after.image)} title={s.after.label} />
          </div>
          <span className="st-label">{s.after.label}</span>
          <div className="st-cap">
            <span className="st-text display">{s.after.text}</span>
          </div>
        </div>
      </div>
      {t ? (
        <div className="st-source ed-up" style={{ animationDelay: "1200ms" }}>
          — {t.name}, {t.role}
        </div>
      ) : null}
      <EdFooter featured={play.featured} palette={play.palette} label="Programa" delayMs={900} />
    </Stage>
  );
}
