"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { releaseVideo } from "./ManagedVideo";

interface WakeLockSentinelLike {
  released: boolean;
  release(): Promise<void>;
}
interface WakeLockLike {
  request(type: "screen"): Promise<WakeLockSentinelLike>;
}

const AMBIENT_SRC = "/ambient.mp4";
/** Revisión de salud del modo "siempre activa". */
export const PULSE_MS = 15_000;

/**
 * Mantiene la pantalla despierta 24/7 en LG webOS.
 *
 * Política de webOS: el salvapantallas arranca tras un rato sin usar el control remoto, EXCEPTO mientras se
 * reproduce un video a pantalla completa. Además, webOS solo admite un video a la vez. Por eso:
 *  - Cuando el anuncio en curso NO es un video (comerciales CSS, cierres, imágenes), aquí suena un video
 *    a pantalla completa en bucle (320×180, ~14 KB, escalado a toda la pantalla) tapado por el fondo del anuncio.
 *  - Cuando el anuncio en curso SÍ es un video (reels, showreels, MP4 subidos), este video se libera ANTES
 *    de que arranque el otro, para no competir por el único decodificador.
 *  - Cada 15 s: si el video debería sonar y está detenido o atascado, se reinicia; se vuelve a pedir la
 *    Screen Wake Lock.
 *
 * Nota: un "toque simulado" desde JavaScript no sirve: los eventos sintéticos no llegan al sistema operativo
 * de la TV y no reinician su temporizador de inactividad. Lo que sí respeta webOS es el video a pantalla completa.
 */
export function KeepAwake({ active }: { active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeRef = useRef(active);

  const start = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.getAttribute("src") !== AMBIENT_SRC) v.setAttribute("src", AMBIENT_SRC);
    v.muted = true;
    v.defaultMuted = true;
    v.loop = true;
    v.setAttribute("muted", "");
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => undefined);
  };

  // useLayoutEffect + este componente va ANTES del anuncio en el árbol: se libera el video de fondo
  // antes de que el video del anuncio pida el decodificador.
  useLayoutEffect(() => {
    activeRef.current = active;
    if (active) start();
    else releaseVideo(videoRef.current);
  }, [active]);

  useEffect(() => {
    let lock: WakeLockSentinelLike | null = null;
    let disposed = false;
    let lastTime = -1;
    const wakeLock = (navigator as Navigator & { wakeLock?: WakeLockLike }).wakeLock;

    const requestLock = async () => {
      if (disposed || !wakeLock || document.visibilityState !== "visible") return;
      if (lock && !lock.released) return;
      try {
        lock = await wakeLock.request("screen");
      } catch {
        /* sin permiso o no soportado */
      }
    };

    const pulse = () => {
      void requestLock();
      const v = videoRef.current;
      if (!v || !activeRef.current) {
        lastTime = -1;
        return;
      }
      const stuck = lastTime >= 0 && v.currentTime === lastTime;
      if (v.paused || v.readyState < 2 || stuck || !v.getAttribute("src")) {
        releaseVideo(v);
        start();
      }
      lastTime = v.currentTime;
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") pulse();
    };
    const onError = () => {
      // Si el archivo falla (red), se reintenta en el siguiente pulso.
      lastTime = -1;
    };

    void requestLock();
    const interval = setInterval(pulse, PULSE_MS);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("keydown", pulse);
    window.addEventListener("pointerdown", pulse);
    const v = videoRef.current;
    v?.addEventListener("error", onError);

    return () => {
      disposed = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("keydown", pulse);
      window.removeEventListener("pointerdown", pulse);
      v?.removeEventListener("error", onError);
      releaseVideo(videoRef.current);
      if (lock && !lock.released) lock.release().catch(() => undefined);
    };
  }, []);

  return (
    <>
      <video ref={videoRef} className="ambient" muted loop playsInline preload="auto" aria-hidden="true" tabIndex={-1} />
      {/* Fondo del anuncio encima del video: el video cuenta como "pantalla completa" pero no se ve. */}
      <div className="ambient-cover" aria-hidden="true" />
    </>
  );
}
