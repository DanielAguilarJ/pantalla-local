"use client";

import { BRAND_CONTENT, type BrandPlay } from "../engine";
import { EdFooter, Masthead, Reveal, Stage } from "./kit";

const STEP_START = 600;
const STEP_EVERY = 350;

/** Anuncio de marca · El método en tres momentos, con una línea que avanza de paso en paso. */
export function SpotMethod({ play }: { play: BrandPlay }) {
  const m = BRAND_CONTENT.method;
  return (
    <Stage className="sp-method">
      <Masthead label={m.kicker} />
      <div className="me-head ed-serif">
        <Reveal text={m.headline} startMs={250} stepMs={80} />
      </div>
      <div className="me-steps">
        <div className="me-line">
          <div className="me-line-fill" />
        </div>
        {m.steps.map((s, i) => {
          const at = STEP_START + i * STEP_EVERY;
          return (
            <div key={s.numeral} className="me-step" style={{ animationDelay: `${at}ms` }}>
              <div className="me-dot">
                <span className="me-numeral ink ed-serif">{s.numeral}</span>
                {/* El relleno trae su propio numeral en el color de contraste: crece junto con el círculo. */}
                <span className="me-dot-fill" style={{ animationDelay: `${at + 200}ms` }}>
                  <span className="me-numeral ed-serif">{s.numeral}</span>
                </span>
              </div>
              <div className="me-copy">
                <div className="me-verb display">{s.verb}</div>
                <div className="ed-mono me-title">{s.title}</div>
                <div className="me-text">{s.text}</div>
              </div>
            </div>
          );
        })}
      </div>
      <EdFooter featured={play.featured} palette={play.palette} delayMs={STEP_START + 3 * STEP_EVERY} />
    </Stage>
  );
}
