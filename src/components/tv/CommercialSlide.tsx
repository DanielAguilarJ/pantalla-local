"use client";

import { useEffect, useRef } from "react";
import { COMMERCIAL_MS, type CommercialPlay } from "./engine";
import { SceneFlash } from "./scenes/SceneFlash";
import { SceneKinetic } from "./scenes/SceneKinetic";
import { SceneMockup } from "./scenes/SceneMockup";
import { SceneSplit } from "./scenes/SceneSplit";
import { SceneTicker } from "./scenes/SceneTicker";

/** Comercial animado de 12 s. Todo es CSS/SVG/Canvas en el navegador: cero IA y cero video pre-renderizado. */
export function CommercialSlide({ play, onDone }: { play: CommercialPlay; onDone: () => void }) {
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const t = setTimeout(() => onDoneRef.current(), COMMERCIAL_MS);
    return () => clearTimeout(t);
  }, []);

  switch (play.scene) {
    case "mockup":
      return <SceneMockup play={play} />;
    case "kinetic":
      return <SceneKinetic play={play} />;
    case "ticker":
      return <SceneTicker play={play} />;
    case "split":
      return <SceneSplit play={play} />;
    default:
      return <SceneFlash play={play} />;
  }
}
