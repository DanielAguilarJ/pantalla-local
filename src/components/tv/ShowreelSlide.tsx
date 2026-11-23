"use client";

import { BrandLogo } from "../BrandLogo";
import { BRAND } from "@/lib/brand";
import type { Palette } from "@/lib/palettes";
import type { PlaylistReel } from "@/lib/types";
import { ManagedVideo } from "./ManagedVideo";
import { QrBadge } from "./QrCode";
import { PhoneCta, WhatsIcon } from "./scenes/shared";
import { useOrientation } from "./useOrientation";

type Showreel = NonNullable<PlaylistReel["showreel"]>;

/** En vertical el showreel dura menos: quien pasa caminando ve 5–10 s, y el video 16:9 ocupa solo la franja central. */
const PORTRAIT_MAX_MS = 18_000;

/**
 * Showreel oficial de un programa (videos 16:9 de ultravelozmente.com). Se usa cuando Instagram aporta pocos reels.
 *
 * El elemento <video> SIEMPRE ocupa el 100 % de la pantalla (regla de LG para que no entre el salvapantallas).
 * - Horizontal: el video llena la pantalla (cover) con ficha, WhatsApp y QR encima.
 * - Vertical: el cuadro se ve completo y al máximo ancho posible (contain = 33,6 × 18,9 cm en la StanbyMe 2),
 *   sin recortar los textos del video; arriba y abajo, paneles opacos con el mensaje en letra de cartel.
 */
export function ShowreelSlide({
  reel,
  info,
  palette,
  onDone,
}: {
  reel: PlaylistReel;
  info: Showreel;
  palette: Palette;
  onDone: () => void;
}) {
  const portrait = useOrientation() === "portrait";
  const maxMs = reel.maxSec ? reel.maxSec * 1000 : undefined;

  if (portrait) {
    return (
      <div className="slide sr slide-v srp">
        <ManagedVideo src={reel.src} fit="contain" maxMs={Math.min(maxMs || PORTRAIT_MAX_MS, PORTRAIT_MAX_MS)} onDone={onDone} />
        <div className="srp-top">
          <div className="srp-brand">
            <BrandLogo className="srp-logo" />
            {info.ages ? <span className="srp-ages">{info.ages}</span> : null}
          </div>
          <div className="srp-title display">{info.title}</div>
          {info.benefit ? <div className="srp-benefit ed-serif">{info.benefit}.</div> : null}
        </div>
        <span className="srp-edge e-top" aria-hidden="true" />
        <span className="srp-edge e-bottom" aria-hidden="true" />
        <div className="srp-bottom">
          {info.offer ? (
            <div className="srp-offer">
              <svg className="srp-star" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.5l2.6 6.1 6.6.6-5 4.4 1.5 6.5L12 16.7l-5.7 3.4 1.5-6.5-5-4.4 6.6-.6z" fill="currentColor" />
              </svg>
              {info.offer}
            </div>
          ) : null}
          <div className="srp-row">
            <div className="srp-call">
              <div className="srp-call-lbl">
                <span className="srp-call-ico">
                  <WhatsIcon />
                </span>
                Informes
              </div>
              <div className="srp-call-num display">{BRAND.whatsappDisplay}</div>
            </div>
            <QrBadge url={info.course_url} dark={palette.qrDark} className="qr-inline srp-qr" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="slide sr slide-v">
      <ManagedVideo src={reel.src} fit="cover" maxMs={maxMs} onDone={onDone} />
      <div className="sr-head">
        <BrandLogo className="sr-logo" />
      </div>
      <div className="sr-panel">
        <div className="sr-title display">{info.title}</div>
        <div className="sr-meta">
          <span className="sr-benefit">{info.benefit}</span>
          <span className="sr-dot" />
          {info.ages}
        </div>
        <PhoneCta size="s" className="sr-phone" />
      </div>
      <QrBadge url={info.course_url} dark={palette.qrDark} className="qr-br" offer={info.offer} />
    </div>
  );
}
