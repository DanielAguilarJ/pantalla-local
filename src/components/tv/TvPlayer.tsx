"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { BRAND } from "@/lib/brand";
import { PALETTES, paletteCssVars, paletteForSeed, type Palette } from "@/lib/palettes";
import { WeightedQueue } from "@/lib/queue";
import { dailySeed } from "@/lib/seed";
import { daypartAt, type Daypart } from "@/lib/sede-time";
import type { Playlist, PlaylistManual, PlaylistReel } from "@/lib/types";
import { CommercialSlide } from "./CommercialSlide";
import { EndCard, END_CARD_MS, type EndCardInfo } from "./EndCard";
import {
  COMMERCIAL_MS,
  isSceneId,
  isSpotId,
  planCommercial,
  toSources,
  type CommercialPlay,
  type CommercialSource,
  type PreviewTarget,
} from "./engine";
import { ImageSlide } from "./ImageSlide";
import { KeepAwake } from "./KeepAwake";
import { ShowreelSlide } from "./ShowreelSlide";
import { SlideBoundary } from "./SlideBoundary";
import { VideoSlide } from "./VideoSlide";

const SYNC_MS = 15 * 60_000; // sincronización silenciosa del JSON
const IDLE_SYNC_MS = 60_000; // sin contenido: reintenta cada minuto
const RELOAD_MS = 6 * 3_600_000; // recarga limpia para purgar la caché del navegador de la TV
const TICK_MS = 30_000;

type Current =
  | { key: number; type: "reel"; src: string }
  | { key: number; type: "showreel"; reel: PlaylistReel; info: NonNullable<PlaylistReel["showreel"]> }
  | { key: number; type: "manual-video"; src: string }
  | { key: number; type: "manual-image"; src: string; durationSec: number }
  | { key: number; type: "commercial"; play: CommercialPlay }
  | { key: number; type: "endcard"; info: EndCardInfo };

const GENERIC_END: EndCardInfo = { program: "", offer: "", urgency: "" };

/** Datos del cierre según el anuncio que terminó (programa, oferta y escasez reales). */
function endCardFor(c: Current): EndCardInfo {
  if (c.type === "commercial") {
    const f = c.play.featured;
    return { program: f.course.title, offer: f.offer, urgency: f.urgency };
  }
  if (c.type === "showreel") return { program: c.info.title, offer: c.info.offer, urgency: "" };
  return GENERIC_END;
}

/** Todos los anuncios llevan cierre, salvo los que ya SON un QR/teléfono gigante (no se repite dos veces seguidas). */
function wantsEndCard(c: Current): boolean {
  if (c.type === "endcard") return false;
  if (c.type === "commercial") {
    if (c.play.kind === "course" && c.play.scene === "scan") return false;
    if (c.play.kind === "brand" && c.play.spot === "contact") return false;
  }
  return true;
}

/** Mientras no suene un video de anuncio, suena el video de fondo a pantalla completa (anti-salvapantallas). */
function needsAmbient(c: Current | null): boolean {
  return !c || (c.type !== "reel" && c.type !== "showreel" && c.type !== "manual-video");
}

/** Tiempo máximo razonable de cada slide: si se supera, el watchdog del reproductor fuerza el avance. */
function maxMsFor(c: Current): number {
  if (c.type === "commercial") return COMMERCIAL_MS + 10_000;
  if (c.type === "endcard") return END_CARD_MS + 10_000;
  if (c.type === "manual-image") return c.durationSec * 1000 + 25_000;
  if (c.type === "showreel" && c.reel.maxSec) return c.reel.maxSec * 1000 + 25_000;
  return 16 * 60_000;
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { cache: "no-store", signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

interface Props {
  initial: Playlist | null;
  demo: boolean;
  preview: boolean;
  /** Solo para vista previa/pruebas: reproduce únicamente esa escena de curso o ese anuncio de marca. */
  forceScene?: PreviewTarget;
  /** Solo para vista previa: fija una de las 6 paletas para revisarla sin esperar al día que le toca. */
  forcePalette?: Palette;
}

export function TvPlayer({ initial, demo, preview, forceScene, forcePalette }: Props) {
  const queueRef = useRef<WeightedQueue<PlaylistReel, CommercialSource, PlaylistManual> | null>(null);
  if (!queueRef.current) queueRef.current = new WeightedQueue();

  const [current, setCurrent] = useState<Current | null>(null);
  const [palette, setPalette] = useState<Palette>(PALETTES[1]);
  const [empty, setEmpty] = useState(false);

  const currentRef = useRef<Current | null>(null);
  const keyRef = useRef(0);
  // Contadores separados: el de cursos rota escenas; el de cada anuncio de marca rota sus variantes (testimonios).
  const commercialCount = useRef(0);
  const spotCounts = useRef<Record<string, number>>({});
  const versionRef = useRef("");
  const playlistRef = useRef<Playlist | null>(null);
  const daypartRef = useRef<Daypart>(daypartAt(new Date()));
  const lastSyncRef = useRef(0);
  const lastAdvanceRef = useRef(Date.now());
  const bootRef = useRef(Date.now());
  const reloadOkAtRef = useRef(0);

  const show = useCallback((next: Current | null) => {
    currentRef.current = next;
    lastAdvanceRef.current = Date.now();
    setCurrent(next);
  }, []);

  const advance = useCallback(() => {
    // Recarga limpia cada 6 h: solo durante una transición y solo si el servidor respondió hace < 90 s
    // (recargar sin red dejaría la TV en una página de error).
    if (!preview && Date.now() - bootRef.current > RELOAD_MS && Date.now() - reloadOkAtRef.current < 90_000) {
      window.location.reload();
      return;
    }

    const today = forcePalette || paletteForSeed(dailySeed()); // la paleta cambia sola a medianoche
    const next = queueRef.current?.next() ?? null;
    if (!next) {
      setPalette(today);
      setEmpty(true);
      show(null);
      return;
    }
    setEmpty(false);
    const key = ++keyRef.current;

    if (next.type === "reel") {
      setPalette(today);
      const info = next.item.showreel;
      show(info ? { key, type: "showreel", reel: next.item, info } : { key, type: "reel", src: next.item.src });
    } else if (next.type === "manual") {
      setPalette(today);
      show(
        next.item.kind === "video"
          ? { key, type: "manual-video", src: next.item.src }
          : { key, type: "manual-image", src: next.item.src, durationSec: next.item.durationSec },
      );
    } else {
      const src = next.item;
      let index: number;
      if (src.kind === "brand") {
        index = spotCounts.current[src.spot] || 0;
        spotCounts.current[src.spot] = index + 1;
      } else {
        index = commercialCount.current++;
      }
      const planned = planCommercial(src, index, new Date(), isSceneId(forceScene) ? forceScene : undefined);
      const play = forcePalette ? { ...planned, palette: forcePalette } : planned;
      setPalette(play.palette);
      // Vista previa del cierre: se muestra directo el cierre del anuncio que tocaba.
      if (forceScene === "endcard") show({ key, type: "endcard", info: endCardFor({ key, type: "commercial", play }) });
      else show({ key, type: "commercial", play });
    }
  }, [preview, show, forceScene, forcePalette]);

  /**
   * Cada slide recibe un "terminé" atado a su key: avisos duplicados o tardíos no saltan otro anuncio.
   * Al terminar un anuncio aparece su cierre (QR + WhatsApp gigante); al terminar el cierre, el siguiente anuncio.
   */
  const onDone = useMemo(() => {
    const key = current?.key;
    return () => {
      const c = currentRef.current;
      if (key === undefined || !c || c.key !== key) return;
      if (wantsEndCard(c) && forceScene !== "endcard") show({ key: ++keyRef.current, type: "endcard", info: endCardFor(c) });
      else advance();
    };
  }, [current?.key, advance, show, forceScene]);

  const applyPlaylist = useCallback(
    (p: Playlist) => {
      versionRef.current = p.version;
      playlistRef.current = p;
      daypartRef.current = daypartAt(new Date());
      // Pesos por franja horaria: el público que más pasa frente al local a esta hora ve más sus programas.
      const sources = toSources(p, daypartRef.current);
      if (!forceScene) queueRef.current?.setSources(sources);
      else {
        const commercial = sources.commercial.filter((s) =>
          isSpotId(forceScene) ? s.kind === "brand" && s.spot === forceScene : s.kind === "course",
        );
        queueRef.current?.setSources({ reel: [], commercial, manual: [] });
      }
      // No interrumpe el anuncio en curso; solo arranca si la pantalla estaba vacía.
      if (!currentRef.current) advance();
    },
    [advance, forceScene],
  );

  const sync = useCallback(async (): Promise<boolean> => {
    lastSyncRef.current = Date.now();
    try {
      const res = await fetchWithTimeout(`/api/playlist${demo ? "?demo=1" : ""}`, 20_000);
      if (!res.ok) return false;
      const data = (await res.json()) as Playlist;
      if (data && data.version && data.version !== versionRef.current) applyPlaylist(data);
      return true;
    } catch {
      return false; // sin red: se sigue reproduciendo lo que ya hay
    }
  }, [demo, applyPlaylist]);

  // Arranque
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add(preview ? "tv-preview" : "tv-mode");
    if (preview) root.classList.add("tv-mode");
    if (initial) {
      lastSyncRef.current = Date.now();
      applyPlaylist(initial);
    } else {
      void sync();
    }
    return () => {
      root.classList.remove("tv-mode", "tv-preview");
    };
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincronización cada 15 min, watchdog y verificación previa a la recarga de 6 h.
  useEffect(() => {
    const tick = async () => {
      const now = Date.now();
      const due = currentRef.current ? SYNC_MS : IDLE_SYNC_MS;
      if (now - lastSyncRef.current >= due) {
        if (await sync()) reloadOkAtRef.current = Date.now();
      } else if (!preview && now - bootRef.current > RELOAD_MS) {
        try {
          const res = await fetchWithTimeout("/api/health", 8_000);
          if (res.ok) reloadOkAtRef.current = Date.now();
        } catch {
          /* sin red: no se recarga */
        }
      }
      const c = currentRef.current;
      if (c && now - lastAdvanceRef.current > maxMsFor(c)) advance();
      // Cambió la franja (p. ej. 12:00 → salida de escuelas): se recalculan los pesos sin cortar el anuncio.
      if (playlistRef.current && daypartAt(new Date()) !== daypartRef.current) applyPlaylist(playlistRef.current);
    };
    const interval = setInterval(() => void tick(), TICK_MS);
    const onOnline = () => void sync();
    window.addEventListener("online", onOnline);
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", onOnline);
    };
  }, [sync, advance, preview, applyPlaylist]);

  let slide: ReactNode = null;
  if (current) {
    if (current.type === "reel") slide = <VideoSlide src={current.src} fit="cover" onDone={onDone} />;
    else if (current.type === "showreel")
      slide = <ShowreelSlide reel={current.reel} info={current.info} palette={palette} onDone={onDone} />;
    else if (current.type === "manual-video") slide = <VideoSlide src={current.src} fit="auto" onDone={onDone} />;
    else if (current.type === "manual-image")
      slide = <ImageSlide src={current.src} durationSec={current.durationSec} onDone={onDone} />;
    else if (current.type === "endcard") slide = <EndCard info={current.info} palette={palette} onDone={onDone} />;
    else slide = <CommercialSlide play={current.play} onDone={onDone} />;
  }

  return (
    <div className="tv-stage" style={paletteCssVars(palette) as CSSProperties}>
      {/* Va antes del anuncio: libera el video de fondo antes de que el video del anuncio pida el decodificador. */}
      {preview ? null : <KeepAwake active={needsAmbient(current)} />}
      {current ? (
        <SlideBoundary key={current.key} onError={onDone}>
          {slide}
        </SlideBoundary>
      ) : null}

      {empty ? (
        <div className="slide idle">
          <BrandLogo className="idle-logo" />
          <div className="idle-sub">
            {preview ? "Aún no hay contenido: envía datos desde Make.com o activa programas en /admin." : BRAND.tagline}
          </div>
          <span className="idle-dot" />
        </div>
      ) : null}
    </div>
  );
}
