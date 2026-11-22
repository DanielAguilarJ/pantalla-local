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
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      colors: {
        porcelain: { DEFAULT: "#F6F4EE", 2: "#EFECE3" },
        klein: { DEFAULT: "#2B36E8", deep: "#1F28B8" },
        signal: "#E8542B",
        ink: "#161512",
      },
    },
  },
  plugins: [],
};

export default config;
