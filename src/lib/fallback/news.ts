import * as cheerio from "cheerio";
import type { NewsItem } from "../types";
import { isSensitiveNews } from "../copy";
import { fetchText } from "./http";

/** Google Noticias · Tecnología (es-419, México). Se puede cambiar desde /admin. */
export const DEFAULT_NEWS_RSS =
  "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=es-419&gl=MX&ceid=MX:es-419";

/** Lee un feed RSS (Google News u otro) y devuelve titulares limpios y aptos para un escaparate. */
export async function fetchNews(rssUrl: string, limit = 12): Promise<NewsItem[]> {
  const { text } = await fetchText(rssUrl, {
    accept: "application/rss+xml,application/xml,text/xml",
    maxBytes: 3_000_000,
  });
  const $ = cheerio.load(text, { xml: true });
  const seen = new Set<string>();
  const items: NewsItem[] = [];

  $("item").each((_, el) => {
    if (items.length >= limit) return;
    const source = $(el).find("source").first().text().trim();
    let headline = $(el).find("title").first().text().replace(/\s+/g, " ").trim();
    // Google News agrega " - Medio" al final del titular.
    if (source && headline.endsWith(` - ${source}`)) headline = headline.slice(0, -(source.length + 3)).trim();
    else headline = headline.replace(/\s-\s[^-]{2,40}$/, "").trim();

    const key = headline.toLowerCase();
    if (headline.length < 12 || headline.length > 160 || seen.has(key) || isSensitiveNews(headline)) return;
    seen.add(key);
    items.push({ headline, source: source || "Google Noticias" });
  });

  return items;
}
