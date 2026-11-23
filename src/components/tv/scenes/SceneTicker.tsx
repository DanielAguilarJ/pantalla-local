"use client";

import { Fragment, type CSSProperties } from "react";
import type { NewsItem } from "@/lib/types";
import { QrBadge } from "../QrCode";
import type { CoursePlay } from "../engine";
import { BrandLogo } from "@/components/BrandLogo";
import { BRAND } from "@/lib/brand";
import { CourseImage, PriceOrContact } from "./shared";

/** Repite los titulares hasta tener suficiente texto para un bucle continuo sin huecos. */
function tickerItems(news: NewsItem[], fallback: readonly string[]): string[] {
  const base = news.length ? news.map((n) => n.headline) : fallback.slice();
  const out: string[] = [];
  let chars = 0;
  while (chars < 220 || out.length < 3) {
    for (const h of base) {
      out.push(h);
      chars += h.length;
    }
  }
  return out;
}

function Track({ items, reverse, seconds }: { items: string[]; reverse?: boolean; seconds: number }) {
  // Contenido duplicado: animar de 0 a -50% da un bucle infinito perfecto.
  const doubled = items.concat(items);
  return (
    <div className={`tk-track${reverse ? " rev" : ""}`} style={{ animationDuration: `${seconds}s` }}>
      {doubled.map((h, i) => (
        <Fragment key={i}>
          <span className="tk-item">{h}</span>
          <span className="tk-sep" />
        </Fragment>
      ))}
    </div>
  );
}

/** Escena 3 · Cintas de noticias arriba y abajo; al centro, la noticia del día y luego el curso relacionado. */
export function SceneTicker({ play }: { play: CoursePlay }) {
  const { course, palette, featuredNews } = play;
  // Sin noticias del día, las cintas muestran datos reales de WorldBrain en vez de repetir el gancho.
  const items = tickerItems(play.news, BRAND.tickerFacts);
  const seconds = Math.max(25, Math.round(items.join(" ").length / 9));
  const courseAt = featuredNews ? "4300ms" : "400ms";

  return (
    <div className="slide s-ticker" style={{ "--t-course": courseAt } as CSSProperties}>
      <div className="tk-band tk-top display">
        <Track items={items} seconds={seconds} />
        <div className="tk-brand">
          <BrandLogo showSuffix={false} />
        </div>
      </div>

      <div className="tk-main">
        {featuredNews ? (
          <div className="fill tk-intro">
            <div className="tk-intro-label">{play.tickerIntro}</div>
            <div className="tk-intro-news display">«{featuredNews.headline}»</div>
            {featuredNews.source ? <div className="tk-intro-src">{featuredNews.source}</div> : null}
          </div>
        ) : null}

        <div className="fill tk-course">
          <div className="tk-img-wrap">
            <div className="tk-img">
              <CourseImage src={course.image_url} title={course.title} />
            </div>
          </div>
          <div className="tk-text">
            <div className="tk-hook">{course.hook_headline}</div>
            <div className="tk-title display">{course.title}</div>
            {course.hook_subheadline ? <div className="tk-benefit">{course.hook_subheadline}</div> : null}
            <div className="tk-price">
              <PriceOrContact price={course.price} delayMs={0} />
            </div>
          </div>
        </div>

        <QrBadge url={course.course_url} dark={palette.qrDark} className="tk-qr" />
      </div>

      <div className="tk-band tk-bottom display">
        <Track items={items.slice().reverse()} reverse seconds={Math.round(seconds * 1.15)} />
      </div>
    </div>
  );
}
