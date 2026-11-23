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

/** Precio si el curso lo trae; si no (el sitio de WorldBrain no publica precios), el WhatsApp de informes. */
export function PriceOrContact({ price, delayMs }: { price: string; delayMs: number }) {
  if (price) {
    return (
      <span className="price-pill display pop-in" style={{ animationDelay: `${delayMs}ms` }}>
        {price}
      </span>
    );
  }
  return (
    <span className="contact-pill pop-in" style={{ animationDelay: `${delayMs}ms` }}>
      <ChatIcon />
      <span className="contact-pill-label">Informes</span>
      <span className="contact-pill-number display">{BRAND.whatsappDisplay}</span>
    </span>
  );
}

function ChatIcon() {
  return (
    <svg className="icon contact-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="8.5" cy="12" r="1.3" fill="currentColor" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
      <circle cx="15.5" cy="12" r="1.3" fill="currentColor" />
    </svg>
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
