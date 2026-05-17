"use client";

/**
 * components/ui/GlowCursor.tsx
 * Curseur custom cyan — disque 12px qui suit la souris avec spring.
 * Grossit à 40px sur les interactifs. Devient texte sur les CTA.
 * Désactivé sur mobile.
 */

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

type CursorState = "default" | "hover" | "text";

export default function GlowCursor() {
  const [state,   setState]   = useState<CursorState>("default");
  const [label,   setLabel]   = useState("");
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Lag 0.12s — spring léger pour ne pas être collé
  const x = useSpring(mouseX, { stiffness: 280, damping: 28, mass: 0.6 });
  const y = useSpring(mouseY, { stiffness: 280, damping: 28, mass: 0.6 });

  useEffect(() => {
    // Détecter mobile (pas de pointeur précis)
    const hasFine = window.matchMedia("(pointer: fine)").matches;
    setIsMobile(!hasFine);
    if (!hasFine) return;

    document.documentElement.classList.add("cursor-custom");

    function move(e: MouseEvent) {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!visible) setVisible(true);
    }

    function checkTarget(e: MouseEvent) {
      const el = e.target as HTMLElement;
      // CTA / data-cursor-text
      const cta = el.closest("[data-cursor]") as HTMLElement | null;
      if (cta) {
        const type = cta.dataset.cursor as CursorState;
        setState(type || "hover");
        setLabel(cta.dataset.cursorLabel || "");
        return;
      }
      // Interactifs standard
      if (el.closest("a, button, [role=button], input, textarea, select, label, [tabindex]")) {
        setState("hover");
        setLabel("");
        return;
      }
      setState("default");
      setLabel("");
    }

    function leave() { setVisible(false); }

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", checkTarget, { passive: true });
    document.addEventListener("mouseleave", leave);

    return () => {
      document.documentElement.classList.remove("cursor-custom");
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", checkTarget);
      document.removeEventListener("mouseleave", leave);
    };
  }, [mouseX, mouseY, visible]);

  if (isMobile) return null;

  const size = state === "hover" ? 40 : state === "text" ? 60 : 12;

  return (
    <motion.div
      className="pointer-events-none fixed z-[9999] top-0 left-0 flex items-center justify-center"
      style={{ x, y, translateX: "-50%", translateY: "-50%", opacity: visible ? 1 : 0 }}
      animate={{
        width:  size,
        height: size,
        borderRadius: "50%",
      }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Anneau */}
      <motion.div
        className="absolute inset-0 rounded-full border border-brand/70"
        animate={{ scale: state === "hover" ? 1 : state === "text" ? 1.1 : 1 }}
        transition={{ duration: 0.2 }}
      />

      {/* Glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(0,229,255,0.25) 0%, transparent 70%)",
          filter: "blur(4px)",
        }}
      />

      {/* Dot central */}
      {state === "default" && (
        <div className="w-1.5 h-1.5 rounded-full bg-brand" />
      )}

      {/* Label texte */}
      {state === "text" && label && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-[10px] font-mono font-semibold text-brand tracking-wider whitespace-nowrap"
        >
          {label}
        </motion.span>
      )}
    </motion.div>
  );
}
