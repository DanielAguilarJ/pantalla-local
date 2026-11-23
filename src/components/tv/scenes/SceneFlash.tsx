"use client";

import { QrBadge } from "../QrCode";
import type { CoursePlay } from "../engine";
import { BRAND } from "@/lib/brand";
import { ArrowIcon, BrandBug, StaggerWords } from "./shared";

function burstPoints(spikes: number, outer: number, inner: number): string {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

const BURST = burstPoints(18, 50, 40);

/**
 * Escena 5 · Cartel editorial de urgencia: sello gigante, palabras estampadas y pulso rítmico de escala.
 * El pulso es de 0.75 s (≈1.3 Hz) y sin destellos de color a pantalla completa (seguro para fotosensibilidad).
 */
export function SceneFlash({ play }: { play: CoursePlay }) {
  const { course, palette } = play;

  return (
    <div className="slide s-flash">
      <div className="fl-stripes" aria-hidden="true" />
      <div className="fl-frame" aria-hidden="true" />

      <div className="fl-left">
        <div className="fl-label-wrap">
          <span className="fl-label display">{play.flashLabel}</span>
        </div>
        <div className="fl-panel">
          <div className="fl-headline display">
            <StaggerWords text={course.hook_headline} className="" startMs={1300} stepMs={260} />
          </div>
          <div className="fl-course rise-in" style={{ animationDelay: "3600ms" }}>
            {course.title}
          </div>
          <div className="fl-cta">
            <span className="cta display pop-in" style={{ animationDelay: "4200ms" }}>
              Inscribirme <ArrowIcon /> escanea el QR
            </span>
          </div>
        </div>
      </div>

      <div className="fl-right">
        <div className="fl-burst">
          <svg className="fl-burst-svg" viewBox="0 0 100 100" aria-hidden="true">
            <polygon points={BURST} />
          </svg>
          <div className="fl-burst-text display">
            <span className="fl-burst-inner">{course.price || BRAND.noPriceBadge}</span>
          </div>
        </div>
      </div>

      <BrandBug className="brand-tl" />
      <QrBadge url={course.course_url} dark={palette.qrDark} className="fl-qr" />
    </div>
  );
}
