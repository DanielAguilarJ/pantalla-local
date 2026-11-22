"use client";

import { useEffect, useRef } from "react";
import { hashString } from "@/lib/seed";
import type { PatternId } from "./engine";

interface Props {
  pattern: PatternId;
  seed: string;
  bg: string;
  ink: string;
  accent: string;
  className?: string;
}

const TAU = Math.PI * 2;
const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/** Patrón geométrico generativo en Canvas 2D (requestAnimationFrame, resolución limitada para TV). */
export function GenerativeCanvas({ pattern, seed, bg, ink, accent, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const salt = hashString(`${seed}|${pattern}`);
    const bit = (i: number, j: number) => (hashString(`${salt}|${i}|${j}`) & 3) as 0 | 1 | 2 | 3;
    let w = 0;
    let h = 0;
    let raf = 0;
    const t0 = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width * dpr));
      h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      const m = Math.min(w, h);

      if (pattern === "truchet") {
        const cell = m / 5;
        ctx.lineWidth = cell * 0.2;
        ctx.lineCap = "butt";
        for (let i = 0; i * cell < w + cell; i++) {
          for (let j = 0; j * cell < h + cell; j++) {
            const phase = t * 0.55 - (i + j) * 0.09;
            const k = Math.floor(phase);
            const turn = bit(i, j) + k + ease((phase - k - 0.65) / 0.35);
            const cx = i * cell + cell / 2;
            const cy = j * cell + cell / 2;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate((turn * Math.PI) / 2);
            ctx.strokeStyle = (i + j) % 4 === 0 ? accent : ink;
            ctx.beginPath();
            ctx.arc(-cell / 2, -cell / 2, cell / 2, 0, Math.PI / 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cell / 2, cell / 2, cell / 2, Math.PI, Math.PI * 1.5);
            ctx.stroke();
            ctx.restore();
          }
        }
      } else if (pattern === "rings") {
        const gap = m / 9;
        const maxR = Math.hypot(w, h) / 2 + gap;
        ctx.lineWidth = gap * 0.38;
        const offset = (t * gap * 0.6) % (gap * 2);
        for (let r = offset, n = 0; r < maxR; r += gap, n++) {
          ctx.strokeStyle = n % 2 === 0 ? ink : accent;
          ctx.beginPath();
          ctx.arc(w / 2, h / 2, r, 0, TAU);
          ctx.stroke();
        }
      } else if (pattern === "stripes") {
        const period = m / 5;
        const diag = Math.hypot(w, h);
        ctx.translate(w / 2, h / 2);
        ctx.rotate(-Math.PI / 4);
        const shift = (t * period * 0.5) % period;
        for (let x = -diag / 2 - period; x < diag / 2 + period; x += period) {
          ctx.fillStyle = ink;
          ctx.fillRect(x + shift, -diag / 2, period * 0.32, diag);
          ctx.fillStyle = accent;
          ctx.fillRect(x + shift + period * 0.5, -diag / 2, period * 0.12, diag);
        }
      } else if (pattern === "dots") {
        const s = m / 8;
        for (let i = 0; i * s < w + s; i++) {
          for (let j = 0; j * s < h + s; j++) {
            const x = i * s + s / 2;
            const y = j * s + s / 2;
            const d = Math.hypot(x - w / 2, y - h / 2) / s;
            const r = s * 0.44 * (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(d * 0.9 - t * 2.6)));
            ctx.fillStyle = (i * 7 + j * 3) % 9 === 0 ? accent : ink;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, TAU);
            ctx.fill();
          }
        }
      } else {
        const s = m / 5;
        for (let i = 0; i * s < w + s; i++) {
          for (let j = 0; j * s < h + s; j++) {
            const phase = t * 0.5 + bit(i, j) * 0.25 - (i + j) * 0.06;
            const k = Math.floor(phase);
            const a = (k + ease((phase - k - 0.5) / 0.5)) * (Math.PI / 2);
            ctx.save();
            ctx.translate(i * s + s / 2, j * s + s / 2);
            ctx.rotate(a);
            ctx.fillStyle = (i + j) % 3 === 0 ? accent : ink;
            const size = s * 0.5;
            ctx.fillRect(-size / 2, -size / 2, size, size);
            ctx.restore();
          }
        }
      }
      raf = requestAnimationFrame(frame);
    };

    resize();
    raf = requestAnimationFrame(frame);
    // Reacomoda el lienzo al girar la pantalla (sin recargar).
    const RO = (window as unknown as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
    const ro = RO ? new RO(resize) : null;
    if (ro) ro.observe(canvas);
    else window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", resize);
      // Libera la memoria del backbuffer en TVs con poca RAM.
      canvas.width = 1;
      canvas.height = 1;
    };
  }, [pattern, seed, bg, ink, accent]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
