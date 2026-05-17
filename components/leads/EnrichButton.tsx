"use client";

import { useState } from "react";
import { Lead } from "./types";
import type { PlanTier } from "@/lib/plan";

function key(l: Lead) { return `${l.nom}|${l.telephone}`.toLowerCase(); }

interface Props {
  leads: Lead[];
  onEnriched: () => void;
  plan?: PlanTier;
}

export default function EnrichButton({ leads, onEnriched, plan = "free" }: Props) {
  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0, enriched: 0 });

  // Leads sans tÃ©lÃ©phone (Ã  enrichir)
  const toEnrich = leads.filter(l => !l.telephone);

  if (toEnrich.length === 0) return null;

  // Plan free â†’ ne pas afficher le bouton (feature Pro+)
  if (plan === "free") return null;

  async function run() {
    setState("running");
    const keys  = toEnrich.map(key);
    const total = keys.length;
    setProgress({ done: 0, total, enriched: 0 });

    // Envoie en batch de 5 pour avoir un retour progressif
    const BATCH = 5;
    let totalEnriched = 0;

    for (let i = 0; i < keys.length; i += BATCH) {
      const batch = keys.slice(i, i + BATCH);
      try {
        const res  = await fetch("/api/enrich", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keys: batch }),
        });
        const data = await res.json();
        totalEnriched += data.enriched || 0;
      } catch { /* continue */ }

      setProgress({ done: Math.min(i + BATCH, total), total, enriched: totalEnriched });
    }

    setState("done");
    onEnriched();
    setTimeout(() => setState("idle"), 3000);
  }

  if (state === "running") {
    const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
    return (
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1">
          <div className="h-1.5 w-36 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="mono text-xs text-slate-500">
            {progress.done}/{progress.total} Â· {progress.enriched} enrichi(s)
          </span>
        </div>
      </div>
    );
  }

  if (state === "done") {
    return (
      <span className="text-xs text-green-400 mono">
        âœ“ {progress.enriched} lead(s) enrichi(s)
      </span>
    );
  }

  return (
    <button
      onClick={run}
      title={`${toEnrich.length} lead(s) sans tÃ©lÃ©phone â€” enrichir via Google Maps`}
      className="flex items-center gap-1.5 h-7 px-3 rounded-md bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-600/30 text-xs font-medium transition-colors"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
      </svg>
      Enrichir {toEnrich.length} lead{toEnrich.length > 1 ? "s" : ""}
    </button>
  );
}

