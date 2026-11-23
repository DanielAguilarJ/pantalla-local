"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card } from "./ui";

type Mode = "portrait" | "landscape";

/** Diseños que se pueden ver por separado (?scene=…). "" = la rotación real de la pantalla. */
const DESIGNS: { id: string; label: string }[] = [
  { id: "", label: "Rotación real (todo)" },
  { id: "cover", label: "Curso · Portada editorial" },
  { id: "index", label: "Curso · Índice de programas" },
  { id: "mockup", label: "Curso · Celular / laptop 3D" },
  { id: "kinetic", label: "Curso · Tipografía cinética" },
  { id: "ticker", label: "Curso · Noticias + gancho" },
  { id: "split", label: "Curso · Pantalla dividida" },
  { id: "flash", label: "Curso · Oferta flash" },
  { id: "testimonial", label: "Marca · Testimonios" },
  { id: "method", label: "Marca · El método" },
  { id: "numbers", label: "Marca · En números" },
  { id: "ritual", label: "Marca · Los 5 Minutos" },
  { id: "stages", label: "Marca · Programas por etapa" },
];

// Tamaño "virtual" de la pantalla dentro del iframe. El layout usa vw/vh/vmin, así que se ve igual que en la TV.
const VIRTUAL: Record<Mode, { w: number; h: number }> = {
  portrait: { w: 540, h: 960 },
  landscape: { w: 960, h: 540 },
};

export function PreviewPanel() {
  const [mode, setMode] = useState<Mode>("portrait");
  const [demo, setDemo] = useState(false);
  const [design, setDesign] = useState("");
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
  const src = `/tv?preview=1${demo ? "&demo=1" : ""}${design ? `&scene=${design}` : ""}`;

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
      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-medium text-stone-700">Diseño</span>
        <select
          value={design}
          onChange={(e) => setDesign(e.target.value)}
          className="block min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-base text-stone-900"
        >
          {DESIGNS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </label>
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
            key={`${mode}-${demo}-${design}-${reloadKey}`}
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
