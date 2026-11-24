// Verifica que el banco de copys cumpla el contrato: 50 fórmulas, máximo 8 palabras cada una.
import { readFileSync } from "node:fs";

const file = new URL("../data/benfrank-templates.json", import.meta.url);
const data = JSON.parse(readFileSync(file, "utf8"));
const AUDIENCES = new Set(["todos", "ninos", "jovenes", "adultos"]);
const HEADLINE_VARS = /{{(curso|noticia|precio|beneficio|oferta)}}/;
const SUB_VARS = /{{(curso|noticia|precio|beneficio|edad|oferta)}}/;
const errors = [];

if (data.headlines.length !== 50) errors.push(`Se esperaban 50 fórmulas y hay ${data.headlines.length}.`);

function check(list, allowed, maxWords, label) {
  const ids = new Set();
  for (const { id, text, audience } of list) {
    if (ids.has(id)) errors.push(`${label}: ID duplicado ${id}`);
    ids.add(id);
    if (!AUDIENCES.has(audience)) errors.push(`${label} ${id}: audience inválida "${audience}"`);
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (maxWords && words.length > maxWords) errors.push(`${id} tiene ${words.length} palabras: "${text}"`);
    const unknown = (text.match(/{{\s*[a-z]+\s*}}/g) || []).filter((p) => !allowed.test(p));
    if (unknown.length) errors.push(`${id} usa placeholders desconocidos: ${unknown.join(", ")}`);
  }
}
check(data.headlines, HEADLINE_VARS, 8, "headline");
check(data.subheadlines, SUB_VARS, 0, "subheadline");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
const count = (fn) => data.headlines.filter(fn).length;
const byAudience = [...AUDIENCES].map((a) => `${a}: ${count((h) => h.audience === a)}`).join(", ");
console.log(
  `OK: ${data.headlines.length} fórmulas (≤ 8 palabras). Por público → ${byAudience}. ` +
    `Con {{curso}}: ${count((h) => h.text.includes("{{curso}}"))}, con {{noticia}}: ${count((h) => h.text.includes("{{noticia}}"))}.`,
);

// Los fragmentos de testimonio deben ser textuales (no se inventa ni se edita lo que dijo una familia).
const brand = JSON.parse(readFileSync(new URL("../data/worldbrain-brand.json", import.meta.url), "utf8"));
const norm = (s) => s.replace(/^[…\s]+|[.…\s]+$/g, "");
const bad = brand.testimonials.filter((t) => !t.pull || !t.quote.includes(norm(t.pull)) || t.pull.split(/\s+/).length > 16);
if (bad.length) {
  console.error("Fragmentos de testimonio que no son textuales o pasan de 16 palabras:", bad.map((t) => t.id).join(", "));
  process.exit(1);
}
const tr = brand.transformation;
if (tr && !brand.testimonials.some((t) => t.id === tr.testimonial)) {
  console.error("transformation.testimonial no existe");
  process.exit(1);
}
console.log(`OK: ${brand.testimonials.length} fragmentos de testimonio textuales.`);

// Preguntas de la pantalla: formato de pregunta y máximo 7 palabras (se leen de un vistazo).
const catalog = JSON.parse(readFileSync(new URL("../data/worldbrain-catalog.json", import.meta.url), "utf8"));
const badQ = catalog.programs.filter((p) => !/^¿[^?]+\?$/.test(p.question || "") || p.question.split(/\s+/).length > 7);
if (badQ.length) {
  console.error("Preguntas inválidas (¿…?, máx. 7 palabras):", badQ.map((p) => p.id).join(", "));
  process.exit(1);
}
console.log(`OK: ${catalog.programs.length} preguntas de pantalla (≤ 7 palabras).`);
