"use client";

import { shortCourseName } from "@/lib/copy";
import type { CoursePlay } from "../engine";
import { breakLines, lineChars } from "../text";
import { useOrientation } from "../useOrientation";
import { BeatStack, type Beat } from "../spots/BeatStack";
import { EdFooter, Masthead, Stage } from "../spots/kit";
import { offerWord } from "./shared";

export const BEAT_TIMES = [0, 2800, 5600, 8600];

/**
 * Escena 9 · Golpes de texto: beneficio → programa → oferta → "escanea aquí".
 * Cuatro ideas de 1–3 palabras, cada una llenando el ancho de la pantalla.
 */
export function SceneBeats({ play }: { play: CoursePlay }) {
  const { course, featured, palette } = play;
  const portrait = useOrientation() === "portrait";
  const max = lineChars(portrait);
  const word = offerWord(featured.offer);

  const beats: Beat[] = [
    { lines: breakLines(`${featured.benefit || shortCourseName(course.title)}.`, max), tone: "plain", maxVmin: 32 },
    { lines: breakLines(course.title, lineChars(portrait, "name")), tone: "pop", sub: featured.ages || undefined },
    word
      ? { lines: [word], tone: "accent", sub: featured.offerShort, maxVmin: 34 }
      : { lines: ["Grupos", "de 7."], tone: "accent", sub: "Práctica guiada" },
    { lines: ["Escanea", "aquí"], tone: "plain", sub: "Temario en tu celular", arrow: true },
  ];

  return (
    <Stage className="sc-big sc-beats">
      <Masthead label={course.title} />
      <BeatStack beats={beats} times={BEAT_TIMES} />
      <EdFooter featured={featured} palette={palette} delayMs={700} />
    </Stage>
  );
}
