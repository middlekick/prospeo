"use client";

/**
 * components/landing/ConstatSection.tsx
 * §02 — "Le constat" — section scroll-pinned.
 *
 * Fix scroll : getBoundingClientRect() en RAF — fonctionne avec Lenis
 * (qui anime via CSS transforms, pas window.scrollY).
 *
 * Desktop (md+) : 300vh sticky, 3 cartes révélées au scroll.
 * Mobile         : layout statique empilé.
 */

import { useRef, useEffect }                          from "react";
import { motion, useMotionValue, useTransform }       from "framer-motion";

// ─── Scroll progress via rAF + getBoundingClientRect ─────────────────────────
// Marche quel que soit le moteur de scroll (Lenis, native, etc.)
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

// ─── Données — contenu revu pour l'impact ─────────────────────────────────────
const CARDS = [
  {
    tone:    "bad" as const,
    kicker:  "La réalité",
    title:   "Sans outil dédié",
    items: [
      { icon: "×", text: "2h/jour à copier-coller dans Excel" },
      { icon: "×", text: "Relances oubliées = deals perdus" },
      { icon: "×", text: "Impossible de savoir ce qui marche" },
      { icon: "×", text: "Zéro structure = 0 momentum" },
    ],
  },
  {
    tone:    "mid" as const,
    kicker:  "Avec Prospeo",
    title:   "Un seul flux, tout centralisé",
    items: [
      { icon: "✓", text: "50 leads sourcés (Maps + INPI) en 2 min" },
      { icon: "✓", text: "Script d'appel affiché pendant l'appel" },
      { icon: "✓", text: "Relances J+3 · J+7 · J+15 automatiques" },
      { icon: "✓", text: "Funnel de conversion en temps réel" },
    ],
  },
  {
    tone:    "good" as const,
    kicker:  "Le résultat",
    title:   "Des chiffres réels",
    metrics: [
      { value: "12 k€",  label: "CA généré en 1 semaine de test" },
      { value: "×2",     label: "RDV pris par rapport à avant" },
      { value: "0",      label: "Relance oubliée depuis le lancement" },
      { value: "< 1h",   label: "Pour être pleinement opérationnel" },
    ],
  },
] as const;

// ─── Carte ─────────────────────────────────────────────────────────────────────
function BadCard({ style }: { style?: object }) {
  const c = CARDS[0];
  return (
    <motion.div style={style as React.CSSProperties}
      className="relative flex flex-col p-7 rounded-2xl overflow-hidden
                 border border-red-500/[0.10] bg-[#0d0608]
                 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      {/* Halo rouge subtil */}
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full
                      bg-red-500/[0.06] blur-2xl pointer-events-none" />
      <div className="text-[10px] font-mono uppercase tracking-widest text-red-500/60 mb-3">{c.kicker}</div>
      <h3 className="text-base font-semibold text-slate-300 mb-6">{c.title}</h3>
      <ul className="space-y-3.5 flex-1">
        {c.items.map(it => (
          <li key={it.text} className="flex items-start gap-3">
            <span className="w-4 h-4 rounded flex items-center justify-center
                             bg-red-500/[0.08] border border-red-500/[0.15]
                             text-red-500 text-[10px] font-bold flex-shrink-0 mt-0.5">
              {it.icon}
            </span>
            <span className="text-sm text-slate-500 leading-snug">{it.text}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function MidCard({ style }: { style?: object }) {
  const c = CARDS[1];
  return (
    <motion.div style={style as React.CSSProperties}
      className="relative flex flex-col p-7 rounded-2xl overflow-hidden
                 border border-brand-500/25
                 bg-gradient-to-b from-brand-500/[0.08] to-brand-500/[0.03]
                 shadow-[0_0_60px_-20px_rgba(0,229,255,0.35),inset_0_1px_0_rgba(0,229,255,0.10)]">
      {/* Halo brand */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full
                      bg-brand-400/[0.12] blur-2xl pointer-events-none" />
      {/* Badge populaire */}
      <div className="absolute -top-px left-1/2 -translate-x-1/2 px-3 py-0.5
                      bg-brand-400 text-[#0A0A0B] text-[10px] font-bold rounded-b-lg">
        Recommandé
      </div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-brand-400 mb-3 mt-3">{c.kicker}</div>
      <h3 className="text-base font-semibold text-slate-100 mb-6">{c.title}</h3>
      <ul className="space-y-3.5 flex-1">
        {c.items.map(it => (
          <li key={it.text} className="flex items-start gap-3">
            <span className="w-4 h-4 rounded flex items-center justify-center
                             bg-brand-500/20 border border-brand-500/30
                             text-brand-400 text-[10px] font-bold flex-shrink-0 mt-0.5">
              {it.icon}
            </span>
            <span className="text-sm text-slate-200 leading-snug">{it.text}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function GoodCard({ style }: { style?: object }) {
  const c = CARDS[2];
  return (
    <motion.div style={style as React.CSSProperties}
      className="relative flex flex-col p-7 rounded-2xl overflow-hidden
                 border border-emerald-500/[0.15]
                 bg-gradient-to-b from-emerald-500/[0.06] to-emerald-500/[0.02]
                 shadow-[0_0_50px_-20px_rgba(52,211,153,0.25),inset_0_1px_0_rgba(52,211,153,0.08)]">
      {/* Halo emerald */}
      <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full
                      bg-emerald-500/[0.07] blur-3xl pointer-events-none" />
      <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400/70 mb-3">{c.kicker}</div>
      <h3 className="text-base font-semibold text-slate-100 mb-6">{c.title}</h3>
      <div className="grid grid-cols-2 gap-3 flex-1 content-start">
        {c.metrics.map(m => (
          <div key={m.value}
            className="flex flex-col gap-1 p-3.5 rounded-xl
                       bg-emerald-500/[0.06] border border-emerald-500/[0.10]">
            <span className="text-2xl font-bold text-emerald-300 font-mono leading-none">{m.value}</span>
            <span className="text-[11px] text-slate-500 leading-tight">{m.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Section principale ────────────────────────────────────────────────────────
export default function ConstatSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const progress     = useElementScrollProgress(containerRef);

  // Révélations séquentielles
  const y0 = useTransform(progress, [0.02, 0.14], [48, 0]);
  const o0 = useTransform(progress, [0.02, 0.14], [0,  1]);

  const y1 = useTransform(progress, [0.32, 0.46], [48, 0]);
  const o1 = useTransform(progress, [0.32, 0.46], [0,  1]);

  const y2 = useTransform(progress, [0.60, 0.74], [48, 0]);
  const o2 = useTransform(progress, [0.60, 0.74], [0,  1]);

  // Largeur de la barre de progression
  const barW = useTransform(progress, [0, 1], ["0%", "100%"]);

  return (
    <section id="produit" className="px-5 sm:px-6">

      {/* ── Desktop : scroll-pinned ─────────────────────────────────── */}
      <div ref={containerRef} className="hidden md:block h-[320vh] relative">
        <div className="sticky top-0 h-screen flex flex-col justify-center py-20">
          <div className="max-w-5xl mx-auto w-full">

            {/* Titre */}
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                               border border-white/[0.08] bg-white/[0.025]
                               text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-5">
                §02 — Le constat
              </span>
              <h2 className="mt-4 text-3xl sm:text-5xl font-bold text-slate-50
                             tracking-[-0.02em] leading-tight">
                Le tableur ne t&apos;a jamais<br />rappelé un seul client.
              </h2>
              {/* Barre de progression scroll */}
              <div className="mt-8 mx-auto max-w-xs h-px bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-red-500/40 via-brand-400 to-emerald-400 rounded-full"
                  style={{ width: barW }} />
              </div>
              <p className="text-[11px] text-slate-700 font-mono mt-2">↓ Défilez pour révéler</p>
            </div>

            {/* Grille 3 colonnes */}
            <div className="grid md:grid-cols-3 gap-5">
              <BadCard  style={{ opacity: o0, y: y0 }} />
              <MidCard  style={{ opacity: o1, y: y1 }} />
              <GoodCard style={{ opacity: o2, y: y2 }} />
            </div>

          </div>
        </div>
      </div>

      {/* ── Mobile : layout statique ────────────────────────────────── */}
      <div className="md:hidden py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                             border border-white/[0.08] bg-white/[0.025]
                             text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-5">
              §02 — Le constat
            </span>
            <h2 className="mt-4 text-3xl font-bold text-slate-50 tracking-[-0.02em] leading-tight">
              Le tableur ne t&apos;a jamais<br />rappelé un seul client.
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            <BadCard />
            <MidCard />
            <GoodCard />
          </div>
        </div>
      </div>

    </section>
  );
}
