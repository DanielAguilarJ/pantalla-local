"use client";

import { useState } from "react";
import { CATALOG } from "@/lib/catalog";
import { tvMediaUrl } from "@/lib/media-proxy";
import { api, Card, Notice, Toggle } from "./ui";

const AUDIENCE_LABEL: Record<string, string> = { ninos: "Niños", jovenes: "Jóvenes", adultos: "Adultos" };

/** Programas oficiales de WorldBrain: el admin decide cuáles salen en la pantalla. */
export function CatalogCard({ disabled, refresh }: { disabled: string[]; refresh: () => Promise<void> }) {
  const [off, setOff] = useState<string[]>(disabled);
  const [error, setError] = useState("");
  const active = CATALOG.length - off.length;

  const toggle = async (id: string, on: boolean) => {
    const next = on ? off.filter((x) => x !== id) : off.concat(id);
    setOff(next);
    setError("");
    try {
      await api("/api/admin/settings", { method: "PUT", body: JSON.stringify({ catalogDisabled: next }) });
      await refresh();
    } catch (err) {
      setOff(off);
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  return (
    <Card title={`Programas WorldBrain (${active}/${CATALOG.length} en pantalla)`}>
      <p className="mb-3 text-sm text-stone-600">
        Datos oficiales de ultravelozmente.com. Se usan siempre que Make.com no envíe cursos, y los programas con video
        muestran su showreel cuando hay pocos reels de Instagram. Apaga los que no quieras promocionar.
      </p>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <ul className="divide-y divide-stone-100">
        {CATALOG.map((p) => {
          const on = !off.includes(p.id);
          return (
            <li key={p.id} className="flex items-center gap-3 py-2.5">
              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={tvMediaUrl(p.image_url)} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="min-w-0 flex-1">
                <a href={p.course_url} target="_blank" rel="noreferrer" className="block truncate text-sm font-semibold text-stone-900 underline-offset-2 hover:underline">
                  {p.title}
                </a>
                <p className="truncate text-xs text-stone-500">
                  {[p.ages, ...p.audience.map((a) => AUDIENCE_LABEL[a]).filter((l) => l.toLowerCase() !== p.ages.toLowerCase())].join(" · ")}
                  {p.showreel_url ? " · con video" : ""}
                </p>
              </div>
              <Toggle checked={on} onChange={(v) => toggle(p.id, v)} label={`Mostrar ${p.title}`} />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
