/**
 * lib/easings.ts — Courbes d'animation custom
 * Utilisées avec GSAP (ease strings) et CSS (cubic-bezier).
 */

// ─── CSS cubic-bezier strings ─────────────────────────────────────────────────

export const css = {
  easeOutExpo:    "cubic-bezier(0.16, 1, 0.3, 1)",
  easeOutQuart:   "cubic-bezier(0.25, 1, 0.5, 1)",
  easeInOutCirc:  "cubic-bezier(0.85, 0, 0.15, 1)",
  easeOutBack:    "cubic-bezier(0.34, 1.56, 0.64, 1)",
  easeInExpo:     "cubic-bezier(0.7, 0, 0.84, 0)",
  easeInOutQuart: "cubic-bezier(0.76, 0, 0.24, 1)",
} as const;

// ─── GSAP ease strings ────────────────────────────────────────────────────────
// Format : "power4.out", "expo.out", etc.

export const gsap = {
  easeOutExpo:    "expo.out",
  easeOutQuart:   "quart.out",
  easeInOutCirc:  "circ.inOut",
  easeOutBack:    "back.out(1.7)",
  easeOutElastic: "elastic.out(1, 0.5)",
  easeInOutQuart: "quart.inOut",
} as const;

// ─── Framer Motion arrays ─────────────────────────────────────────────────────

export const framer = {
  easeOutExpo:    [0.16, 1, 0.3, 1]     as const,
  easeOutQuart:   [0.25, 1, 0.5, 1]     as const,
  easeInOutCirc:  [0.85, 0, 0.15, 1]    as const,
  easeOutBack:    [0.34, 1.56, 0.64, 1] as const,
  easeInOutQuart: [0.76, 0, 0.24, 1]    as const,
} as const;
