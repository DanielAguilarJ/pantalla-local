"use client";

import { useEffect, useRef } from "react";

interface WakeLockSentinelLike {
  released: boolean;
  release(): Promise<void>;
}
interface WakeLockLike {
  request(type: "screen"): Promise<WakeLockSentinelLike>;
}

/**
 * Evita que webOS apague la pantalla o lance el salvapantallas por falta de actividad del control remoto:
 *  1) Screen Wake Lock API cuando existe (se vuelve a pedir al recuperar visibilidad).
 *  2) Un <video> invisible de 1x1 px en bucle infinito (muted loop autoPlay) como respaldo universal.
 */
export function KeepAwake() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let lock: WakeLockSentinelLike | null = null;
    let disposed = false;
    const wakeLock = (navigator as Navigator & { wakeLock?: WakeLockLike }).wakeLock;

    const requestLock = async () => {
      if (disposed || !wakeLock || document.visibilityState !== "visible") return;
      if (lock && !lock.released) return;
      try {
        lock = await wakeLock.request("screen");
      } catch {
        /* sin permiso o no soportado: queda el video de respaldo */
      }
    };

    const keepVideo = () => {
      const v = videoRef.current;
      if (!v) return;
      v.muted = true;
      v.setAttribute("muted", "");
      if (v.paused) v.play().catch(() => undefined);
    };

    const refresh = () => {
      void requestLock();
      keepVideo();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };

    refresh();
    document.addEventListener("visibilitychange", onVisibility);
    // Una pulsación del control remoto cuenta como gesto del usuario: buen momento para reintentar.
    window.addEventListener("keydown", refresh);
    window.addEventListener("pointerdown", refresh);
    const interval = setInterval(refresh, 60_000);

    return () => {
      disposed = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("keydown", refresh);
      window.removeEventListener("pointerdown", refresh);
      if (lock && !lock.released) lock.release().catch(() => undefined);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="keepalive"
      src="/keepalive.mp4"
      muted
      loop
      autoPlay
      playsInline
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
