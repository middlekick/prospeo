"use client";

/**
 * components/ui/SectionLabel.tsx
 * Kicker DM Mono numéroté au-dessus des titres de section.
 * Exemple : <SectionLabel n="01" label="Fonctionnalités" />
 */

import { motion, useInView } from "framer-motion";
import { useRef }            from "react";

interface SectionLabelProps {
  n?:         string;   // ex: "01" ou "02/06"
  label:      string;
  className?: string;
  accent?:    boolean;  // avec dot cyan avant le label
}

export default function SectionLabel({ n, label, className = "", accent = false }: SectionLabelProps) {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`inline-flex items-center gap-2.5 ${className}`}
    >
      {accent && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: "#00E5FF", boxShadow: "0 0 8px rgba(0,229,255,0.7)" }}
        />
      )}
      {n && (
        <span className="font-mono text-[10px] text-text-mute tracking-widest">{n} —</span>
      )}
      <span className="font-mono text-[10px] tracking-widest uppercase text-brand/80">{label}</span>
    </motion.div>
  );
}
