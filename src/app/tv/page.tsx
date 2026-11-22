import type { Metadata } from "next";
import { isSceneId } from "@/components/tv/engine";
import { TvPlayer } from "@/components/tv/TvPlayer";
import { buildPlaylist, demoPlaylist } from "@/lib/playlist";
import type { Playlist } from "@/lib/types";
import "./tv.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Pantalla" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * /tv            -> reproductor de la pantalla LG
 * /tv?demo=1     -> contenido de demostración (para probar el motor sin Make.com)
 * /tv?preview=1  -> vista previa dentro de /admin (sin wake lock ni recargas)
 * /tv?preview=1&scene=mockup|kinetic|ticker|split|flash -> solo comerciales con esa escena (para revisar diseño)
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
  const forceScene = preview && isSceneId(sp.scene) ? sp.scene : undefined;

  return <TvPlayer initial={initial} demo={demo} preview={preview} forceScene={forceScene} />;
}
