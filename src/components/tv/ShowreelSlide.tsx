"use client";

import { BrandLogo } from "../BrandLogo";
import type { Palette } from "@/lib/palettes";
import type { PlaylistReel } from "@/lib/types";
import { ManagedVideo } from "./ManagedVideo";
import { QrBadge } from "./QrCode";

type Showreel = NonNullable<PlaylistReel["showreel"]>;

/**
 * Showreel oficial de un programa (videos de ultravelozmente.com). Se usa cuando Instagram aporta pocos reels.
 * Horizontal: video a pantalla completa con cintillo de marca. Vertical: video 16:9 al centro con título y QR.
 */
export function ShowreelSlide({
  reel,
  info,
  palette,
  onDone,
}: {
  reel: PlaylistReel;
  info: Showreel;
  palette: Palette;
  onDone: () => void;
}) {
  return (
    <div className="slide sr">
      <div className="sr-video">
        <ManagedVideo src={reel.src} fit="cover" maxMs={reel.maxSec ? reel.maxSec * 1000 : undefined} onDone={onDone} />
      </div>
      <div className="sr-head">
        <BrandLogo className="sr-logo" />
      </div>
      <div className="sr-panel">
        <div className="sr-title display">{info.title}</div>
        <div className="sr-meta">
          <span className="sr-benefit">{info.benefit}</span>
          <span className="sr-dot" />
          {info.ages}
        </div>
      </div>
      <QrBadge url={info.course_url} dark={palette.qrDark} className="qr-br" />
    </div>
  );
}
