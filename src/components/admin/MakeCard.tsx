"use client";

import { useEffect, useState } from "react";
import { makeMaiaPrompt, PRODUCTION_ORIGIN } from "@/lib/make-prompt";
import { Button, Card, Notice } from "./ui";

function Copyable({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="text-sm text-stone-600">{label}</p>
      <div className="mt-1 flex items-start gap-2">
        <code className="block flex-1 break-all rounded-lg bg-stone-100 p-2 text-xs">{value}</code>
        <Button
          variant="secondary"
          className="px-3"
          onClick={async () => {
            await navigator.clipboard?.writeText(value).catch(() => undefined);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
    </div>
  );
}

export function MakeCard({ syncSecretConfigured, lastMakeAt }: { syncSecretConfigured: boolean; lastMakeAt: string | null }) {
  const [origin, setOrigin] = useState(PRODUCTION_ORIGIN);
  const [copied, setCopied] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);
  const prompt = makeMaiaPrompt(origin);

  return (
    <Card title="Conexión con Make.com">
      <div className="space-y-3">
        {syncSecretConfigured ? (
          <Notice tone="ok">SYNC_SECRET está configurado en el servidor. Make.com debe enviar ese mismo valor.</Notice>
        ) : (
          <Notice tone="error">
            Falta SYNC_SECRET en el servidor: el webhook responde 500. En Vercel → Settings → Environment Variables agrega
            SYNC_SECRET y vuelve a desplegar.
          </Notice>
        )}
        {lastMakeAt ? null : <Notice tone="info">Make.com todavía no ha enviado datos. Mientras tanto se muestra el catálogo oficial.</Notice>}
        <Copyable label="Webhook (POST, JSON)" value={`${origin}/api/webhook/make`} />
        <Copyable label="Header" value="Authorization: Bearer <SYNC_SECRET>" />
        <Copyable label="Catálogo para Make (GET)" value={`${origin}/api/catalog`} />
        <div>
          <p className="text-sm text-stone-600">Prompt para Maia (Plan Mode)</p>
          <textarea readOnly value={prompt} rows={8} className="mt-1 block w-full rounded-lg bg-stone-100 p-2 font-mono text-[11px] leading-snug" />
          <Button
            className="mt-2 w-full"
            variant="secondary"
            onClick={async () => {
              await navigator.clipboard?.writeText(prompt).catch(() => undefined);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Prompt copiado" : "Copiar prompt para Maia"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
