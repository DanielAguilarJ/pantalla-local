"use client";

import { useState } from "react";
import type { AdminState, ContentSummary } from "@/lib/admin-state";
import type { SyncReport } from "@/lib/types";
import { DAYPART_LABEL, daypartAt } from "@/lib/sede-time";
import { MakeCard } from "./MakeCard";
import { api, Button, Card, Notice, timeAgo } from "./ui";

function Summary({ label, data, active }: { label: string; data: ContentSummary | null; active: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${active ? "border-[#2B36E8] bg-blue-50" : "border-stone-200"}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-stone-900">{label}</p>
        {active ? <span className="rounded-full bg-[#2B36E8] px-2 py-0.5 text-xs font-semibold text-white">En pantalla</span> : null}
      </div>
      {data ? (
        <>
          <p className="mt-1 text-sm text-stone-700">Recibido {timeAgo(data.receivedAt)}</p>
          <p className="text-xs text-stone-500">
            {data.counts.videos} reels · {data.counts.courses} cursos · {data.counts.news} noticias
          </p>
        </>
      ) : (
        <p className="mt-1 text-sm text-stone-500">Sin datos todavía</p>
      )}
    </div>
  );
}

function ReportView({ report }: { report: SyncReport }) {
  return (
    <div className="space-y-2 text-sm">
      <Notice tone={report.saved ? "ok" : report.ran ? "warn" : "info"}>{report.reason}</Notice>
      <p className="text-stone-700">
        Noticias: {report.news.ok ? `${report.news.count} titulares` : `error (${report.news.error || "sin datos"})`}
      </p>
      {report.courses.length ? (
        <ul className="space-y-1">
          {report.courses.map((c) => (
            <li key={c.url} className={c.ok ? "text-emerald-700" : "text-red-700"}>
              {c.ok ? "✓" : "✕"} {c.title || c.url}
              {c.error ? <span className="block text-xs text-stone-500">{c.error}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
      {report.saved ? (
        <p className="text-stone-700">
          Guardado: {report.saved.courses} cursos · {report.saved.news} noticias · {report.saved.videos} reels
        </p>
      ) : null}
      <p className="text-xs text-stone-500">{new Date(report.at).toLocaleString("es-MX")} · {report.trigger}</p>
    </div>
  );
}

export function SyncPanel({ state, refresh }: { state: AdminState; refresh: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { status } = state;

  const force = async () => {
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/sync", { method: "POST" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card title="Estado del contenido">
        <div className="space-y-2">
          <Summary label="Make.com" data={status.make} active={status.active === "make"} />
          <Summary label="Motor de respaldo (sin IA)" data={status.fallback} active={status.active === "fallback"} />
          {status.active === null ? (
            <Notice tone="info">En pantalla: catálogo oficial de WorldBrain con copys automáticos y showreels del sitio.</Notice>
          ) : null}
        </div>
        <p className="mt-3 text-sm text-stone-700">
          Franja horaria ahora: <b>{DAYPART_LABEL[daypartAt(new Date())]}</b>. Los programas de ese público salen más seguido.
        </p>
        <p className="mt-2 text-xs text-stone-500">
          Si Make.com pasa más de {status.staleHours} h sin enviar datos, el cron diario y las propias pantallas activan el respaldo
          automáticamente. Las pantallas sincronizan cada 15 minutos sin cortar el anuncio en curso.
        </p>
      </Card>

      <Card title="Forzar sincronización">
        <p className="mb-3 text-sm text-stone-600">
          Lee ahora tus URLs de respaldo y las noticias del día y genera los comerciales. Si Make.com envía datos después, esos
          vuelven a tener prioridad.
        </p>
        <Button className="w-full" onClick={force} disabled={busy}>
          {busy ? "Sincronizando… (puede tardar hasta 1 min)" : "Forzar sincronización ahora"}
        </Button>
        {error ? <div className="mt-3"><Notice tone="error">{error}</Notice></div> : null}
        {status.lastReport ? (
          <div className="mt-4 border-t border-stone-100 pt-3">
            <p className="mb-2 text-sm font-semibold text-stone-900">Último resultado</p>
            <ReportView report={status.lastReport} />
          </div>
        ) : null}
      </Card>

      <MakeCard syncSecretConfigured={status.syncSecretConfigured} lastMakeAt={status.make?.receivedAt || null} />

      <Card title="Sistema">
        <ul className="space-y-1 text-sm text-stone-700">
          <li>Almacenamiento: {status.storage === "redis" ? "Upstash Redis ✓" : "Archivo local /tmp (solo desarrollo)"}</li>
          <li>Subidas: {status.blob ? "Vercel Blob ✓" : status.onVercel ? "Sin Blob Store (no se puede subir)" : "Carpeta local /tmp (desarrollo)"}</li>
        </ul>
        {status.onVercel && status.storage === "file" ? (
          <div className="mt-3">
            <Notice tone="error">
              Estás en Vercel sin Upstash Redis: los datos se guardan en /tmp y se pierden entre instancias. Conecta Upstash Redis
              (Marketplace de Vercel) y vuelve a desplegar.
            </Notice>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
