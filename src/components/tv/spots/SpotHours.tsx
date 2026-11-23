"use client";

import { useState } from "react";
import { BRAND_CONTENT, type BrandPlay } from "../engine";
import { EdFooter, Masthead, Stage } from "./kit";

type Day = (typeof BRAND_CONTENT.hours.week)[number];

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

function pretty(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return m ? `${h}:${String(m).padStart(2, "0")}` : `${h}:00`;
}

export interface HoursStatus {
  open: boolean;
  headline: string;
  detail: string;
  today: number;
}

const SEDE_TZ = "America/Mexico_City";
const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/**
 * Día y minuto actuales en la hora de la sede (Cuautitlán Izcalli), aunque la TV tenga mal su zona horaria.
 * Si el navegador no soporta zonas IANA, se usa el reloj local.
 */
export function sedeClock(now: Date): { day: number; mins: number } {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: SEDE_TZ,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
    const day = WEEKDAYS[get("weekday")];
    const hour = Number(get("hour")) % 24;
    const minute = Number(get("minute"));
    if (day !== undefined && Number.isFinite(hour) && Number.isFinite(minute)) return { day, mins: hour * 60 + minute };
  } catch {
    /* sin soporte de zonas horarias */
  }
  return { day: now.getDay(), mins: now.getHours() * 60 + now.getMinutes() };
}

/** Estado en vivo en hora de la sede: abierto ahora, abre más tarde hoy, o el próximo día de atención. */
export function hoursStatus(now: Date, week: Day[]): HoursStatus {
  const { day: today, mins } = sedeClock(now);
  const d = week[today];
  if (d.open && d.close && mins >= toMinutes(d.open) && mins < toMinutes(d.close)) {
    return { open: true, headline: "Abierto ahora.", detail: `Hoy te atendemos hasta las ${pretty(d.close)}.`, today };
  }
  if (d.open && mins < toMinutes(d.open)) {
    return { open: false, headline: `Hoy abrimos a las ${pretty(d.open)}.`, detail: "Mientras tanto, escríbenos por WhatsApp.", today };
  }
  for (let i = 1; i <= 7; i++) {
    const n = week[(today + i) % 7];
    if (n.open) {
      const when = i === 1 ? "mañana" : `el ${n.label.toLowerCase()}`;
      return { open: false, headline: `Abrimos ${when} a las ${pretty(n.open)}.`, detail: "Déjanos tu mensaje por WhatsApp.", today };
    }
  }
  return { open: false, headline: "Escríbenos por WhatsApp.", detail: "", today };
}

/** Anuncio de marca · Horario con estado en vivo ("Abierto ahora") y la semana completa. */
export function SpotHours({ play }: { play: BrandPlay }) {
  const h = BRAND_CONTENT.hours;
  const [status] = useState(() => hoursStatus(new Date(), h.week));
  // Lunes primero, domingo al final (como se lee en México).
  const order = h.week.slice(1).concat(h.week[0]);

  return (
    <Stage className={`sp-hours ${status.open ? "is-open" : "is-closed"}`}>
      <Masthead label={h.kicker} />
      <div className="hr-main">
        <div className="hr-left">
          <div className="hr-status ed-up" style={{ animationDelay: "250ms" }}>
            <span className="hr-dot" />
            <span className="ed-mono">{status.open ? "Abierto" : "Cerrado en este momento"}</span>
          </div>
          <div className="hr-head ed-serif ed-up" style={{ animationDelay: "450ms" }}>
            {status.headline}
          </div>
          {status.detail ? (
            <div className="hr-detail ed-up" style={{ animationDelay: "700ms" }}>
              {status.detail}
            </div>
          ) : null}
        </div>
        <div className="hr-week">
          {order.map((d, i) => (
            <div key={d.day} className={`hr-row${d.day === status.today ? " on" : ""}`} style={{ animationDelay: `${900 + i * 110}ms` }}>
              <span className="hr-day ed-serif">{d.label}</span>
              {d.day === status.today ? <span className="ed-mono hr-today">Hoy</span> : null}
              <span className="ed-mono hr-time">{d.open && d.close ? `${d.open} – ${d.close}` : "Cerrado"}</span>
            </div>
          ))}
          <div className="ed-mono hr-note ed-up" style={{ animationDelay: "1900ms" }}>
            {h.note}
          </div>
        </div>
      </div>
      <EdFooter featured={play.featured} palette={play.palette} variant="contact" delayMs={2200} />
    </Stage>
  );
}
