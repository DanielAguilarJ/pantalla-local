"use client";

import { upload } from "@vercel/blob/client";
import { useRef, useState } from "react";
import type { AdminState } from "@/lib/admin-state";
import type { ManualAd } from "@/lib/types";
import { api, Button, Card, Field, Notice, Toggle } from "./ui";

const TYPES: Record<string, { ext: string; kind: "image" | "video"; maxMb: number }> = {
  "image/jpeg": { ext: "jpg", kind: "image", maxMb: 15 },
  "image/png": { ext: "png", kind: "image", maxMb: 15 },
  "image/webp": { ext: "webp", kind: "image", maxMb: 15 },
  "video/mp4": { ext: "mp4", kind: "video", maxMb: 250 },
};

function randomName(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Subida local (sin Vercel Blob) con barra de progreso real vía XHR. */
function uploadLocal(file: File, onProgress: (pct: number) => void): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload-local");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress((e.loaded / e.total) * 100);
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new Error(data.error || `Error ${xhr.status}`));
      } catch {
        reject(new Error(`Error ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Error de red"));
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

export function AdsPanel({ state, refresh }: { state: AdminState; refresh: () => Promise<void> }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(10);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const info = file ? TYPES[file.type] : undefined;
  const canUploadHere = state.status.blob || !state.status.onVercel;

  const submit = async () => {
    if (!file) return;
    setError("");
    setOk("");
    if (!info) return setError("Formato no permitido. Usa JPG, PNG, WebP o MP4 (H.264).");
    if (file.size > info.maxMb * 1024 * 1024) return setError(`El archivo supera ${info.maxMb} MB.`);

    setProgress(0);
    try {
      let url: string;
      let storage: "blob" | "local";
      if (state.status.blob) {
        const blob = await upload(`signage/${randomName()}.${info.ext}`, file, {
          access: "public",
          handleUploadUrl: "/api/admin/upload",
          contentType: file.type,
          multipart: file.size > 20 * 1024 * 1024,
          onUploadProgress: (p) => setProgress(p.percentage),
        });
        url = blob.url;
        storage = "blob";
      } else {
        url = (await uploadLocal(file, setProgress)).url;
        storage = "local";
      }
      await api("/api/admin/ads", {
        method: "POST",
        body: JSON.stringify({ kind: info.kind, url, storage, title: title.trim(), durationSec: duration }),
      });
      setOk("Anuncio publicado. Las pantallas lo tomarán en su próxima sincronización (≤ 15 min).");
      setFile(null);
      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir");
    } finally {
      setProgress(null);
    }
  };

  const patch = async (ad: ManualAd, body: Partial<Pick<ManualAd, "active" | "durationSec" | "title">>) => {
    setError("");
    try {
      await api(`/api/admin/ads/${ad.id}`, { method: "PATCH", body: JSON.stringify(body) });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  const remove = async (ad: ManualAd) => {
    if (!window.confirm(`¿Eliminar "${ad.title || "este anuncio"}"? También se borra el archivo.`)) return;
    try {
      await api(`/api/admin/ads/${ad.id}`, { method: "DELETE" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  return (
    <div className="space-y-4">
      <Card title="Subir anuncio">
        {!canUploadHere ? (
          <Notice tone="warn">
            Para subir archivos en Vercel conecta un Blob Store <b>público</b> al proyecto (crea BLOB_READ_WRITE_TOKEN) y vuelve a desplegar.
          </Notice>
        ) : (
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-700">Imagen o video</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-stone-100 file:px-4 file:font-semibold"
              />
              <span className="mt-1 block text-xs text-stone-500">
                JPG, PNG o WebP (máx. 15 MB) · MP4 H.264 (máx. 250 MB). Si tu iPhone graba en .MOV, conviértelo a MP4.
              </span>
            </label>
            <Field label="Nombre (opcional)" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
            {info?.kind !== "video" ? (
              <Field
                label="Duración en pantalla (segundos)"
                type="number"
                inputMode="numeric"
                min={3}
                max={300}
                value={duration}
                onChange={(e) => setDuration(Math.max(3, Math.min(300, Number(e.target.value) || 10)))}
                hint="Solo imágenes. Los videos se reproducen completos."
              />
            ) : null}
            {progress !== null ? (
              <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
                <div className="h-full bg-[#2B36E8] transition-all" style={{ width: `${Math.round(progress)}%` }} />
              </div>
            ) : null}
            {error ? <Notice tone="error">{error}</Notice> : null}
            {ok ? <Notice tone="ok">{ok}</Notice> : null}
            <Button className="w-full" disabled={!file || progress !== null} onClick={submit}>
              {progress !== null ? `Subiendo… ${Math.round(progress)}%` : "Subir y publicar"}
            </Button>
          </div>
        )}
      </Card>

      <Card title={`Anuncios manuales (${state.ads.length})`}>
        {state.ads.length === 0 ? (
          <p className="text-sm text-stone-500">Todavía no hay anuncios. Ocupan ~25% de la rotación cuando existen.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {state.ads.map((ad) => (
              <li key={ad.id} className="flex items-center gap-3 py-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                  {ad.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ad.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <video src={ad.url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-stone-900">{ad.title || (ad.kind === "video" ? "Video" : "Imagen")}</p>
                  <p className="text-xs text-stone-500">
                    {ad.kind === "video" ? "Video · completo" : (
                      <>
                        Imagen ·{" "}
                        <input
                          aria-label="Duración en segundos"
                          type="number"
                          inputMode="numeric"
                          min={3}
                          max={300}
                          defaultValue={ad.durationSec}
                          onBlur={(e) => {
                            const v = Math.max(3, Math.min(300, Number(e.target.value) || ad.durationSec));
                            if (v !== ad.durationSec) void patch(ad, { durationSec: v });
                          }}
                          className="w-14 rounded border border-stone-300 px-1 py-0.5 text-xs"
                        />{" "}
                        s
                      </>
                    )}
                  </p>
                </div>
                <Toggle checked={ad.active} onChange={(v) => patch(ad, { active: v })} label="Activo" />
                <Button variant="danger" className="px-3" onClick={() => remove(ad)} aria-label="Eliminar">
                  ✕
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
