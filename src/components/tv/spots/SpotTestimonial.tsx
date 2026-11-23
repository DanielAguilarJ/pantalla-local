"use client";

import { useId } from "react";
import { BRAND_CONTENT, type BrandPlay } from "../engine";
import { CheckIcon } from "../scenes/shared";
import { EdFooter, Masthead, pad2, Reveal, Stage } from "./kit";

/** Tamaño según largo del fragmento: lo más grande posible sin que la cita pase de 4 renglones. */
function sizeClass(words: number): string {
  if (words <= 8) return "q-xl";
  if (words <= 12) return "q-l";
  return "q-m";
}

/**
 * Anuncio de marca · Testimonio real del sitio (prueba social).
 * Para exterior se muestra un fragmento textual corto (`pull`) en grande y el resultado como sello:
 * se entiende de un vistazo, sin leer el párrafo completo.
 */
export function SpotTestimonial({ play }: { play: BrandPlay }) {
  const t = play.testimonial;
  const ringId = `seal-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  if (!t) return null;
  const total = BRAND_CONTENT.testimonials.length;
  const words = t.pull.split(/\s+/).length;

  return (
    <Stage className="sp-testimonial">
      <Masthead label={`Familias reales · ${pad2(play.testimonialIndex + 1)}/${pad2(total)}`} />

      <div className="tm-seal" aria-hidden="true">
        <svg className="tm-seal-ring" viewBox="0 0 100 100">
          <defs>
            <path id={ringId} d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
          </defs>
          <circle cx="50" cy="50" r="49" className="tm-seal-bg" />
          <circle cx="50" cy="50" r="30" className="tm-seal-inner" />
          <text textLength={236} lengthAdjust="spacing">
            <textPath href={`#${ringId}`}>EXPERIENCIA REAL • WORLDBRAIN MÉXICO •</textPath>
          </text>
        </svg>
        <span className="tm-seal-num display">{pad2(play.testimonialIndex + 1)}</span>
      </div>

      <div className="tm-body">
        <div className="tm-mark ed-serif">“</div>
        <blockquote className={`tm-quote ed-serif ${sizeClass(words)}`}>
          <Reveal text={t.pull} startMs={300} stepMs={50} />
        </blockquote>
        <div className="tm-result ed-up" style={{ animationDelay: "900ms" }}>
          <CheckIcon />
          <span>{t.result}</span>
        </div>
        <div className="tm-author ed-up" style={{ animationDelay: "1100ms" }}>
          <span className="tm-dash" />
          <span className="tm-name">{t.name}</span>
          <span className="tm-role">{t.role}</span>
        </div>
      </div>

      <EdFooter featured={play.featured} palette={play.palette} label="Programa" delayMs={800} />
    </Stage>
  );
}
