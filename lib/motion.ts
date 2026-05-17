/**
 * lib/motion.ts — Presets Framer Motion réutilisables
 * Importe ces variants dans les composants pour des animations cohérentes.
 */

import type { Variants, Transition } from "framer-motion";
import { easings } from "./design-tokens";

// ─── Transitions de base ───────────────────────────────────────────────────────

export const transitions = {
  fast:    { duration: easings.duration.fast,   ease: easings.easeOutExpo  } satisfies Transition,
  normal:  { duration: easings.duration.normal, ease: easings.easeOutExpo  } satisfies Transition,
  slow:    { duration: easings.duration.slow,   ease: easings.easeOutExpo  } satisfies Transition,
  spring:  easings.spring.snappy                                             satisfies Transition,
  softSpr: easings.spring.soft                                               satisfies Transition,
} as const;

// ─── Variants communs ─────────────────────────────────────────────────────────

/** Fade simple — pour modales, overlays */
export const fadeVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: transitions.normal },
  exit:    { opacity: 0, transition: transitions.fast   },
};

/** Révèle depuis le bas — pour sections au viewport */
export const revealVariants: Variants = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: easings.duration.slow, ease: easings.easeOutExpo } },
};

/** Révèle depuis le haut */
export const revealDownVariants: Variants = {
  hidden:  { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: transitions.normal },
};

/** Révèle depuis la gauche */
export const revealLeftVariants: Variants = {
  hidden:  { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: easings.duration.slow, ease: easings.easeOutExpo } },
};

/** Container pour stagger des enfants */
export const staggerContainer: Variants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren:  0.08,
      delayChildren:    0.1,
    },
  },
};

/** Item dans un stagger container */
export const staggerItem: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easings.easeOutExpo } },
};

/** Scale in — pour badges, chips, tooltips */
export const scaleInVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: easings.spring.bouncy },
  exit:    { opacity: 0, scale: 0.9, transition: transitions.fast },
};

/** Slide horizontal — pour drawers, panels */
export const slideRightVariants: Variants = {
  hidden:  { x: "100%" },
  visible: { x: 0, transition: { duration: easings.duration.slow, ease: easings.easeOutExpo } },
  exit:    { x: "100%", transition: { duration: easings.duration.normal, ease: easings.easeInOutCirc } },
};

export const slideLeftVariants: Variants = {
  hidden:  { x: "-100%" },
  visible: { x: 0, transition: { duration: easings.duration.slow, ease: easings.easeOutExpo } },
  exit:    { x: "-100%", transition: transitions.normal },
};

/** Text reveal — split par ligne */
export const textRevealLine: Variants = {
  hidden:  { y: "110%", opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.7, ease: easings.easeOutExpo } },
};

/** Page transition — rideau */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easings.easeOutExpo } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.25, ease: easings.easeInOutCirc } },
};
