// Cortes de renglón para tipografía de cartel (FitLines). Sin dependencias: corre en la TV.

/**
 * Corta un texto en renglones de hasta `maxChars` caracteres (palabras completas).
 * " · " fuerza un corte: "FastKids · Inglés" → ["FastKids", "Inglés"].
 */
export function breakLines(text: string, maxChars: number): string[] {
  const out: string[] = [];
  for (const part of text.split(/\s+·\s+/)) {
    let line = "";
    for (const w of part.trim().split(/\s+/).filter(Boolean)) {
      if (!line) line = w;
      else if (`${line} ${w}`.length <= maxChars) line = `${line} ${w}`;
      else {
        out.push(line);
        line = w;
      }
    }
    if (line) out.push(line);
  }
  // Evita un último renglón de una sola letra ("y", "a"): se une al anterior.
  if (out.length > 1 && out[out.length - 1].length <= 2) {
    const last = out.pop() as string;
    out[out.length - 1] = `${out[out.length - 1]} ${last}`;
  }
  return out.length ? out : [text];
}

/** "6–12 años" → ["6–12", "años"] · "15+ años" → ["15+", "años"] · "Niños y jóvenes" → ["Niños y", "jóvenes"]. */
export function ageLines(ages: string, maxChars = 9): string[] {
  const a = ages.trim();
  if (!a) return ["Para", "ti"];
  const m = /^(\d+\s*[–-]\s*\d+|\d+\s*\+?)\s*(años)?$/i.exec(a);
  if (m) return [m[1].replace(/\s+/g, ""), "años"];
  return breakLines(a, maxChars);
}

/** Máximo de caracteres por renglón según orientación: renglones cortos = letra más grande. */
export function lineChars(portrait: boolean, kind: "hero" | "name" = "hero"): number {
  if (kind === "name") return portrait ? 12 : 16;
  return portrait ? 11 : 15;
}
