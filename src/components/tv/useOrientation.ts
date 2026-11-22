"use client";

import { useEffect, useState } from "react";

export type Orientation = "portrait" | "landscape";

function current(): Orientation {
  if (typeof window === "undefined") return "landscape";
  return window.matchMedia("(orientation: portrait)").matches ? "portrait" : "landscape";
}

/**
 * El layout se adapta con @media (orientation); este hook solo se usa para decisiones de
 * estructura (p. ej. teléfono vs laptop) y reacciona al girar la pantalla sin recargar.
 */
export function useOrientation(): Orientation {
  const [o, setO] = useState<Orientation>(current);
  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait)");
    const onChange = () => setO(mq.matches ? "portrait" : "landscape");
    onChange();
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    window.addEventListener("resize", onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
      window.removeEventListener("resize", onChange);
    };
  }, []);
  return o;
}
