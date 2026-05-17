"use client";

/**
 * components/ui/SmoothScrollProvider.tsx
 * Wraps Lenis en provider global — à placer dans layout.tsx.
 * Expose useLenis() pour les composants qui en ont besoin (GSAP, etc.)
 */

import { createContext, useContext, useEffect, useRef } from "react";
import type Lenis from "lenis";

interface LenisContextValue {
  lenis: Lenis | null;
}

const LenisCtx = createContext<LenisContextValue>({ lenis: null });

export function useLenisContext() {
  return useContext(LenisCtx);
}

interface Props {
  children:  React.ReactNode;
  lerp?:     number;  // inertie (défaut 0.085)
  disabled?: boolean; // désactiver sur mobile si besoin
}

export default function SmoothScrollProvider({ children, lerp = 0.085, disabled = false }: Props) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (disabled) return;

    // Import dynamique pour éviter les erreurs SSR
    let raf: number;
    import("lenis").then(({ default: LenisCls }) => {
      const lenis = new LenisCls({ lerp, smoothWheel: true });
      lenisRef.current = lenis;

      function loop(time: number) {
        lenis.raf(time);
        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);
    });

    return () => {
      cancelAnimationFrame(raf);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, [lerp, disabled]);

  return (
    <LenisCtx.Provider value={{ lenis: lenisRef.current }}>
      {children}
    </LenisCtx.Provider>
  );
}
