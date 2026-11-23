"use client";

import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { BRAND } from "@/lib/brand";
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
  const n = splitWords(text).length;
  // Mismo tope que Reveal: la frase completa se lee en menos de un segundo.
  stepMs = n > 1 ? Math.min(stepMs, 600 / (n - 1)) : stepMs;
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

/**
 * Imagen del curso. Mientras carga (o si falla) muestra una placa tipográfica con el nombre del programa:
 * nunca un hueco de color plano. Al cargar, la foto aparece con un fundido.
 */
export function CourseImage({ src, title, style }: { src: string; title: string; style?: CSSProperties }) {
  const [state, setState] = useState<"loading" | "loaded" | "failed">(src ? "loading" : "failed");
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Si la imagen ya venía en caché y terminó antes de enganchar onLoad.
    const img = ref.current;
    if (img && img.complete && img.naturalWidth > 0) setState("loaded");
  }, [src]);

  return (
    <>
      {state !== "loaded" ? (
        <div className="no-img img-ph display" aria-hidden="true">
          {shortCourseName(title).split(" ")[0]}
        </div>
      ) : null}
      {state !== "failed" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={src}
          alt=""
          decoding="async"
          style={{ ...style, opacity: state === "loaded" ? 1 : 0, transition: "opacity .5s ease" }}
          onLoad={() => setState("loaded")}
          onError={() => setState("failed")}
        />
      ) : null}
    </>
  );
}

/** Logo de WorldBrain sobre una ficha del color de fondo (legible encima de cualquier escena). */
export function BrandBug({ className = "" }: { className?: string }) {
  return (
    <div className={`brand-bug fade-in ${className}`} style={{ animationDelay: "300ms" }}>
      <BrandLogo />
    </div>
  );
}

/** Palabra de impacto para sellos y estrellas según la oferta publicada ("GRATIS", "SIN COSTO", "CORTESÍA"). */
export function offerWord(offer: string): string {
  if (/gratis|gratuit/i.test(offer)) return "Gratis";
  if (/sin costo/i.test(offer)) return "Sin costo";
  if (/cortes/i.test(offer)) return "Cortesía";
  return "";
}

function mentions(text: string, offerShort: string): boolean {
  return !!offerShort && text.toLowerCase().indexOf(offerShort.toLowerCase()) >= 0;
}

/** Etiqueta de oferta del QR: vacía si el titular ya la dice (repetir la misma frase tres veces resta fuerza). */
export function offerTag(headline: string, offerShort: string): string {
  return mentions(headline, offerShort) ? "" : offerShort;
}

/** Texto del botón: la oferta concreta si existe; si el titular ya la dijo, un verbo de acción. */
export function ctaLabel(offerShort: string, headline = ""): string {
  if (!offerShort) return "Inscribirme";
  return mentions(headline, offerShort) ? "Aparta tu lugar" : offerShort;
}

/** Precio si el curso lo trae; si no (el sitio de WorldBrain no publica precios), el WhatsApp de informes. */
export function PriceOrContact({ price, delayMs }: { price: string; delayMs: number }) {
  if (price) {
    return (
      <span className="price-pill display pop-in" style={{ animationDelay: `${delayMs}ms` }}>
        {price}
      </span>
    );
  }
  return <PhoneCta size="m" delayMs={delayMs} />;
}

/** Ícono de WhatsApp simplificado (burbuja + auricular), en SVG para no depender de fuentes de la TV. */
export function WhatsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.6a9.4 9.4 0 0 0-8.1 14.1L2.6 21.4l4.8-1.3A9.4 9.4 0 1 0 12 2.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
      <path
        d="M8.7 7.6c.3-.2.8-.2 1 .2l.9 1.8c.1.3.1.6-.1.8l-.6.7c.6 1.3 1.6 2.3 2.9 2.9l.7-.6c.2-.2.5-.3.8-.1l1.8.9c.4.2.5.7.2 1-.5.8-1.4 1.3-2.3 1.1-3.1-.6-5.5-3-6.1-6.1-.2-.9.3-1.8 1.1-2.3Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Píldora de WhatsApp con el número grande y un ícono que "timbra" cada pocos segundos. */
export function PhoneCta({
  size = "m",
  delayMs,
  label = "Informes por WhatsApp",
  className = "",
}: {
  size?: "s" | "m" | "l";
  delayMs?: number;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={`phone-cta phone-${size} ${delayMs !== undefined ? "pop-in" : ""} ${className}`}
      style={delayMs !== undefined ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      <span className="phone-ico">
        <WhatsIcon />
      </span>
      <span className="phone-txt">
        <span className="phone-lbl">{label}</span>
        <span className="phone-num display">{BRAND.whatsappDisplay}</span>
      </span>
    </span>
  );
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
