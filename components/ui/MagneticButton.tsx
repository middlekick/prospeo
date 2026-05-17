"use client";

/**
 * components/ui/MagneticButton.tsx
 * Bouton primaire/ghost/link avec effet magnétique.
 * Le bouton attire le curseur dans un rayon de 60px.
 */

import { useRef, useState } from "react";
import { motion, useSpring } from "framer-motion";

type Variant = "primary" | "ghost" | "link";

interface MagneticButtonProps {
  children:  React.ReactNode;
  variant?:  Variant;
  href?:     string;
  onClick?:  () => void;
  disabled?: boolean;
  className?: string;
  radius?:   number;  // rayon d'attraction en px (défaut 60)
}

export default function MagneticButton({
  children,
  variant  = "primary",
  href,
  onClick,
  disabled,
  className = "",
  radius   = 60,
}: MagneticButtonProps) {
  const ref  = useRef<HTMLElement>(null);
  const [hovered, setHovered] = useState(false);

  // Springs pour le mouvement magnétique
  const x = useSpring(0, { stiffness: 200, damping: 22 });
  const y = useSpring(0, { stiffness: 200, damping: 22 });

  function onMouseMove(e: React.MouseEvent) {
    if (!ref.current || disabled) return;
    const rect   = ref.current.getBoundingClientRect();
    const cx     = rect.left + rect.width  / 2;
    const cy     = rect.top  + rect.height / 2;
    const dx     = e.clientX - cx;
    const dy     = e.clientY - cy;
    const dist   = Math.sqrt(dx * dx + dy * dy);

    if (dist < radius) {
      // Attraction proportionnelle à la distance
      const force = 1 - dist / radius;
      x.set(dx * force * 0.45);
      y.set(dy * force * 0.45);
    }
  }

  function onMouseLeave() {
    x.set(0);
    y.set(0);
    setHovered(false);
  }

  // Classes par variante
  const variantClasses: Record<Variant, string> = {
    primary: `
      relative px-7 py-3.5 rounded-full font-semibold text-[13px]
      bg-brand text-bg
      shadow-[0_0_30px_rgba(0,229,255,0.25)]
      hover:shadow-[0_0_50px_rgba(0,229,255,0.35)]
      hover:bg-brand-dim
      disabled:opacity-40 disabled:cursor-not-allowed
      transition-[background,box-shadow] duration-200
    `,
    ghost: `
      relative px-7 py-3.5 rounded-full font-medium text-[13px]
      border border-white/[0.14] text-text-dim
      hover:border-brand/30 hover:text-brand hover:bg-brand-faint
      disabled:opacity-40 disabled:cursor-not-allowed
      transition-all duration-200
    `,
    link: `
      relative inline-flex items-center gap-1.5 text-[13px] font-medium
      text-brand hover:text-brand-dim
      disabled:opacity-40 disabled:cursor-not-allowed
      transition-colors duration-150
    `,
  };

  const Tag = href ? motion.a : motion.button;

  return (
    <Tag
      ref={ref as React.Ref<HTMLButtonElement & HTMLAnchorElement>}
      href={href}
      onClick={!disabled ? onClick : undefined}
      disabled={!href ? disabled : undefined}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onMouseLeave}
      style={{ x, y }}
      whileTap={!disabled ? { scale: 0.97 } : undefined}
      className={`inline-flex items-center justify-center gap-2 select-none cursor-pointer ${variantClasses[variant]} ${className}`}
    >
      {/* Glow interne au hover (primary uniquement) */}
      {variant === "primary" && hovered && (
        <span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.15), transparent 70%)" }}
        />
      )}
      <span className="relative">{children}</span>
    </Tag>
  );
}
