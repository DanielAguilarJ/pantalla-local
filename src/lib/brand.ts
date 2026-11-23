// Identidad de WorldBrain México (datos tomados de https://ultravelozmente.com/).
export const BRAND = {
  name: "WorldBrain México",
  /** El logotipo del sitio es texto: "World" normal + "Brain" en itálica serif. */
  logo: { regular: "World", italic: "Brain", suffix: "México" },
  tagline: "Aprender mejor se entrena",
  site: "https://ultravelozmente.com/",
  siteLabel: "ultravelozmente.com",
  whatsappDisplay: "55 7810 7837",
  whatsappUrl: "https://wa.me/525578107837?text=Hola,%20quiero%20informes",
  /** Datos verificables del sitio: se usan en copys y en la pantalla, nunca se inventan promesas. */
  facts: {
    since: "2000",
    groupMax: 7,
    programs: 17,
    campus: "Cuautitlán Izcalli",
    hours: "L–J 9:00–18:00 · V 9:00–17:00 · S 8:00–15:00",
  },
  /** Texto del sello cuando un curso no tiene precio publicado (el sitio no publica precios). */
  noPriceBadge: "Grupos de\u00a07",
  /** Cinta de la escena 3 cuando todavía no hay noticias del día. */
  tickerFacts: [
    "Grupos de máximo 7 participantes",
    "Aprendiendo a aprender desde 2000",
    "17 programas para niños, jóvenes y adultos",
    "Sede en Cuautitlán Izcalli y opciones en línea",
    "L–J 9:00–18:00 · V 9:00–17:00 · S 8:00–15:00",
    "Informes por WhatsApp 55 7810 7837",
  ],
  colors: {
    porcelain: "#F6F4EE",
    porcelain2: "#EFECE3",
    klein: "#2B36E8",
    kleinDeep: "#1F28B8",
    signal: "#E8542B",
    ink: "#161512",
  },
} as const;
