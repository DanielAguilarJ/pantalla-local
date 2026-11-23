"use client";

import type { BrandPlay } from "../engine";
import { SpotContact } from "./SpotContact";
import { SpotGallery } from "./SpotGallery";
import { SpotHours } from "./SpotHours";
import { SpotMethod } from "./SpotMethod";
import { SpotNumbers } from "./SpotNumbers";
import { SpotRitual } from "./SpotRitual";
import { SpotStages } from "./SpotStages";
import { SpotStory } from "./SpotStory";
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
    case "contact":
      return <SpotContact play={play} />;
    case "hours":
      return <SpotHours play={play} />;
    case "gallery":
      return <SpotGallery play={play} />;
    case "story":
      return <SpotStory play={play} />;
    default:
      return <SpotStages play={play} />;
  }
}
