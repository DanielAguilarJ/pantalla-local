import type { Metadata } from "next";
import { isSceneId, isSpotId } from "@/components/tv/engine";
import { TvPlayer } from "@/components/tv/TvPlayer";
import { paletteById } from "@/lib/palettes";
import { buildPlaylist, demoPlaylist } from "@/lib/playlist";
import type { Playlist } from "@/lib/types";
import "./tv.css";
import "./tv-spots.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Pantalla · WorldBrain México", referrer: "no-referrer" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * /tv            -> reproductor de la pantalla LG
 * /tv?demo=1     -> contenido de demostración (para probar el motor sin Make.com)
 * /tv?preview=1  -> vista previa dentro de /admin (sin wake lock ni recargas)
 * /tv?preview=1&scene=mockup|kinetic|ticker|split|flash|cover|index -> solo esa escena de curso
 * /tv?preview=1&scene=testimonial|method|numbers|ritual|stages      -> solo ese anuncio de marca
 * /tv?preview=1&palette=acido|worldbrain|coral|menta|senal|chicle   -> fija una paleta (solo vista previa)
 */
export default async function TvPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const demo = sp.demo === "1";
  const preview = sp.preview === "1";

  // La playlist viaja dentro del HTML: la TV arranca a reproducir sin esperar otra petición.
  let initial: Playlist | null = null;
  try {
    initial = demo ? demoPlaylist() : (await buildPlaylist()).playlist;
  } catch (err) {
    console.error("[tv] No se pudo construir la playlist inicial:", err);
  }

  // forceScene solo en vista previa: la pantalla real nunca queda fija en una escena por un parámetro olvidado.
  const forceScene = preview && (isSceneId(sp.scene) || isSpotId(sp.scene)) ? sp.scene : undefined;

  const forcePalette = preview && typeof sp.palette === "string" ? paletteById(sp.palette) : undefined;

  return <TvPlayer initial={initial} demo={demo} preview={preview} forceScene={forceScene} forcePalette={forcePalette} />;
}
