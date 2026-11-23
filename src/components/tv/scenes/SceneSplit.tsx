"use client";

import { useId } from "react";
import { shortCourseName } from "@/lib/copy";
import { GenerativeCanvas } from "../GenerativeCanvas";
import { QrBadge } from "../QrCode";
import type { CoursePlay } from "../engine";
import { ArrowIcon, BrandBug, CourseImage, ctaLabel, offerTag, PriceOrContact, StaggerWords } from "./shared";

/** Escena 4 · Mitad patrón generativo (Canvas + SVG), mitad oferta del curso. */
export function SceneSplit({ play }: { play: CoursePlay }) {
  const { course, palette } = play;
  const pathId = `ring-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const ringText = `${shortCourseName(course.title)} • Inscríbete • Escanea • `.toUpperCase();

  return (
    <div className="slide s-split">
      <div className="sp-art">
        <GenerativeCanvas
          className="sp-canvas"
          pattern={play.pattern}
          seed={play.seed}
          bg={palette.pop}
          ink={palette.popInk}
          accent={palette.accent}
        />
        <div className="sp-medal">
          <svg className="sp-ring" viewBox="0 0 100 100" aria-hidden="true">
            <defs>
              <path id={pathId} d="M 50,50 m -41,0 a 41,41 0 1,1 82,0 a 41,41 0 1,1 -82,0" />
            </defs>
            <circle className="sp-ring-bg" cx="50" cy="50" r="49" />
            <text textLength={255} lengthAdjust="spacing">
              <textPath href={`#${pathId}`}>{ringText.repeat(ringText.length > 30 ? 1 : 2)}</textPath>
            </text>
          </svg>
          <div className="sp-photo">
            <CourseImage src={course.image_url} title={course.title} />
          </div>
        </div>
      </div>

      <div className="sp-offer">
        <div className="sp-kicker fade-in" style={{ animationDelay: "700ms" }}>
          {course.title}
        </div>
        <div className="sp-title display">
          <StaggerWords text={course.hook_headline} startMs={900} stepMs={120} />
        </div>
        {course.hook_subheadline ? (
          <div className="sp-sub rise-in" style={{ animationDelay: "2200ms" }}>
            {course.hook_subheadline}
          </div>
        ) : null}
        <div className="sp-row">
          <PriceOrContact price={course.price} delayMs={1200} />
          <span className="cta display pop-in" style={{ animationDelay: "3100ms" }}>
            {ctaLabel(play.featured.offerShort, course.hook_headline)} <ArrowIcon />
          </span>
        </div>
      </div>

      <BrandBug />
      <QrBadge url={course.course_url} dark={palette.qrDark} className="qr-br" offer={offerTag(course.hook_headline, play.featured.offerShort)} urgency={play.featured.urgency} />
    </div>
  );
}
