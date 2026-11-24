"use client";

import { useEffect, useMemo, useState } from "react";
import { rngFrom, shuffle } from "@/lib/seed";
import { BRAND_CONTENT, type BrandPlay } from "../engine";
import { FitLines } from "../FitLines";
import { breakLines, lineChars } from "../text";
import { useOrientation } from "../useOrientation";
import { EdFooter, Masthead, Stage } from "./kit";

const FIRST_MS = 1300;
const EVERY_MS = 1500;
const MAX_ITEMS = 7;

/**
 * Anuncio de marca · "GRATIS" gigante + los programas que ofrecen su primera sesión sin costo,
 * uno tras otro en un bloque de color. Todos los nombres y ofertas salen del catálogo (páginas reales).
 */
export function SpotFree({ play }: { play: BrandPlay }) {
  const f = BRAND_CONTENT.free;
  const portrait = useOrientation() === "portrait";
  const all = play.roster.filter((r) => r.offer);
  const list = useMemo(() => {
    const others = shuffle(rngFrom("free", play.seed), all.filter((r) => r.id !== play.featured.id));
    return [play.featured].concat(others).filter((r) => r.offer).slice(0, MAX_ITEMS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play.seed, play.featured.id]);
  const [i, setI] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = setTimeout(() => {
      setI(1 % list.length);
      timer = setInterval(() => setI((x) => (x + 1) % list.length), EVERY_MS);
    }, FIRST_MS + EVERY_MS);
    return () => {
      clearTimeout(start);
      if (timer) clearInterval(timer);
    };
  }, [list.length]);

  const item = list[i] || play.featured;

  return (
    <Stage className="sp-big sp-free">
      <Masthead label="Prueba sin costo" />
      <div className="bt-hero">
        <div className="bt-beat tone-plain">
          <div className="bt-kicker ed-up" style={{ animationDelay: "80ms" }}>
            {f.kicker}
          </div>
          <div className="fr-word">
            <FitLines lines={[f.word]} maxVmin={40} startMs={150} />
          </div>
          <div key={item.id} className="fr-slot">
            <FitLines lines={breakLines(item.course.title, lineChars(portrait, "name") + 2)} maxVmin={13} />
            <div className="fr-offer">{item.offerShort}</div>
          </div>
          <div className="bt-sub ed-up" style={{ animationDelay: "800ms" }}>
            {all.length} {f.note}
          </div>
        </div>
      </div>
      <EdFooter featured={play.featured} palette={play.palette} delayMs={700} />
    </Stage>
  );
}
