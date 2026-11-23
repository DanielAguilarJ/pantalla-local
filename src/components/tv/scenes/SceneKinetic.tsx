"use client";

import type { CSSProperties } from "react";
import { QrBadge } from "../QrCode";
import type { CoursePlay } from "../engine";
import { ArrowIcon, BrandBug, PriceOrContact, splitWords, StaggerWords } from "./shared";

const UNDERLINE_PATH = "M2 18 C 40 6, 80 26, 120 14 S 190 4, 230 16 S 280 22, 298 10";

/** Escena 2 · Tipografía cinética: palabras gigantes elásticas, subrayado SVG trazado en vivo y bloque de color. */
export function SceneKinetic({ play }: { play: CoursePlay }) {
  const { course, palette } = play;
  const words = splitWords(course.hook_headline);
  const maxLen = Math.max(4, ...words.map((w) => w.length));
  const underline = Math.min(play.underlineIndex, words.length - 1);
  const highlight = words.length > 1 ? (underline === 0 ? words.length - 1 : 0) : -1;
  const stepMs = 170;

  return (
    <div className="slide s-kinetic">
      <div className="kn-tag fade-in">{course.title}</div>

      <div className="fill kn-a">
        <div className="kn-words display" style={{ "--maxlen": maxLen } as CSSProperties}>
          {words.map((w, i) => {
            const delay = `${250 + i * stepMs}ms`;
            if (i === highlight) {
              return (
                <span key={i} className="kn-word kn-hl" style={{ animationDelay: delay }}>
                  <span className="hl-bg-a" style={{ animationDelay: `${250 + i * stepMs + 250}ms` }} />
                  <span className="hl-bg-b" />
                  <span className="hl-t-a">{w}</span>
                  <span className="hl-t-b" aria-hidden="true">
                    {w}
                  </span>
                </span>
              );
            }
            return (
              <span key={i} className="kn-word" style={{ animationDelay: delay }}>
                {w}
                {i === underline ? (
                  <svg className="kn-underline" viewBox="0 0 300 28" preserveAspectRatio="none" aria-hidden="true">
                    <path d={UNDERLINE_PATH} pathLength={100} style={{ animationDelay: `${250 + words.length * stepMs + 300}ms` }} />
                  </svg>
                ) : null}
              </span>
            );
          })}
        </div>
      </div>

      <div className="fill kn-b">
        <div className="kn-b-sub">
          <StaggerWords text={course.hook_subheadline} startMs={6600} stepMs={70} />
        </div>
        <div className="kn-b-title display rise-in" style={{ animationDelay: "7400ms" }}>
          {course.title}
        </div>
        <div className="kn-b-row">
          <PriceOrContact price={course.price} delayMs={8000} />
          <span className="cta display pop-in" style={{ animationDelay: "8300ms" }}>
            Inscribirme <ArrowIcon />
          </span>
        </div>
      </div>

      <BrandBug />
      <QrBadge url={course.course_url} dark={palette.qrDark} className="qr-br" />
    </div>
  );
}
