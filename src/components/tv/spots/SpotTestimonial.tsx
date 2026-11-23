"use client";

import { useId } from "react";
import { BRAND_CONTENT, type BrandPlay } from "../engine";
import { CheckIcon } from "../scenes/shared";
import { EdFooter, Masthead, pad2, Reveal, Stage } from "./kit";

function sizeClass(chars: number): string {
  if (chars <= 100) return "q-l";
  if (chars <= 140) return "q-m";
  return "q-s";
}

/** Anuncio de marca · Testimonio publicado en ultravelozmente.com, con sello giratorio y QR al programa. */
export function SpotTestimonial({ play }: { play: BrandPlay }) {
  const t = play.testimonial;
  const ringId = `seal-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  if (!t) return null;
  const total = BRAND_CONTENT.testimonials.length;
  const words = t.quote.split(/\s+/).length;
  const step = Math.max(35, Math.min(90, Math.round(2600 / words)));

  return (
    <Stage className="sp-testimonial">
      <Masthead label={`Correspondencia · ${pad2(play.testimonialIndex + 1)} / ${pad2(total)}`} />

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
        <blockquote className={`tm-quote ed-serif ${sizeClass(t.quote.length)}`}>
          <Reveal text={t.quote} startMs={500} stepMs={step} />
        </blockquote>
        <div className="tm-author ed-up" style={{ animationDelay: `${700 + words * step}ms` }}>
          <span className="tm-dash" />
          <span className="tm-name">{t.name}</span>
          <span className="ed-mono tm-role">{t.role}</span>
        </div>
        <div className="tm-result ed-up" style={{ animationDelay: `${1000 + words * step}ms` }}>
          <CheckIcon />
          <span>{t.result}</span>
        </div>
      </div>

      <EdFooter featured={play.featured} palette={play.palette} label="Programa" delayMs={1300 + words * step} />
    </Stage>
  );
}
