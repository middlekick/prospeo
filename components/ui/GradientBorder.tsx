"use client";

/**
 * components/ui/GradientBorder.tsx
 * Carte avec bordure en conic-gradient animée (rotation continue).
 * Idéal pour les cards "featured", prix Pro, etc.
 */

import { useEffect, useRef } from "react";

interface GradientBorderProps {
  children:     React.ReactNode;
  className?:   string;
  innerClass?:  string;
  borderWidth?: number;   // px (défaut 1)
  speed?:       number;   // ms par tour (défaut 4000)
  colors?:      string;   // gradient custom
  rounded?:     string;   // border-radius class (défaut "rounded-2xl")
}

export default function GradientBorder({
  children,
  className    = "",
  innerClass   = "",
  borderWidth  = 1,
  speed        = 4000,
  colors       = "#00E5FF, #007A99, #00E5FF, #004D5C, #00E5FF",
  rounded      = "rounded-2xl",
}: GradientBorderProps) {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const angleRef = useRef(0);
  const rafRef   = useRef<number>(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const degsPerMs = 360 / speed;
    let last = 0;

    function tick(now: number) {
      const dt = now - last;
      last = now;
      angleRef.current = (angleRef.current + degsPerMs * dt) % 360;
      if (wrap) {
        wrap.style.setProperty(
          "--gradient-angle",
          `${angleRef.current}deg`
        );
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame((now) => { last = now; tick(now); });
    return () => cancelAnimationFrame(rafRef.current);
  }, [speed]);

  return (
    <div
      ref={wrapRef}
      className={`relative p-[1px] ${rounded} ${className}`}
      style={{
        background: `conic-gradient(from var(--gradient-angle, 0deg), ${colors})`,
        padding: `${borderWidth}px`,
      } as React.CSSProperties}
    >
      <div className={`relative ${rounded} w-full h-full bg-surface ${innerClass}`}>
        {children}
      </div>
    </div>
  );
}
