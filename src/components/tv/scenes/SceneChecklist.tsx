"use client";

import type { CoursePlay } from "../engine";
import { FitLines } from "../FitLines";
import { breakLines, lineChars } from "../text";
import { useOrientation } from "../useOrientation";
import { EdFooter, Masthead, Stage } from "../spots/kit";
import { CheckIcon } from "./shared";

/**
 * Escena 12 · Lo que incluye: tres palomitas gigantes con datos reales (oferta publicada, grupos de máx. 7
 * y práctica guiada, que publica el sitio). Una lista de 3 se lee de un vistazo y transmite "sin riesgo".
 */
export function SceneChecklist({ play }: { play: CoursePlay }) {
  const { course, featured, palette } = play;
  const portrait = useOrientation() === "portrait";
  const items = featured.offer
    ? [featured.offerShort, "Grupos de máx. 7", "Práctica guiada"]
    : ["Grupos de máx. 7", "Práctica guiada", featured.ages || "Progreso visible"];

  return (
    <Stage className="sc-big sc-checklist">
      <Masthead label="Lo que incluye" />
      <div className="bt-hero">
        <div className="bt-beat tone-plain">
          <div className="ck-title">
            <FitLines lines={breakLines(course.title, lineChars(portrait, "name"))} maxVmin={16} startMs={60} />
          </div>
          {items.map((it, i) => (
            <div key={it} className="ck-row ed-up" style={{ animationDelay: `${350 + i * 200}ms` }}>
              <span className="ck-ico">
                <CheckIcon />
              </span>
              <FitLines lines={[it]} maxVmin={9.5} fitHeight={false} className="ck-txt" />
            </div>
          ))}
        </div>
      </div>
      <EdFooter featured={featured} palette={palette} delayMs={700} />
    </Stage>
  );
}
