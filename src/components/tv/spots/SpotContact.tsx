"use client";

import { BRAND } from "@/lib/brand";
import { BRAND_CONTENT, type BrandPlay } from "../engine";
import { QrBadge } from "../QrCode";
import { WhatsIcon } from "../scenes/shared";
import { Masthead, Reveal, Stage } from "./kit";

/** Anuncio de marca · "Hablar con un asesor": el WhatsApp a tamaño cartel, con ondas que salen del ícono. */
export function SpotContact({ play }: { play: BrandPlay }) {
  const c = BRAND_CONTENT.contact;
  const groups = BRAND.whatsappDisplay.split(" ");
  return (
    <Stage className="sp-contact">
      <Masthead label={c.kicker} />
      <div className="ct-head ed-serif">
        <Reveal text={c.headline} startMs={250} stepMs={80} />
      </div>

      <div className="ct-call">
        <div className="ct-icon-wrap" aria-hidden="true">
          <span className="ct-wave w1" />
          <span className="ct-wave w2" />
          <span className="ct-wave w3" />
          <span className="ct-icon">
            <WhatsIcon />
          </span>
        </div>
        <div className="ed-mono ct-label ed-up" style={{ animationDelay: "300ms" }}>
          Escríbenos por WhatsApp
        </div>
        <div className="ct-number display">
          {groups.map((g, i) => (
            <span key={i} className="rv-w">
              <span className="rv-i" style={{ animationDelay: `${350 + i * 120}ms` }}>
                {g}
              </span>
            </span>
          ))}
        </div>
        <div className="ct-sub ed-up" style={{ animationDelay: "800ms" }}>
          {c.sub}
        </div>
        <div className="ed-mono ct-hours ed-up" style={{ animationDelay: "900ms" }}>
          {BRAND.facts.hours}
        </div>
      </div>

      <div className="ct-qr-row ed-up" style={{ animationDelay: "700ms" }}>
        <div className="ct-qr-text">
          <div className="ed-mono ct-qr-kicker">O mira el temario de</div>
          <div className="ct-qr-title display">{play.featured.course.title}</div>
          {play.featured.offer ? <div className="ct-qr-offer">{play.featured.offer}</div> : null}
        </div>
        <QrBadge url={play.featured.course.course_url} dark={play.palette.qrDark} className="qr-inline" />
      </div>
    </Stage>
  );
}
