"use client";

import { useCallback, useState } from "react";
import type { AdminState } from "@/lib/admin-state";
import { AdsPanel } from "./AdsPanel";
import { CoursesPanel } from "./CoursesPanel";
import { PreviewPanel } from "./PreviewPanel";
import { SyncPanel } from "./SyncPanel";
import { api, Button, Notice } from "./ui";

type Tab = "ads" | "courses" | "sync" | "preview";
const TABS: { id: Tab; label: string }[] = [
  { id: "ads", label: "Anuncios" },
  { id: "courses", label: "Cursos" },
  { id: "sync", label: "Sincronizar" },
  { id: "preview", label: "Vista previa" },
];

export function AdminApp({ initial }: { initial: AdminState }) {
  const [state, setState] = useState(initial);
  const [tab, setTab] = useState<Tab>("ads");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setState(await api<AdminState>("/api/admin/state"));
      setError("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error";
      if (message === "No autorizado") window.location.reload();
      else setError(message);
    }
  }, []);

  const logout = async () => {
    await api("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] pb-10">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-[#FAF7F0]/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 pt-3">
          <h1 className="font-display text-2xl uppercase text-[#0033FF]">Pantalla Local</h1>
          <Button variant="ghost" onClick={logout}>
            Salir
          </Button>
        </div>
        <nav className="mx-auto flex max-w-xl gap-1 overflow-x-auto px-2 pb-2 pt-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`min-h-10 whitespace-nowrap rounded-full px-4 text-sm font-semibold ${
                tab === t.id ? "bg-stone-900 text-white" : "text-stone-700 active:bg-stone-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-xl space-y-4 px-4 pt-4">
        {error ? <Notice tone="error">{error}</Notice> : null}
        {tab === "ads" ? <AdsPanel state={state} refresh={refresh} /> : null}
        {tab === "courses" ? <CoursesPanel state={state} refresh={refresh} /> : null}
        {tab === "sync" ? <SyncPanel state={state} refresh={refresh} /> : null}
        {tab === "preview" ? <PreviewPanel /> : null}
      </main>
    </div>
  );
}
