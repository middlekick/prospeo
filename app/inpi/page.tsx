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
          href="/landing#pricing"
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
      {/* Ligne gradient haut */}
      <div className="h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent shrink-0" />

      {/* Bandeau d'enrichissement automatique */}
      {(enriching || enrichMsg) && (
        <div className="flex items-center gap-3 px-5 py-2 bg-cyan-500/[0.06] border-b border-cyan-500/15 shrink-0">
          {enriching ? (
            <>
              <div className="h-1 w-32 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                  style={{ width: `${enrichPct}%` }}
                />
              </div>
              <span className="text-xs text-cyan-400/70">
                Enrichissement en cours — recherche des numéros via Google Maps…
              </span>
            </>
          ) : (
            <span className={`text-xs mono ${enrichMsg.startsWith("✓") ? "text-green-400" : "text-slate-500"}`}>
              {enrichMsg}
            </span>
          )}
        </div>
      )}
      <INPISearch onAddLeads={handleAddLeads} />
    </div>
  );
}
