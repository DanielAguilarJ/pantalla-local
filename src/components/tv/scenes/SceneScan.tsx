"use client";

import type { CoursePlay } from "../engine";
import { QrCode } from "../QrCode";
import { Masthead, Reveal, Stage } from "../spots/kit";
import { offerTag, PhoneCta } from "./shared";

/**
 * Escena 8 · "Apunta tu cámara aquí": el QR es el protagonista (más de la mitad del ancho en vertical),
 * dentro de un visor con esquinas animadas, un láser translúcido y una flecha que lo señala.
 * El láser es delgado y semitransparente; con corrección de errores M el QR se sigue leyendo.
 */
export function SceneScan({ play }: { play: CoursePlay }) {
  const { course, featured, palette } = play;
  return (
    <Stage className="sc-scan">
      <Masthead label="Temario en tu celular" />

      <div className="scn-head">
        <div className="scn-kicker display ed-up" style={{ animationDelay: "250ms" }}>
          {course.title}
        </div>
        <div className="scn-title ed-serif">
          <Reveal text="Apunta tu cámara" startMs={450} stepMs={110} />{" "}
          <em>
            <Reveal text="aquí." startMs={800} stepMs={110} />
          </em>
        </div>
        {/* Quitar fricción: mucha gente cree que necesita una app para leer un QR. */}
        <div className="ed-mono scn-noapp ed-up" style={{ animationDelay: "900ms" }}>
          Sin descargar nada · solo abre la cámara
        </div>
      </div>

      <div className="scn-arrow" aria-hidden="true">
        <svg viewBox="0 0 60 90">
          <path d="M30 4 C 8 30, 52 52, 30 82 M14 66 L30 84 L46 66" />
        </svg>
      </div>

      <div className="scn-viewfinder">
        <span className="scn-halo" />
        <span className="qr-corner c-tl" />
        <span className="qr-corner c-tr" />
        <span className="qr-corner c-bl" />
        <span className="qr-corner c-br" />
        <div className="scn-card">
          <QrCode value={course.course_url} dark={palette.qrDark} className="scn-qr" />
          <span className="scn-laser" />
        </div>
        <div className="scn-label">Escanea para ver temario</div>
        {offerTag(course.hook_headline, featured.offerShort) ? <div className="scn-offer">+ {featured.offer}</div> : null}
        {featured.urgency ? <div className="ed-mono scn-urgency">{featured.urgency}</div> : null}
      </div>

      <div className="scn-foot">
        <div className="scn-hook ed-up" style={{ animationDelay: "1500ms" }}>
          {course.hook_headline}
        </div>
        <div className="ed-up" style={{ animationDelay: "1900ms" }}>
          <PhoneCta size="l" label="¿Dudas? Escríbenos" />
        </div>
      </div>
    </Stage>
  );
}
