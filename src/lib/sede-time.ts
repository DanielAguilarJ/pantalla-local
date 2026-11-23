// Hora de la sede (Cuautitlán Izcalli) aunque la TV tenga mal su zona horaria. Sin dependencias: corre en la TV.

const SEDE_TZ = "America/Mexico_City";
const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Día (0 = domingo) y minuto del día en la sede. Si no hay soporte de zonas IANA, usa el reloj local. */
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

/**
 * Franjas del día para segmentar por público (dayparting, como en la publicidad exterior digital):
 *  - manana  07–12 h: mamás y papás después de dejar a los hijos, adultos.
 *  - salida  12–16 h: salida de escuelas → familias con niños.
 *  - tarde   16–20 h: estudiantes después de clases y adultos al salir del trabajo.
 *  - noche   20–07 h y domingo: adultos; refuerzo de "escríbenos por WhatsApp".
 */
export type Daypart = "manana" | "salida" | "tarde" | "noche";

export function daypartAt(now: Date): Daypart {
  const { day, mins } = sedeClock(now);
  if (day === 0) return "noche";
  const h = mins / 60;
  if (h >= 7 && h < 12) return "manana";
  if (h >= 12 && h < 16) return "salida";
  if (h >= 16 && h < 20) return "tarde";
  return "noche";
}

/** Peso relativo de cada público por franja (1 = normal). */
export const DAYPART_WEIGHTS: Record<Daypart, Record<"ninos" | "jovenes" | "adultos", number>> = {
  manana: { ninos: 1.3, jovenes: 0.8, adultos: 1.3 },
  salida: { ninos: 2, jovenes: 1.1, adultos: 0.7 },
  tarde: { ninos: 1, jovenes: 1.6, adultos: 1.4 },
  noche: { ninos: 0.6, jovenes: 1.2, adultos: 1.6 },
};

export const DAYPART_LABEL: Record<Daypart, string> = {
  manana: "Mañana (7–12 h): familias y adultos",
  salida: "Salida de escuelas (12–16 h): familias con niños",
  tarde: "Tarde (16–20 h): estudiantes y adultos",
  noche: "Noche y domingo: adultos y WhatsApp",
};
