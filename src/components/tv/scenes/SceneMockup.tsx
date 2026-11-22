"use client";

import { QrBadge } from "../QrCode";
import type { CommercialPlay } from "../engine";
import { useOrientation } from "../useOrientation";
import { CheckIcon, CourseImage, PointerIcon, StaggerWords } from "./shared";

/** Escena 1 · Smartphone/laptop 3D flotante con la landing real del curso y un cursor que hace clic. */
export function SceneMockup({ play }: { play: CommercialPlay }) {
  const { course, palette } = play;
  const portrait = useOrientation() === "portrait";
  const device = portrait ? "phone" : play.device;

  const screen = (
    <div className="dev-screen">
      <div className="dev-bar">
        {device === "laptop" ? (
          <>
            <span className="dev-dot" />
            <span className="dev-dot" />
            <span className="dev-dot" />
          </>
        ) : (
          <span>Inscripción en línea</span>
        )}
      </div>
      <div className="dev-hero">
        <CourseImage src={course.image_url} title={course.title} />
      </div>
      <div className="dev-body">
        <div className="dev-title display">{course.title}</div>
        {course.price ? <div className="dev-price">{course.price}</div> : null}
        <div className="dev-btn-wrap">
          <span className="dev-btn display">
            <span className="btn-a">Inscribirme</span>
            <span className="btn-b">
              <CheckIcon /> ¡Listo!
            </span>
          </span>
          <span className="click-ripple" />
          <PointerIcon className="cursor" />
        </div>
      </div>
      <div className="gloss" />
      <div className="glare" />
    </div>
  );

  return (
    <div className="slide s-mockup">
      <div className="mk-copy">
        <div className="mk-kicker fade-in" style={{ animationDelay: "200ms" }}>
          {course.title}
        </div>
        <div className="mk-headline display">
          <StaggerWords text={course.hook_headline} startMs={350} stepMs={120} />
        </div>
        {course.price ? (
          <div className="mk-price">
            <span className="price-pill display pop-in" style={{ animationDelay: "1400ms" }}>
              {course.price}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mk-device-wrap">
        <div className="dev-enter">
          <div className="device-3d">
            {device === "phone" ? (
              <div className="phone">
                <div className="phone-notch" />
                {screen}
              </div>
            ) : (
              <div className="laptop">
                <div className="laptop-lid">{screen}</div>
                <div className="laptop-base" />
              </div>
            )}
            <div className="dev-shadow" />
          </div>
        </div>
      </div>

      <QrBadge url={course.course_url} dark={palette.qrDark} className="mk-qr" />
    </div>
  );
}
