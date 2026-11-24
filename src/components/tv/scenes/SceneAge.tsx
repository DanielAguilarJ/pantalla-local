"use client";

import type { CoursePlay } from "../engine";
import { FitLines } from "../FitLines";
import { ageLines } from "../text";
import { EdFooter, Masthead, Stage } from "../spots/kit";

/**
 * Escena 11 · Edad gigante: "6–12 AÑOS" a tamaño cartel. La edad es el filtro más rápido para que un
 * papá o una mamá sepan, en un segundo, si el anuncio es para su hijo.
 */
export function SceneAge({ play }: { play: CoursePlay }) {
  const { course, featured, palette } = play;
  return (
    <Stage className="sc-big sc-age">
      <Masthead label="¿Para quién es?" />
      <div className="bt-hero">
        <div className="bt-beat tone-plain">
          <div className="bt-kicker ed-up" style={{ animationDelay: "100ms" }}>
            Programa para
          </div>
          <div className="age-panel">
            <FitLines lines={ageLines(featured.ages)} maxVmin={42} align="center" startMs={150} />
          </div>
          <div className="age-name">
            <FitLines lines={[course.title]} maxVmin={13} fitHeight={false} startMs={500} />
          </div>
          {featured.offer ? <div className="bt-sub ed-up" style={{ animationDelay: "800ms" }}>{featured.offer}</div> : null}
        </div>
      </div>
      <EdFooter featured={featured} palette={palette} delayMs={700} />
    </Stage>
  );
}
