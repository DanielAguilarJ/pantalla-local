"use client";

import { useState, type FormEvent } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { api, Button, Field, Notice } from "./ui";

export function LoginForm({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) });
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F6F4EE] p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-4xl text-[#161512]">
            <BrandLogo />
          </h1>
          <p className="mt-1 text-sm text-stone-600">Pantalla del local · Panel de administración</p>
        </div>
        {!configured ? (
          <Notice tone="error">Falta la variable de entorno ADMIN_PASSWORD en el servidor.</Notice>
        ) : null}
        <Field
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
        />
        {error ? <Notice tone="error">{error}</Notice> : null}
        <Button type="submit" className="w-full" disabled={busy || !configured || !password}>
          {busy ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </main>
  );
}
