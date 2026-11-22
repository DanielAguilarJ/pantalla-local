"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card } from "./ui";

type Mode = "portrait" | "landscape";

// Tamaño "virtual" de la pantalla dentro del iframe. El layout usa vw/vh/vmin, así que se ve igual que en la TV.
const VIRTUAL: Record<Mode, { w: number; h: number }> = {
  portrait: { w: 540, h: 960 },
  landscape: { w: 960, h: 540 },
};

export function PreviewPanel() {
  const [mode, setMode] = useState<Mode>("portrait");
  const [demo, setDemo] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const v = VIRTUAL[mode];
  const maxW = mode === "portrait" ? Math.min(width, 360) : width;
  const scale = maxW / v.w;
  const src = `/tv?preview=1${demo ? "&demo=1" : ""}`;

  return (
    <Card title="Vista previa en vivo">
      <div className="mb-3 grid grid-cols-2 gap-2">
        <Button variant={mode === "portrait" ? "primary" : "secondary"} onClick={() => setMode("portrait")}>
          Vertical 9:16
        </Button>
        <Button variant={mode === "landscape" ? "primary" : "secondary"} onClick={() => setMode("landscape")}>
          Horizontal 16:9
        </Button>
      </div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} className="h-5 w-5" />
          Usar contenido demo
        </label>
        <Button variant="ghost" onClick={() => setReloadKey((k) => k + 1)}>
          Recargar
        </Button>
      </div>

      <div ref={boxRef} className="w-full">
        <div
          className="mx-auto overflow-hidden rounded-xl bg-stone-900 shadow-inner"
          style={{ width: v.w * scale, height: v.h * scale }}
        >
          <iframe
            key={`${mode}-${demo}-${reloadKey}`}
            src={src}
            title="Vista previa de la pantalla"
            width={v.w}
            height={v.h}
            style={{ width: v.w, height: v.h, border: 0, transform: `scale(${scale})`, transformOrigin: "0 0" }}
            allow="autoplay"
          />
        </div>
      </div>
      <p className="mt-2 text-xs text-stone-500">
        Es el mismo reproductor de /tv. Al girar la pantalla LG el layout cambia igual que aquí, sin recargar.
      </p>
    </Card>
  );
}
