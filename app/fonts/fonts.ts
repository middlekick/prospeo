/**
 * app/fonts/fonts.ts
 * Polices self-hosted via next/font/local (woff2 issus de @fontsource).
 * → preload automatique, pas de @import render-blocking, size-adjust anti-CLS.
 */

import localFont from "next/font/local";

export const syne = localFont({
  src: [
    { path: "./syne-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./syne-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./syne-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-syne",
  display:  "swap",
  preload:  true,
  fallback: ["system-ui", "sans-serif"],
});

export const dmMono = localFont({
  src:      "./dm-mono-latin-400-normal.woff2",
  weight:   "400",
  style:    "normal",
  variable: "--font-dm-mono",
  display:  "swap",
  preload:  true,
  fallback: ["ui-monospace", "monospace"],
});
