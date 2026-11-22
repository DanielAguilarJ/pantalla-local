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
const MAX_MS = 15 * 60_000; // tope absoluto por si duration nunca llega

interface Props {
  src: string;
  /** "cover" siempre recorta (reels). "auto" recorta solo si la proporción es parecida a la pantalla. */
  fit: "cover" | "auto";
  onDone: () => void;
}

export function VideoSlide({ src, fit, onDone }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  const [mode, setMode] = useState<"cover" | "contain">("cover");

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
      const elapsed = Date.now() - started;
      if (Date.now() - lastProgress > STALL_MS || elapsed > Math.min(duration, MAX_MS)) finish();
    }, 1000);

    return () => {
      clearInterval(watchdog);
      releaseVideo(el);
    };
  }, [src, finish]);

  const onMeta = () => {
    const el = ref.current;
    if (!el || fit === "cover" || !el.videoWidth || !el.videoHeight) return;
    const videoRatio = el.videoWidth / el.videoHeight;
    const screenRatio = window.innerWidth / window.innerHeight;
    setMode(Math.abs(Math.log(videoRatio / screenRatio)) < 0.25 ? "cover" : "contain");
  };

  const onError = () => {
    // Tras releaseVideo() no hay src: ese "error" es nuestro y no debe saltar otro ítem.
    if (ref.current && ref.current.getAttribute("src")) finish();
  };

  return (
    <div className="slide">
      <video
        ref={ref}
        src={src}
        className={`media-${mode}`}
        autoPlay
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        onEnded={finish}
        onError={onError}
        onLoadedMetadata={onMeta}
      />
    </div>
  );
}
