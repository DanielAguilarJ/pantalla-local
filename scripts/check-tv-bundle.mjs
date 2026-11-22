// Verifica (tras `next build`) que el JS y el CSS que carga /tv son compatibles con LG webOS 6+ (Chromium 79, ES2019).
// El panel /admin se usa desde celulares modernos y no se revisa.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(".next/app-build-manifest.json", "utf8")).pages;
const files = [...new Set([...(manifest["/layout"] || []), ...(manifest["/tv/page"] || [])])];
const js = files.filter((f) => f.endsWith(".js")).map((f) => `.next/${f}`);
const css = files.filter((f) => f.endsWith(".css")).map((f) => `.next/${f}`);

execFileSync("npx", ["es-check", "es2019", ...js], { stdio: "inherit" });

// Propiedades CSS que Chromium 79 no entiende.
const banned = [/(^|[;{\s])inset\s*:/, /aspect-ratio\s*:/, /:where\(/, /:is\(/, /@container/, /color-mix\(/, /@layer/, /\bdvh\b|\bsvh\b|\blvh\b/];
let bad = 0;
for (const file of css) {
  // El preflight de Tailwind 3.4 usa :where() en reglas de abbr/button/input. Chromium 79 descarta solo
  // esas reglas, y /tv no tiene esos elementos, así que se excluyen de la revisión.
  const text = readFileSync(file, "utf8").replace(/[^{}]*(abbr|input|\[hidden\]):where\([^{]*\{[^}]*\}/g, "");
  for (const re of banned) {
    const m = text.match(re);
    if (m) {
      const at = text.indexOf(m[0]);
      console.error(`✕ ${file}: ${re} -> …${text.slice(Math.max(0, at - 60), at + 60)}…`);
      bad++;
    }
  }
}
if (bad) process.exit(1);
console.log(`OK: ${js.length} archivos JS en ES2019 y ${css.length} CSS sin propiedades fuera de Chromium 79.`);
