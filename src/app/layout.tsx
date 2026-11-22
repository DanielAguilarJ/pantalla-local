import type { Metadata, Viewport } from "next";
import { Anton, Geist, Instrument_Serif } from "next/font/google";
import { BRAND } from "@/lib/brand";
import "./globals.css";

// Geist + Instrument Serif son las tipografías de ultravelozmente.com; Anton da el impacto a distancia en la TV.
const display = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });
const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Instrument_Serif({ weight: "400", style: ["normal", "italic"], subsets: ["latin"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://pantalla-local.vercel.app"),
  title: `Pantalla · ${BRAND.name}`,
  description: `Señalización digital de ${BRAND.name}`,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: BRAND.colors.porcelain,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
