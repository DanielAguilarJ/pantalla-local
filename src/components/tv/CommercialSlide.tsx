"use client";

import { useEffect, useRef } from "react";
import { COMMERCIAL_MS, type CommercialPlay } from "./engine";
import { SceneAge } from "./scenes/SceneAge";
import { SceneBeats } from "./scenes/SceneBeats";
import { SceneChecklist } from "./scenes/SceneChecklist";
import { SceneCover } from "./scenes/SceneCover";
import { SceneQuestion } from "./scenes/SceneQuestion";
import { SceneFlash } from "./scenes/SceneFlash";
import { SceneIndex } from "./scenes/SceneIndex";
import { SceneKinetic } from "./scenes/SceneKinetic";
import { SceneMockup } from "./scenes/SceneMockup";
import { SceneScan } from "./scenes/SceneScan";
import { SceneSplit } from "./scenes/SceneSplit";
import { SceneTicker } from "./scenes/SceneTicker";
import { BrandSpot } from "./spots/BrandSpot";

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

  return (
    <>
      <PlayBody play={play} />
      {/* Cortinilla de entrada (acento → pop) y barra de progreso de 12 s: el "acabado" común de todos los anuncios. */}
      <div className="ad-chrome" aria-hidden="true">
        <span className="ad-wipe w1" />
        <span className="ad-wipe w2" />
        <span className="ad-progress" style={{ animationDuration: `${COMMERCIAL_MS}ms` }} />
      </div>
    </>
  );
}

function PlayBody({ play }: { play: CommercialPlay }) {
  if (play.kind === "brand") return <BrandSpot play={play} />;
  switch (play.scene) {
    case "mockup":
      return <SceneMockup play={play} />;
    case "kinetic":
      return <SceneKinetic play={play} />;
    case "ticker":
      return <SceneTicker play={play} />;
    case "split":
      return <SceneSplit play={play} />;
    case "cover":
      return <SceneCover play={play} />;
    case "index":
      return <SceneIndex play={play} />;
    case "scan":
      return <SceneScan play={play} />;
    case "beats":
      return <SceneBeats play={play} />;
    case "question":
      return <SceneQuestion play={play} />;
    case "age":
      return <SceneAge play={play} />;
    case "checklist":
      return <SceneChecklist play={play} />;
    default:
      return <SceneFlash play={play} />;
  }
}
