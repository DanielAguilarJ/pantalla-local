"use client";

import { useEffect, useRef } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { BRAND, whatsappLink } from "@/lib/brand";
import type { Palette } from "@/lib/palettes";
import { QrCode } from "./QrCode";
import { WhatsIcon } from "./scenes/shared";

export const END_CARD_MS = 6_000;

export interface EndCardInfo {
  /** Programa del anuncio que acaba de terminar (vacío = mensaje general de WorldBrain). */
  program: string;
  /** Oferta real publicada por el programa (vacía si no hay). */
  offer: string;
  urgency: string;
}

/**
 * Cierre de 6 s después de cada anuncio: QR gigante a WhatsApp con mensaje prellenado y el teléfono enorme.
 * Rompe el patrón (cambia todo el fondo al color de acento con un destello) para atraer la mirada.
 */
export function EndCard({ info, palette, onDone }: { info: EndCardInfo; palette: Palette; onDone: () => void }) {
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);
  useEffect(() => {
    const t = setTimeout(() => onDoneRef.current(), END_CARD_MS);
    return () => clearTimeout(t);
  }, []);

  const qr = whatsappLink(info.program || undefined);

  return (
    <div className="slide ec">
      <span className="ec-burst" aria-hidden="true" />

      <div className="ec-top">
        <BrandLogo className="ec-logo" />
        <span className="ed-mono ec-tag">Informes</span>
      </div>

      <div className="ec-copy">
        <div className="ec-kicker ed-serif">{info.program ? `¿Te interesa ${info.program}?` : "¿Quieres aprender mejor?"}</div>
        <div className="ec-head display">
          <span className="rv-w">
            <span className="rv-i" style={{ animationDelay: "250ms" }}>
              Escanea
            </span>
          </span>{" "}
          <span className="rv-w">
            <span className="rv-i" style={{ animationDelay: "380ms" }}>
              y pide
            </span>
          </span>{" "}
          <span className="rv-w">
            <span className="rv-i" style={{ animationDelay: "510ms" }}>
              informes
            </span>
          </span>
        </div>
        {info.offer ? (
          <div className="ec-offer">
            <svg className="ec-star" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2.5l2.6 6.1 6.6.6-5 4.4 1.5 6.5L12 16.7l-5.7 3.4 1.5-6.5-5-4.4 6.6-.6z" fill="currentColor" />
            </svg>
            <span>
              {info.offer}
              {info.urgency ? <span className="ec-urg"> · {info.urgency}</span> : null}
            </span>
          </div>
        ) : null}
      </div>

      <div className="ec-qr-zone">
        <span className="ec-arrow left" aria-hidden="true">
          <svg viewBox="0 0 40 40">
            <path d="M6 20h26M22 9l11 11-11 11" />
          </svg>
        </span>
        <span className="ec-arrow right" aria-hidden="true">
          <svg viewBox="0 0 40 40">
            <path d="M6 20h26M22 9l11 11-11 11" />
          </svg>
        </span>
        <div className="ec-qr">
          <span className="ec-halo" aria-hidden="true" />
          <span className="ec-halo h2" aria-hidden="true" />
          <span className="ec-corner k-tl" aria-hidden="true" />
          <span className="ec-corner k-tr" aria-hidden="true" />
          <span className="ec-corner k-bl" aria-hidden="true" />
          <span className="ec-corner k-br" aria-hidden="true" />
          <div className="ec-card">
            <QrCode value={qr} dark={palette.qrDark} className="ec-svg" />
          </div>
        </div>
        <div className="ed-mono ec-hint">Abre la cámara · directo a WhatsApp</div>
      </div>

      <div className="ec-phone">
        <span className="ec-phone-ico" aria-hidden="true">
          <WhatsIcon />
        </span>
        <span className="ec-phone-txt">
          <span className="ed-mono ec-phone-lbl">O escríbenos al</span>
          <span className="ec-phone-num display">{BRAND.whatsappDisplay}</span>
        </span>
      </div>

      <span className="ec-bar" style={{ animationDuration: `${END_CARD_MS}ms` }} aria-hidden="true" />
    </div>
  );
}
