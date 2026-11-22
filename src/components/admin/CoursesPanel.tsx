"use client";

import { useState, type ChangeEvent } from "react";
import type { AdminState } from "@/lib/admin-state";
import type { FallbackCourseSource } from "@/lib/types";
import { CatalogCard } from "./CatalogCard";
import { api, Button, Card, Field, Notice } from "./ui";

interface Draft {
  url: string;
  title: string;
  price: string;
  image_url: string;
}

const EMPTY: Draft = { url: "", title: "", price: "", image_url: "" };

function toDraft(s: FallbackCourseSource): Draft {
  return { url: s.url, title: s.title || "", price: s.price || "", image_url: s.image_url || "" };
}

function SourceForm({ initial, submitLabel, onSubmit, onCancel }: {
  initial: Draft;
  submitLabel: string;
  onSubmit: (d: Draft) => Promise<void>;
  onCancel?: () => void;
}) {
  const [d, setD] = useState<Draft>(initial);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Draft) => (e: ChangeEvent<HTMLInputElement>) => setD({ ...d, [k]: e.target.value });

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onSubmit(d);
          if (!onCancel) setD(EMPTY);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Field label="URL del curso" type="url" inputMode="url" required placeholder="https://…" value={d.url} onChange={set("url")} />
      <Field label="Título (opcional)" value={d.title} onChange={set("title")} hint="Si lo dejas vacío se toma de la página (og:title)." />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Precio (opcional)" placeholder="$899 MXN" value={d.price} onChange={set("price")} />
        <Field label="Imagen (opcional)" type="url" inputMode="url" placeholder="https://…" value={d.image_url} onChange={set("image_url")} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={busy || !d.url}>
          {busy ? "Guardando…" : submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export function CoursesPanel({ state, refresh }: { state: AdminState; refresh: () => Promise<void> }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [rss, setRss] = useState(state.settings.newsRssUrl);
  const [rssSaved, setRssSaved] = useState(false);

  const run = async (fn: () => Promise<unknown>) => {
    setError("");
    try {
      await fn();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      throw err;
    }
  };

  const lastByUrl = new Map((state.status.lastReport?.courses || []).map((c) => [c.url, c]));

  return (
    <div className="space-y-4">
      <CatalogCard disabled={state.settings.catalogDisabled || []} refresh={refresh} />

      <Card title="Agregar URL extra de respaldo">
        <p className="mb-3 text-sm text-stone-600">
          Para cursos o promociones que no están en el catálogo. Se usan cuando Make.com lleva más de {state.status.staleHours} h
          sin enviar datos (o al forzar la sincronización): el servidor lee título, imagen y precio de la página y redacta el
          gancho con el banco local de fórmulas.
        </p>
        <SourceForm
          initial={EMPTY}
          submitLabel="Agregar"
          onSubmit={(d) => run(() => api("/api/admin/sources", { method: "POST", body: JSON.stringify(d) })).catch(() => undefined)}
        />
      </Card>

      {error ? <Notice tone="error">{error}</Notice> : null}

      <Card title={`URLs extra de respaldo (${state.sources.length})`}>
        {state.sources.length === 0 ? (
          <p className="text-sm text-stone-500">Sin URLs todavía.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {state.sources.map((s) => {
              const last = lastByUrl.get(s.url);
              return (
                <li key={s.id} className="py-3">
                  {editing === s.id ? (
                    <SourceForm
                      initial={toDraft(s)}
                      submitLabel="Guardar"
                      onCancel={() => setEditing(null)}
                      onSubmit={(d) =>
                        run(() => api(`/api/admin/sources/${s.id}`, { method: "PATCH", body: JSON.stringify(d) }))
                          .then(() => setEditing(null))
                          .catch(() => undefined)
                      }
                    />
                  ) : (
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-stone-900">{s.title || last?.title || s.url}</p>
                        <p className="truncate text-xs text-stone-500">{s.url}</p>
                        {last ? (
                          <p className={`mt-1 text-xs ${last.ok ? "text-emerald-700" : "text-red-700"}`}>
                            {last.ok ? "✓ Leído en la última sincronización" : `✕ ${last.error || "Error"}`}
                          </p>
                        ) : null}
                      </div>
                      <Button variant="secondary" className="px-3" onClick={() => setEditing(s.id)}>
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        className="px-3"
                        aria-label="Eliminar"
                        onClick={() => {
                          if (window.confirm("¿Eliminar esta URL?")) {
                            void run(() => api(`/api/admin/sources/${s.id}`, { method: "DELETE" })).catch(() => undefined);
                          }
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title="Feed de noticias (RSS)">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setRssSaved(false);
            void run(() => api("/api/admin/settings", { method: "PUT", body: JSON.stringify({ newsRssUrl: rss }) }))
              .then(() => setRssSaved(true))
              .catch(() => undefined);
          }}
        >
          <Field
            label="URL del feed"
            type="url"
            inputMode="url"
            value={rss}
            onChange={(e) => setRss(e.target.value)}
            hint="Por defecto: Google Noticias · Tecnología (México). Los titulares sensibles (violencia, tragedias) se descartan."
          />
          <Button type="submit" variant="secondary" className="w-full">
            Guardar feed
          </Button>
          {rssSaved ? <Notice tone="ok">Feed guardado.</Notice> : null}
        </form>
      </Card>
    </div>
  );
}
