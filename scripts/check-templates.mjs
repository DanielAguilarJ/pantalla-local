// Verifica que el banco de copys cumpla el contrato: 50 fórmulas, máximo 8 palabras cada una.
import { readFileSync } from "node:fs";

const file = new URL("../data/benfrank-templates.json", import.meta.url);
const data = JSON.parse(readFileSync(file, "utf8"));
const errors = [];

if (data.headlines.length !== 50) errors.push(`Se esperaban 50 fórmulas y hay ${data.headlines.length}.`);

const ids = new Set();
for (const { id, text } of data.headlines) {
  if (ids.has(id)) errors.push(`ID duplicado: ${id}`);
  ids.add(id);
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length > 8) errors.push(`${id} tiene ${words.length} palabras: "${text}"`);
  const unknown = (text.match(/{{\s*([a-z]+)\s*}}/g) || []).filter((p) => !/{{(curso|noticia|precio)}}/.test(p));
  if (unknown.length) errors.push(`${id} usa placeholders desconocidos: ${unknown.join(", ")}`);
}

const withNews = data.headlines.filter((h) => h.text.includes("{{noticia}}")).length;
const withCourse = data.headlines.filter((h) => h.text.includes("{{curso}}")).length;

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`OK: ${data.headlines.length} fórmulas (≤ 8 palabras). Con {{curso}}: ${withCourse}. Con {{noticia}}: ${withNews}.`);
