"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

/**
 * Libera el decodificador y el buffer de video. En LG webOS, desmontar un <video> sin esto
 * deja memoria retenida y tras horas de reproducción el navegador se congela.
 */
export function releaseVideo(el: HTMLVideoElement | null): void {
  if (!el) return;
  try {
    el.pause();
    el.removeAttribute("src");
    el.load();
  } catch {
    /* ignorar */
  }
}

const STALL_MS = 15_000; // sin avanzar currentTime durante 15 s => se salta
// Si el video no arranca en 6 s (red lenta), se salta: mientras carga no hay video sonando y webOS podría
// lanzar el salvapantallas. El siguiente anuncio no-video reactiva el video de fondo.
const START_MS = 6_000;
const MAX_MS = 15 * 60_000; // tope absoluto por si duration nunca llega

export interface ManagedVideoProps {
  src: string;
  /**
   * "cover" recorta (reels 9:16), "contain" muestra el cuadro completo (showreels 16:9 en vertical),
   * "auto" recorta solo si la proporción es parecida a la pantalla.
   */
  fit: "cover" | "contain" | "auto";
  /** Corta la reproducción antes del final (p. ej. showreels de 60 s). */
  maxMs?: number;
  onDone: () => void;
  className?: string;
}

/** <video> nativo (autoPlay muted playsInline) con watchdog anti-congelamiento y liberación de memoria. */
export function ManagedVideo({ src, fit, maxMs, onDone, className = "" }: ManagedVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  const [mode, setMode] = useState<"cover" | "contain">(fit === "contain" ? "contain" : "cover");

  useLayoutEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  // Libera la memoria ANTES de avisar al reproductor (que desmontará el componente).
  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    releaseVideo(ref.current);
    onDoneRef.current();
  }, []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    doneRef.current = false;
    if (el.getAttribute("src") !== src) el.setAttribute("src", src);
    // React no siempre refleja `muted` como atributo; sin él, algunos navegadores bloquean el autoplay.
    el.muted = true;
    el.defaultMuted = true;
    el.setAttribute("muted", "");
    const attempt = el.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(() => {
        setTimeout(() => {
          if (el.paused && !doneRef.current) el.play().catch(() => finish());
        }, 1500);
      });
    }

    const started = Date.now();
    let lastTime = -1;
    let lastProgress = Date.now();
    const watchdog = setInterval(() => {
      if (el.currentTime !== lastTime) {
        lastTime = el.currentTime;
        lastProgress = Date.now();
      }
      const duration = isFinite(el.duration) && el.duration > 0 ? el.duration * 1000 + 8000 : MAX_MS;
      const limit = Math.min(duration, maxMs || MAX_MS, MAX_MS);
      const neverStarted = lastTime <= 0 && Date.now() - started > START_MS;
      if (neverStarted || Date.now() - lastProgress > STALL_MS || Date.now() - started > limit) finish();
    }, 500);

    return () => {
      clearInterval(watchdog);
      releaseVideo(el);
    };
  }, [src, maxMs, finish]);

  const onMeta = () => {
    const el = ref.current;
    if (!el || fit !== "auto" || !el.videoWidth || !el.videoHeight) return;
    const videoRatio = el.videoWidth / el.videoHeight;
    const screenRatio = el.clientWidth / Math.max(1, el.clientHeight);
    setMode(Math.abs(Math.log(videoRatio / screenRatio)) < 0.25 ? "cover" : "contain");
  };

  const onError = () => {
    // Tras releaseVideo() no hay src: ese "error" es nuestro y no debe saltar otro ítem.
    if (ref.current && ref.current.getAttribute("src")) finish();
  };

  // `src` se asigna en el layout effect (no en el JSX): así el video de fondo de KeepAwake se libera antes
  // de que este video pida el decodificador. webOS solo reproduce un video a la vez.
  return (
    // .fsv = regla de LG para "video a pantalla completa": 100 % del viewport en (0,0), sin border,
    // transform ni opacity. Así webOS no lanza el salvapantallas mientras suena (ver KeepAwake.tsx).
    <video
      ref={ref}
      className={`fsv media-${mode} ${className}`}
      autoPlay
      muted
      playsInline
      preload="auto"
      disablePictureInPicture
      onEnded={finish}
      onError={onError}
      onLoadedMetadata={onMeta}
    />
  );
}
