/**
 * lib/design-tokens.ts — Design system Prospeo
 * Source unique de vérité pour toutes les couleurs, typo, espacements, easings.
 * Importé dans les composants qui ont besoin de valeurs programmatiques.
 * Les valeurs CSS sont aussi déclarées dans globals.css (@theme Tailwind v4).
 */

// ─── Couleurs ─────────────────────────────────────────────────────────────────

export const colors = {
  // Backgrounds
  bg:       "#0A0A0B",   // noir profond — page principale
  surface:  "#111114",   // cards, élévations
  elevated: "#16161A",   // hover / active states

  // Marque — Cyan électrique (couleur signature, rare)
  brand:     "#00E5FF",  // primary — utiliser avec parcimonie (5-10% surface max)
  brandDim:  "#00B8CC",  // hover / pressed
  brandGlow: "rgba(0, 229, 255, 0.12)", // box-shadow diffus

  // Texte
  text:     "#F4F4F5",   // corps principal
  textDim:  "#A1A1AA",   // secondaire
  textMute: "#52525B",   // tertiaire / labels

  // Bordures
  border:   "#27272A",
  borderHi: "#3F3F46",   // hover

  // Statuts (inchangés — conservés dans l'app CRM)
  emerald: "#34d399",
  amber:   "#fbbf24",
  red:     "#f87171",
} as const;

// ─── Typographie ──────────────────────────────────────────────────────────────

export const typography = {
  display: '"Syne", system-ui, sans-serif',
  body:    '"Inter", system-ui, sans-serif',
  mono:    '"DM Mono", "Fira Code", monospace',

  // Scales display (clamp responsive)
  sizeHero:    "clamp(4rem, 10vw, 9rem)",   // h1 hero
  sizeSection: "clamp(2.5rem, 6vw, 5rem)",  // h2 sections
  sizeCard:    "clamp(1.5rem, 3vw, 2.5rem)", // h3 cards

  // Tracking
  trackingDisplay: "-0.04em",
  trackingMono:    "0.12em",
} as const;

// ─── Easings ──────────────────────────────────────────────────────────────────

export const easings = {
  // Standard
  easeOutExpo:   [0.16, 1, 0.3, 1]     as [number, number, number, number],
  easeOutQuart:  [0.25, 1, 0.5, 1]     as [number, number, number, number],
  easeInOutCirc: [0.85, 0, 0.15, 1]    as [number, number, number, number],
  easeOutBack:   [0.34, 1.56, 0.64, 1] as [number, number, number, number],

  // Springs Framer Motion
  spring: {
    soft:    { type: "spring", stiffness: 200, damping: 28 } as const,
    snappy:  { type: "spring", stiffness: 400, damping: 30 } as const,
    bouncy:  { type: "spring", stiffness: 300, damping: 18 } as const,
    slow:    { type: "spring", stiffness: 80,  damping: 20 } as const,
  },

  // Durées
  duration: {
    fast:   0.18,
    normal: 0.35,
    slow:   0.65,
    verySlow: 1.1,
  },
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const spacing = {
  sectionY: "py-24 sm:py-32",   // padding vertical sections
  containerX: "px-5 sm:px-6",   // padding horizontal container
  maxW: "max-w-6xl mx-auto",    // max-width centré
} as const;

// ─── Z-index ──────────────────────────────────────────────────────────────────

export const zIndex = {
  base:    0,
  content: 10,
  sticky:  40,
  nav:     50,
  overlay: 60,
  modal:   70,
  cursor:  9999,
} as const;
