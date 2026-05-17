"use client";

/**
 * components/landing/ConstatSection.tsx
 * §02 — "Le constat" — section scroll-pinned.
 *
 * Desktop (md+) : container 300vh, inner sticky top-0.
 *   Les 3 colonnes (Avant / Avec Prospeo / Le résultat) se révèlent
 *   progressivement au scroll via useScroll + useTransform.
 *
 * Mobile : layout statique empilé (pas de sticky) — même rendu sans
 *   le scroll-driven pour eviter les frictions tactiles.
 */

import { useRef }                                    from "react";
import { motion, useScroll, useTransform, MotionStyle } from "framer-motion";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Column {
  t:     string;
  tone:  "bad" | "mid" | "good";
  items: string[];
}

// ─── Données ───────────────────────────────────────────────────────────────────
const COLUMNS: Column[] = [
  {
    t:     "Avant",
    tone:  "bad",
    items: [
      "Leads éparpillés dans Excel",
      "Scripts sur un bout de papier",
      "Rappels oubliés systématiquement",
      "Zéro visibilité sur la conversion",
    ],
  },
  {
    t:     "Avec Prospeo",
    tone:  "mid",
    items: [
      "Sourcing auto Maps + INPI",
      "Téléprompter en direct d'appel",
      "Rappels visuels + alertes auto",
      "Funnel temps réel",
    ],
  },
  {
    t:     "Le résultat",
    tone:  "good",
    items: [
      "2× plus de leads qualifiés",
      "Meilleur taux de closing",
      "0 relance oubliée",
      "Décisions basées sur les données",
    ],
  },
];

// ─── SVG helpers ───────────────────────────────────────────────────────────────
function CheckIcon({ tone }: { tone: Column["tone"] }) {
  return tone === "bad"
    ? <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-700" viewBox="0 0 12 12" fill="none">
        <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    : <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-brand-400" viewBox="0 0 12 12" fill="none">
        <path d="M1.5 6l3.5 3.5 5.5-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>;
}

// ─── Carte individuelle ────────────────────────────────────────────────────────
function Card({ c, style }: { c: Column; style?: MotionStyle }) {
  return (
    <motion.div
      style={style}
      className={`p-7 rounded-2xl border backdrop-blur-sm
        ${c.tone === "bad"
          ? "border-white/[0.06] bg-white/[0.02]"
          : c.tone === "mid"
          ? "border-brand-500/20 bg-brand-500/[0.05] shadow-[0_0_60px_-20px_rgba(0,229,255,0.45)]"
          : "border-brand-400/20 bg-brand-500/[0.04]"}`}
    >
      <div className={`text-[10px] font-mono uppercase tracking-widest mb-5
        ${c.tone === "bad" ? "text-slate-600" : c.tone === "mid" ? "text-brand-300" : "text-brand-400"}`}>
        {c.t}
      </div>
      <ul className="space-y-3">
        {c.items.map(it => (
          <li key={it} className={`flex items-start gap-2.5 text-sm
            ${c.tone === "bad" ? "text-slate-500" : "text-slate-300"}`}>
            <CheckIcon tone={c.tone} />
            {it}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// ─── Section principale ────────────────────────────────────────────────────────
export default function ConstatSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target:  containerRef,
    offset:  ["start start", "end end"],
  });

  // Carte 0 : apparaît immédiatement
  const y0 = useTransform(scrollYProgress, [0, 0.12], [50, 0]);
  const o0 = useTransform(scrollYProgress, [0,    0.12], [0,  1]);

  // Carte 1 : révélation entre 30-45% du scroll de la section
  const y1 = useTransform(scrollYProgress, [0.28, 0.42], [50, 0]);
  const o1 = useTransform(scrollYProgress, [0.28, 0.42], [0,  1]);

  // Carte 2 : révélation entre 58-72% du scroll de la section
  const y2 = useTransform(scrollYProgress, [0.56, 0.70], [50, 0]);
  const o2 = useTransform(scrollYProgress, [0.56, 0.70], [0,  1]);

  const motionStyles = [
    { opacity: o0, y: y0 },
    { opacity: o1, y: y1 },
    { opacity: o2, y: y2 },
  ];

  return (
    <section id="produit" className="px-5 sm:px-6">

      {/* ── Desktop : scroll-pinned (300vh) ── */}
      <div
        ref={containerRef}
        className="hidden md:block h-[300vh] relative"
      >
        <div className="sticky top-0 h-screen flex flex-col justify-center py-24">
          <div className="max-w-5xl mx-auto w-full">

            {/* Titre */}
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                              border border-white/[0.08] bg-white/[0.03] mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                  §02 — Le constat
                </span>
              </div>
              <h2 className="mt-4 text-3xl sm:text-5xl font-bold text-slate-50
                             tracking-[-0.02em] leading-tight">
                Le tableur ne t&apos;a jamais<br />rappelé un seul client.
              </h2>
            </div>

            {/* Grille 3 colonnes avec révélation scroll */}
            <div className="grid md:grid-cols-3 gap-4">
              {COLUMNS.map((c, i) => (
                <Card key={c.t} c={c} style={motionStyles[i]} />
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* ── Mobile : layout statique ── */}
      <div className="md:hidden py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                            border border-white/[0.08] bg-white/[0.03] mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                §02 — Le constat
              </span>
            </div>
            <h2 className="mt-4 text-3xl font-bold text-slate-50
                           tracking-[-0.02em] leading-tight">
              Le tableur ne t&apos;a jamais<br />rappelé un seul client.
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            {COLUMNS.map(c => <Card key={c.t} c={c} />)}
          </div>
        </div>
      </div>

    </section>
  );
}
