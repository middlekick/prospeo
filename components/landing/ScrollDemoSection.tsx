"use client";

/**
 * components/landing/ScrollDemoSection.tsx
 * §04 — Démo produit scroll-pinned.
 *
 * Desktop (lg+) :
 *   Container 500vh · inner sticky top-0 · getBoundingClientRect RAF → activeScene
 *   Gauche  : 5 étapes cliquables + barre de progression
 *   Droite  : <AnimatedDemo forceScene={activeScene} />
 *
 * Mobile : AnimatedDemo en autoplay classique
 *
 * Fix scroll : getBoundingClientRect() en RAF — fonctionne avec Lenis
 * (qui anime via CSS transforms, pas window.scrollY).
 */

import { useRef, useState, useEffect }                   from "react";
import { motion, useMotionValue, useMotionValueEvent }   from "framer-motion";
import AnimatedDemo                                      from "./AnimatedDemo";

// ─── Scroll progress via rAF + getBoundingClientRect ─────────────────────────
function useElementScrollProgress(ref: React.RefObject<HTMLDivElement | null>) {
  const progress = useMotionValue(0);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      if (ref.current) {
        const rect       = ref.current.getBoundingClientRect();
        const scrollable = rect.height - window.innerHeight;
        const scrolled   = -rect.top;
        progress.set(Math.max(0, Math.min(1, scrolled / scrollable)));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ref, progress]);

  return progress;
}

// ─── Métadonnées des scènes ────────────────────────────────────────────────────
type Scene = "scraping" | "kanban" | "inpi" | "session" | "scripts";

const SCENES: Scene[] = ["scraping", "kanban", "inpi", "session", "scripts"];

const SCENE_META: { scene: Scene; num: string; title: string; desc: string }[] = [
  { scene: "scraping", num: "01", title: "Sourcing Maps",       desc: "Scrape 50+ leads par métier et ville en 2 min" },
  { scene: "kanban",   num: "02", title: "Vue Kanban",          desc: "Drag & drop entre statuts, pipeline visuel" },
  { scene: "inpi",     num: "03", title: "Recherche INPI / RNE", desc: "Entreprises créées < 6 mois — prospects chauds" },
  { scene: "session",  num: "04", title: "Session d'appels",    desc: "Script live + résultat en 1 touche clavier" },
  { scene: "scripts",  num: "05", title: "Téléprompter",        desc: "Cold call + objections intégrées en direct" },
];

// ─── Composant principal ──────────────────────────────────────────────────────
export default function ScrollDemoSection() {
  const containerRef   = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const scrollYProgress = useElementScrollProgress(containerRef);

  // Mise à jour de l'étape active au scroll
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const raw = Math.floor(v * 5);
    const idx = Math.min(4, Math.max(0, raw));
    setActiveIdx(idx);
  });

  const activeScene = SCENES[activeIdx];

  return (
    <>
      {/* ── Desktop : scroll-pinned ─────────────────────────────────────── */}
      <div ref={containerRef} className="hidden lg:block h-[500vh] relative">
        <div className="sticky top-0 h-screen flex items-center overflow-hidden">
          <div className="max-w-6xl mx-auto px-5 w-full grid grid-cols-[280px_1fr] gap-10 items-center">

            {/* ── Panneau gauche — navigation étapes ── */}
            <div className="flex flex-col gap-2">

              {SCENE_META.map((s, i) => (
                <button
                  key={s.scene}
                  onClick={() => setActiveIdx(i)}
                  className={`text-left flex items-start gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 cursor-pointer
                    ${i === activeIdx
                      ? "bg-brand-500/[0.07] border border-brand-500/20 shadow-[0_0_24px_-8px_rgba(0,229,255,0.2)]"
                      : "border border-transparent hover:bg-white/[0.025] opacity-45 hover:opacity-65"
                    }`}
                >
                  {/* Numéro */}
                  <span className={`text-[11px] font-mono mt-0.5 w-5 shrink-0 transition-colors
                    ${i === activeIdx ? "text-brand-400" : "text-slate-700"}`}>
                    {s.num}
                  </span>

                  {/* Texte */}
                  <div className="min-w-0">
                    <div className={`text-sm font-semibold transition-colors
                      ${i === activeIdx ? "text-slate-100" : "text-slate-400"}`}>
                      {s.title}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5 leading-snug">{s.desc}</div>
                  </div>

                  {/* Indicateur actif */}
                  {i === activeIdx && (
                    <div className="ml-auto w-1 h-1 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                  )}
                </button>
              ))}

              {/* Barre de progression scroll */}
              <div className="mt-3 mx-4 h-px bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-brand-400 to-brand-dim rounded-full origin-left"
                  style={{ scaleX: scrollYProgress }}
                />
              </div>
              <p className="text-[10px] text-slate-700 font-mono mx-4 mt-1">
                Défilez pour naviguer
              </p>
            </div>

            {/* ── Panneau droit — démo contrôlée ── */}
            <div className="relative rounded-3xl border border-white/[0.08] overflow-hidden
                            shadow-[0_40px_100px_-20px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.04)_inset]">
              {/* Halo brand */}
              <div
                className="absolute -inset-x-0 -top-16 h-48 -z-10 blur-[80px] opacity-40 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.40), rgba(0,229,255,0.10) 55%, transparent 75%)" }}
              />
              <AnimatedDemo forceScene={activeScene} />
            </div>

          </div>
        </div>
      </div>

      {/* ── Mobile : autoplay classique ─────────────────────────────────── */}
      <div className="lg:hidden relative rounded-3xl border border-white/[0.08] overflow-hidden
                      shadow-[0_40px_100px_-20px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.04)_inset]">
        <div
          className="absolute -inset-x-0 -top-16 h-48 -z-10 blur-[80px] opacity-40 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.40), rgba(0,229,255,0.10) 55%, transparent 75%)" }}
        />
        <AnimatedDemo />
      </div>
    </>
  );
}
