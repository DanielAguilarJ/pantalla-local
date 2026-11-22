"use client";

import { Fragment, useState, type CSSProperties } from "react";
import { shortCourseName } from "@/lib/copy";

export function splitWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

/** Palabras con entrada escalonada (tipografía cinética). */
export function StaggerWords({
  text,
  className = "rise-in",
  startMs = 0,
  stepMs = 110,
}: {
  text: string;
  className?: string;
  startMs?: number;
  stepMs?: number;
}) {
  return (
    <>
      {splitWords(text).map((w, i) => (
        <Fragment key={`${w}-${i}`}>
          {i > 0 ? " " : null}
          <span className={`word ${className}`} style={{ animationDelay: `${startMs + i * stepMs}ms` }}>
            {w}
          </span>
        </Fragment>
      ))}
    </>
  );
}

/** Imagen del curso con respaldo tipográfico si la URL falla (nunca un hueco en blanco). */
export function CourseImage({ src, title, style }: { src: string; title: string; style?: CSSProperties }) {
  const [failed, setFailed] = useState(!src);
  if (failed) {
    return (
      <div className="no-img display" style={{ width: "100%", height: "100%", ...style }}>
        {shortCourseName(title).split(" ")[0]}
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" decoding="async" style={style} onError={() => setFailed(true)} />;
}

// Íconos en SVG: las fuentes de la TV no siempre traen glifos como → o ✓ (se verían como cuadritos).
export function ArrowIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12h15M12 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PointerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 2 L4 19 L8.6 14.9 L11.6 21.6 L14.6 20.3 L11.7 13.7 L18 13.4 Z" fill="#FFFFFF" stroke="#111111" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
