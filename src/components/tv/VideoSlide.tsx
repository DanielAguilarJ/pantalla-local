"use client";

import { ManagedVideo } from "./ManagedVideo";

/** Reel de Instagram o video manual a pantalla completa, sin ninguna UI encima. */
export function VideoSlide({ src, fit, onDone }: { src: string; fit: "cover" | "auto"; onDone: () => void }) {
  return (
    <div className="slide">
      <ManagedVideo src={src} fit={fit} onDone={onDone} />
    </div>
  );
}
