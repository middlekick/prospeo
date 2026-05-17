"use client";

/**
 * components/ui/PageTransition.tsx
 * Rideau noir (curtain) qui se retracte a chaque navigation.
 * Next.js App Router : animation d'entree uniquement — l'exit n'est pas
 * possible car Next.js demonte la page immediatement au changement de route.
 *
 * Curtain  : overlay noir origin-top qui fait scaleY 1→0 (rideau qui remonte)
 * PageFade : wrapper léger opacity 0→1 pour le contenu entrant
 */

import { motion, AnimatePresence } from "framer-motion";
import { usePathname }             from "next/navigation";

// ─── Rideau noir ───────────────────────────────────────────────────────────────
export function Curtain() {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      <motion.div
        key={pathname + "-curtain"}
        className="fixed inset-0 z-[9999] bg-[#0A0A0B] pointer-events-none origin-top"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1], delay: 0.04 }}
      />
    </AnimatePresence>
  );
}

// ─── Fade entrant du contenu ───────────────────────────────────────────────────
export function PageFade({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname + "-fade"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
