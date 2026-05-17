"use client";

/**
 * components/ui/Marquee.tsx
 * Band défilant infini — logos clients, features, etc.
 * Double la liste pour le loop continu (CSS animation).
 */

import { useRef, useEffect } from "react";

interface MarqueeProps {
  children:    React.ReactNode[];
  speed?:      number;   // secondes pour un tour complet (défaut 28)
  reverse?:    boolean;  // sens inverse
  pauseOnHover?: boolean;
  gap?:        number;   // px entre items (défaut 48)
  className?:  string;
}

export default function Marquee({
  children,
  speed        = 28,
  reverse      = false,
  pauseOnHover = true,
  gap          = 48,
  className    = "",
}: MarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const kf = [
      { transform: "translateX(0)" },
      { transform: `translateX(-50%)` },
    ];
    const anim = track.animate(kf, {
      duration:   speed * 1000,
      iterations: Infinity,
      easing:     "linear",
      direction:  reverse ? "reverse" : "normal",
    });

    if (pauseOnHover) {
      track.addEventListener("mouseenter", () => anim.pause());
      track.addEventListener("mouseleave", () => anim.play());
    }

    return () => anim.cancel();
  }, [speed, reverse, pauseOnHover]);

  // Double les enfants pour le loop
  const doubled = [...children, ...children];

  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        ref={trackRef}
        className="flex items-center will-change-transform"
        style={{ gap: `${gap}px`, width: "max-content" }}
      >
        {doubled.map((child, i) => (
          <div key={i} className="shrink-0 flex items-center">
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
