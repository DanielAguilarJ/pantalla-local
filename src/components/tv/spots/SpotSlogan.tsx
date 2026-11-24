"use client";

import { BRAND_CONTENT, type BrandPlay } from "../engine";
import { BeatStack, type Beat } from "./BeatStack";
import { EdFooter, Masthead, Stage } from "./kit";

const TIMES = [0, 3000, 6000, 8800];

/** Anuncio de marca · El titular de ultravelozmente.com a tamaño cartel, en golpes: "No solo aprendas contenidos…". */
export function SpotSlogan({ play }: { play: BrandPlay }) {
  const beats = BRAND_CONTENT.manifesto.beats as Beat[];
  return (
    <Stage className="sp-big sp-slogan">
      <Masthead label="WorldBrain México" />
      <BeatStack beats={beats} times={TIMES} />
      <EdFooter featured={play.featured} palette={play.palette} delayMs={700} />
    </Stage>
  );
}
