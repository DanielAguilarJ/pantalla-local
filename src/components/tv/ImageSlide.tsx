"use client";

import { useEffect, useRef, useState } from "react";

const LOAD_TIMEOUT_MS = 12_000;

/** Anuncio manual de imagen con duración configurable y un zoom muy lento (evita retención en paneles OLED). */
export function ImageSlide({ src, durationSec, onDone }: { src: string; durationSec: number; onDone: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<"cover" | "contain">("contain");
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDoneRef.current();
    };
    const ms = Math.min(Math.max(durationSec, 3), 300) * 1000;
    // Hasta que cargue, solo corre un tiempo de espera; al cargar arranca la duración configurada.
    const timer = setTimeout(finish, loaded ? ms : LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loaded, durationSec]);

  return (
    <div className="slide">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        decoding="async"
        className={`media-${mode} ${loaded ? "kenburns" : ""}`}
        style={{ opacity: loaded ? 1 : 0, transition: "opacity .4s ease" }}
        onLoad={(e) => {
          const img = e.currentTarget;
          const ratio = img.naturalWidth / Math.max(1, img.naturalHeight);
          const screen = window.innerWidth / window.innerHeight;
          setMode(Math.abs(Math.log(ratio / screen)) < 0.25 ? "cover" : "contain");
          setLoaded(true);
        }}
        onError={() => {
          if (!doneRef.current) {
            doneRef.current = true;
            onDoneRef.current();
          }
        }}
      />
    </div>
  );
}
