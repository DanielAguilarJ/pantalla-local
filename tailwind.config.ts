import type { Config } from "tailwindcss";

// Tailwind v3 (no v4) a propósito: v4 exige Chrome 111+ (@property, color-mix, cascade layers)
// y la mayoría de televisores LG webOS 6–24 traen Chromium 79–108.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Impact", "Arial Narrow", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "Segoe UI", "Roboto", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
