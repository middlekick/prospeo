"use client";

import { useState, useCallback } from "react";
import Link                       from "next/link";
import INPISearch                 from "@/components/inpi/INPISearch";
import { usePlan }                from "@/hooks/usePlan";

export default function INPIPage() {
  const [enriching, setEnriching] = useState(false);
  const [enrichMsg, setEnrichMsg] = useState("");
  const [enrichPct, setEnrichPct] = useState(0);

  const { plan, loading: planLoading } = usePlan();
  const isLocked = !planLoading && plan === "free";

  // Déclenché automatiquement dès qu'un import INPI arrive
  const handleAddLeads = useCallback(async (leads: Record<string, unknown>[]) => {
    if (!leads.length) return;
    setEnriching(true);
    setEnrichMsg("");
    setEnrichPct(0);

    // Recharge les leads depuis le serveur pour avoir les clés exactes
    const res      = await fetch("/api/leads");
    const data     = await res.json();
    const allLeads = (data.artisans || []) as Array<{ nom: string; telephone: string }>;

    // Cible uniquement les leads qui viennent d'être importés et n'ont pas de numéro
    const toEnrich = allLeads
      .filter(l => !l.telephone)
      .filter(l => leads.some(i => String(i.nom) === l.nom))
      .map(l => `${l.nom}|${l.telephone}`.toLowerCase());

    if (!toEnrich.length) {
      setEnrichMsg("Aucun numéro à trouver.");
      setEnriching(false);
      return;
    }

    // Enrichissement par batch de 5 pour avoir un retour progressif
    const BATCH = 5;
    let enriched = 0;

    for (let i = 0; i < toEnrich.length; i += BATCH) {
      const batch = toEnrich.slice(i, i + BATCH);
      try {
        const r = await fetch("/api/enrich", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keys: batch }),
        });
        const d = await r.json();
        enriched += d.enriched || 0;
      } catch { /* continue */ }
      setEnrichPct(Math.round(((i + BATCH) / toEnrich.length) * 100));
    }

    setEnrichMsg(`✓ ${enriched}/${toEnrich.length} numéros trouvés`);
    setEnriching(false);
  }, []);

  // ── Plan free : page de verrouillage ─────────────────────────────────────
  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-5 px-6">
        <div className="relative w-18 h-18 flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-3xl z-10 relative">🏛️</div>
          <div className="absolute inset-0 rounded-2xl bg-violet-500/10 blur-xl" />
        </div>
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-slate-100 mb-2">Recherche INPI</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            L&apos;accès à la base INPI / RNE est réservé au plan <span className="text-violet-300 font-medium">Pro</span>.
            Trouvez des entreprises récemment créées par département, secteur et ancienneté.
          </p>
        </div>
        <Link
          href="/#pricing"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shadow-[0_0_20px_rgba(124,58,237,0.3)]"
        >
          Passer Pro — 19 €/mois →
        </Link>
        <p className="text-xs text-slate-700">14 jours gratuits · annulable à tout moment</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Trait de lumière haut */}
      <div className="h-px bg-gradient-to-r from-transparent via-violet-500/25 to-transparent shrink-0" />

      {/* Header INPI */}
      <header className="flex items-center justify-between gap-3 pl-14 md:pl-5 pr-5 py-3 border-b border-white/[0.05] shrink-0 bg-[#080b12]/70 backdrop-blur-md">
        <div>
          <h1 className="text-[13px] font-semibold text-slate-200 tracking-tight">INPI / RNE</h1>
          <p className="text-[11px] text-slate-600 mt-0.5">Base nationale des entreprises — Registre National des Entreprises</p>
        </div>
        {/* Chips capacités */}
        <div className="hidden md:flex items-center gap-2">
          {[
            { label: "Dpt. & NAF", color: "text-cyan-400 bg-cyan-500/[0.07] border-cyan-500/[0.15]" },
            { label: "Artisans RM", color: "text-violet-400 bg-violet-500/[0.07] border-violet-500/[0.15]" },
            { label: "Auto-enrichissement", color: "text-emerald-400 bg-emerald-500/[0.07] border-emerald-500/[0.15]" },
          ].map(c => (
            <span key={c.label} className={`text-[10px] font-medium px-2.5 py-1 rounded-full border font-mono ${c.color}`}>
              {c.label}
            </span>
          ))}
        </div>
      </header>

      {/* Bandeau d'enrichissement automatique */}
      {(enriching || enrichMsg) && (
        <div className="flex items-center gap-3 px-5 py-2.5 bg-cyan-500/[0.05] border-b border-cyan-500/[0.12] shrink-0">
          {enriching ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400 animate-spin shrink-0"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              <div className="h-1.5 w-36 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-300"
                  style={{ width: `${enrichPct}%` }}
                />
              </div>
              <span className="text-[12px] text-cyan-400/70">
                Enrichissement en cours — {enrichPct}% — recherche des numéros via Google Maps…
              </span>
            </>
          ) : (
            <span className={`text-[12px] font-mono ${enrichMsg.startsWith("✓") ? "text-emerald-400" : "text-slate-500"}`}>
              {enrichMsg}
            </span>
          )}
        </div>
      )}

      <INPISearch onAddLeads={handleAddLeads} />
    </div>
  );
}
