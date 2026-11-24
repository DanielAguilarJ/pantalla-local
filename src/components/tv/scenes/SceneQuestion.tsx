"use client";

import type { CoursePlay } from "../engine";
import { FitLines } from "../FitLines";
import { breakLines, lineChars } from "../text";
import { useOrientation } from "../useOrientation";
import { EdFooter, Masthead, Stage } from "../spots/kit";
import { ArrowIcon } from "./shared";

/**
 * Escena 10 · Pregunta directa: una pregunta gigante que le habla a una persona ("¿Le cuesta leer?").
 * Quien se identifica se detiene; la respuesta es el programa y su oferta real.
 */
export function SceneQuestion({ play }: { play: CoursePlay }) {
  const { course, featured, palette } = play;
  const portrait = useOrientation() === "portrait";
  const question = featured.question || "¿Quieres aprender mejor?";

  return (
    <Stage className="sc-big sc-question">
      <Masthead label={featured.ages || "Para ti"} />
      <div className="bt-hero">
        <div className="bt-beat tone-plain">
          <FitLines lines={breakLines(question, lineChars(portrait))} maxVmin={26} startMs={80} stepMs={110} />
          <div className="qa-answer ed-up" style={{ animationDelay: "750ms" }}>
            <span className="qa-arrow">
              <ArrowIcon />
            </span>
            <FitLines lines={[course.title]} maxVmin={11} fitHeight={false} className="qa-name" />
          </div>
          {featured.offer ? (
            <div className="bt-sub ed-up" style={{ animationDelay: "950ms" }}>
              {featured.offer}
            </div>
          ) : null}
        </div>
      </div>
      <EdFooter featured={featured} palette={palette} delayMs={700} />
    </Stage>
  );
}
