"use client";

import { useLayoutEffect, useRef } from "react";

interface Props {
  lines: string[];
  /** Tope (vmin): evita que una palabra corta quede desproporcionada. */
  maxVmin?: number;
  /** Piso (vmin): por largo que sea el texto, nunca queda más chico que esto. */
  minVmin?: number;
  align?: "left" | "center";
  /** Si es true (por defecto), además de llenar el ancho respeta el alto de su caja. */
  fitHeight?: boolean;
  startMs?: number;
  stepMs?: number;
  className?: string;
}

type FontSetLike = { ready: Promise<unknown> };

/**
 * Tipografía de cartel: cada renglón se mide y se agranda hasta ocupar TODO el ancho disponible
 * (el clásico "texto apilado" de los espectaculares). En una pantalla pequeña es la forma de lograr
 * el texto más grande posible sin adivinar tamaños: el tamaño sale de medir el texto real.
 *
 * Mide con offsetWidth (no lo afectan transform ni opacity de las animaciones) y vuelve a medir cuando
 * cargan las fuentes y al girar la pantalla. Compatible con Chromium 79.
 */
export function FitLines({
  lines,
  maxVmin = 30,
  minVmin = 4,
  align = "left",
  fitHeight = true,
  startMs = 0,
  stepMs = 80,
  className = "",
}: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const key = lines.join("\n");
  // Escalonado con tope: el texto completo aparece en menos de 0,5 s.
  const step = lines.length > 1 ? Math.min(stepMs, 450 / (lines.length - 1)) : stepMs;

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const fit = () => {
      if (!box.isConnected) return;
      const rows = Array.prototype.slice.call(box.children) as HTMLElement[];
      if (!rows.length) return;
      const vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
      const W = box.clientWidth;
      const H = fitHeight ? box.clientHeight : 0;
      if (!W) return;
      const REF = 100;
      const sizes = rows.map((row) => {
        row.style.fontSize = `${REF}px`;
        const span = row.firstElementChild as HTMLElement | null;
        const w = (span && span.offsetWidth) || 1;
        return Math.min(maxVmin * vmin, (W * 0.985 * REF) / w);
      });
      rows.forEach((row, i) => (row.style.fontSize = `${sizes[i]}px`));
      let h = 0;
      rows.forEach((row) => (h += row.offsetHeight));
      const k = H > 0 && h > H ? H / h : 1;
      rows.forEach((row, i) => (row.style.fontSize = `${Math.max(minVmin * vmin, sizes[i] * k)}px`));
    };
    fit();
    const fonts = (document as Document & { fonts?: FontSetLike }).fonts;
    if (fonts && fonts.ready) fonts.ready.then(fit).catch(() => undefined);
    const late = setTimeout(fit, 700);
    window.addEventListener("resize", fit);
    return () => {
      clearTimeout(late);
      window.removeEventListener("resize", fit);
    };
  }, [key, maxVmin, minVmin, fitHeight]);

  return (
    <div ref={boxRef} className={`fit fit-${align}${fitHeight ? "" : " fit-auto"} display ${className}`}>
      {lines.map((l, i) => (
        <div key={`${i}-${l}`} className="fit-row">
          <span className="fit-line" style={{ animationDelay: `${startMs + i * step}ms` }}>
            {l}
          </span>
        </div>
      ))}
    </div>
  );
}
