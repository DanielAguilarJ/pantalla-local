"use client";

import type { CSSProperties } from "react";
import { shortCourseName } from "@/lib/copy";
import type { CoursePlay } from "../engine";
import { EdFooter, issueLabel, LetterRise, Masthead, pad2, Reveal, Stage } from "../spots/kit";
import { CourseImage } from "./shared";

/**
 * Escena 6 · Portada editorial (pensada para 9:16).
 * Cabecera de revista, foto del programa que se destapa, palabra-beneficio gigante en serif itálica
 * y cierre con WhatsApp + QR al temario.
 */
export function SceneCover({ play }: { play: CoursePlay }) {
  const { course, featured, palette, roster } = play;
  const hero = (featured.benefit || shortCourseName(course.title)).toLowerCase();
  const heroStyle = { "--len": Math.max(5, hero.length + 1) } as CSSProperties;

  return (
    <Stage className="sc-cover">
      <Masthead label={`N.º ${pad2(featured.number)} / ${pad2(roster.length)} · ${issueLabel(play.seed)}`} />

      <div className="cv-photo">
        <div className="cv-photo-img">
          <CourseImage src={course.image_url} title={course.title} />
        </div>
        <div className="cv-curtain" />
        <div className="ed-mono cv-caption">
          Fig. {pad2(featured.number)} — {course.title}
          {featured.ages ? ` · ${featured.ages}` : ""}
        </div>
      </div>

      <div className="cv-text">
        <div className="cv-hero ed-serif" style={heroStyle}>
          <LetterRise text={`${hero}.`} startMs={1300} stepMs={55} />
        </div>
        <div className="cv-title display ed-up" style={{ animationDelay: "2300ms" }}>
          {course.title}
        </div>
        <div className="cv-deck ed-serif">
          <Reveal text={course.hook_headline} startMs={2800} stepMs={90} />
        </div>
      </div>

      <EdFooter featured={featured} palette={palette} variant="contact" delayMs={3600} />
    </Stage>
  );
}
