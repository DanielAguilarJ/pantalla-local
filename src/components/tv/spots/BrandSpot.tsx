"use client";

import type { BrandPlay } from "../engine";
import { SpotMethod } from "./SpotMethod";
import { SpotNumbers } from "./SpotNumbers";
import { SpotRitual } from "./SpotRitual";
import { SpotStages } from "./SpotStages";
import { SpotTestimonial } from "./SpotTestimonial";

/** Anuncios institucionales de WorldBrain (12 s, CSS/SVG puro, con QR al programa recomendado). */
export function BrandSpot({ play }: { play: BrandPlay }) {
  switch (play.spot) {
    case "testimonial":
      return <SpotTestimonial play={play} />;
    case "method":
      return <SpotMethod play={play} />;
    case "numbers":
      return <SpotNumbers play={play} />;
    case "ritual":
      return <SpotRitual play={play} />;
    default:
      return <SpotStages play={play} />;
  }
}
