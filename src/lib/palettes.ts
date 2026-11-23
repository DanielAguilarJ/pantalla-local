import { dayNumber } from "./seed";

/**
 * Paletas anti-reflejo para escaparate.
 * Regla: `bg` y `pop` (los únicos colores que pueden ocupar pantalla completa) nunca son
 * casi negros, para que el vidrio no se convierta en espejo. `ink` (texto/trazos) sí puede ser oscuro.
 */
export interface Palette {
  id: string;
  name: string;
  bg: string;
  ink: string;
  pop: string;
  popInk: string;
  accent: string;
  accentInk: string;
  /** Color de los módulos del QR (siempre oscuro sobre blanco para que cualquier celular lo lea). */
  qrDark: string;
}

export const PALETTES: readonly Palette[] = [
  { id: "acido", name: "Amarillo Ácido + Negro Carbón", bg: "#E8FF00", ink: "#111111", pop: "#FFFFFF", popInk: "#111111", accent: "#FF2D87", accentInk: "#111111", qrDark: "#111111" },
  // Paleta de marca WorldBrain (porcelana, azul Klein y naranja señal de ultravelozmente.com).
  { id: "worldbrain", name: "Porcelana + Azul Klein (marca)", bg: "#F6F4EE", ink: "#2B36E8", pop: "#2B36E8", popInk: "#F6F4EE", accent: "#E8542B", accentInk: "#F6F4EE", qrDark: "#1F28B8" },
  { id: "coral", name: "Coral Intenso + Blanco Puro", bg: "#FF4D2D", ink: "#FFFFFF", pop: "#FFFFFF", popInk: "#E0391B", accent: "#FFE14D", accentInk: "#1A1A1A", qrDark: "#1A1A1A" },
  { id: "menta", name: "Verde Menta + Negro", bg: "#B8F2E6", ink: "#0D0D0D", pop: "#FFFFFF", popInk: "#0D0D0D", accent: "#FF4F79", accentInk: "#0D0D0D", qrDark: "#0D0D0D" },
  { id: "senal", name: "Naranja Señal + Azul Tinta", bg: "#FF9F1C", ink: "#14213D", pop: "#FFFFFF", popInk: "#14213D", accent: "#2EC4B6", accentInk: "#14213D", qrDark: "#14213D" },
  { id: "chicle", name: "Rosa Chicle + Violeta Tinta", bg: "#FFB8E1", ink: "#230046", pop: "#FFF35C", popInk: "#230046", accent: "#3A86FF", accentInk: "#FFFFFF", qrDark: "#230046" },
];

/** Rotación estricta: cambia cada día y recorre las 6 paletas antes de repetir. */
export function paletteForSeed(seed: string): Palette {
  const n = dayNumber(seed);
  return PALETTES[((n % PALETTES.length) + PALETTES.length) % PALETTES.length];
}

export function paletteById(id: string | null | undefined): Palette | undefined {
  return PALETTES.find((p) => p.id === id);
}

export function paletteCssVars(p: Palette): Record<string, string> {
  return {
    "--bg": p.bg,
    "--ink": p.ink,
    "--pop": p.pop,
    "--pop-ink": p.popInk,
    "--accent": p.accent,
    "--accent-ink": p.accentInk,
    "--qr-dark": p.qrDark,
  };
}
