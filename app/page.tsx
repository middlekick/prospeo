"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import FilterPills      from "@/components/leads/FilterPills";
import LeadsTable       from "@/components/leads/LeadsTable";
import LeadDrawer       from "@/components/leads/LeadDrawer";
import ScrapeForm       from "@/components/leads/ScrapeForm";
import ImportCSV        from "@/components/leads/ImportCSV";
import StatsBar         from "@/components/leads/StatsBar";
import EnrichButton     from "@/components/leads/EnrichButton";
import OnboardingModal  from "@/components/ui/OnboardingModal";
import { Lead, TAGS, TagValue } from "@/components/leads/types";
import { usePlan } from "@/hooks/usePlan";

export default function LeadsPage() {
  const [leads,    setLeads]   = useState<Lead[]>([]);
  const [loading,  setLoading] = useState(true);
  const [filter,   setFilter]  = useState<TagValue>("tous");
  const [search,   setSearch]  = useState("");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { plan, loading: planLoading } = usePlan();

  // Afficher l'onboarding au 1er login (vérification localStorage)
  useEffect(() => {
    try {
      if (!localStorage.getItem("onboarding_done")) {
        setShowOnboarding(true);
      }
    } catch { /* ignore */ }
  }, []);

  const loadLeads = useCallback(async () => {
    try {
      const res  = await fetch("/api/leads");
      const data = await res.json();
      setLeads(data.artisans || []);
    } catch (e) {
      console.error("Erreur chargement leads", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const counts = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const c: Record<string, number> = {};
    for (const tag of TAGS.filter(t => t.value !== "tous" && t.value !== "rappels").map(t => t.value)) {
      c[tag] = leads.filter(l => l.tag === tag).length;
    }
    c.rappels = leads.filter(l => l.rappel && l.rappel <= today).length;
    return c;
  }, [leads]);

  const filtered = useMemo(() => {
    let list: Lead[];
    if (filter === "rappels") {
      const today = new Date().toISOString().slice(0, 10);
      list = leads.filter(l => l.rappel && l.rappel <= today);
    } else if (filter === "tous") {
      list = leads;
    } else {
      list = leads.filter(l => l.tag === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.nom.toLowerCase().includes(q) ||
        l.metier.toLowerCase().includes(q) ||
        l.emplacement.toLowerCase().includes(q) ||
        l.telephone.includes(q)
      );
    }
    return list;
  }, [leads, filter, search]);

  function handleSaved(updated: Lead) {
    setLeads(prev => prev.map(l =>
      l.nom === updated.nom && l.telephone === updated.telephone ? updated : l
    ));
    setSelected(null);
  }

  function handleDeleted(del: Lead) {
    setLeads(prev => prev.filter(l =>
      !(l.nom === del.nom && l.telephone === del.telephone)
    ));
    setSelected(null);
  }

  // Changement de tag depuis la table (sans ouvrir le drawer)
  function handleTagChange(lead: Lead, tag: string) {
    setLeads(prev => prev.map(l =>
      l.nom === lead.nom && l.telephone === lead.telephone ? { ...l, tag } : l
    ));
  }

  function exportCSV() {
    const cols: (keyof Lead)[] = ["nom", "metier", "telephone", "site", "emplacement", "pays", "tag", "rappel", "note"];
    const header = cols.join(";");
    const rows   = leads.map(l => cols.map(c => `"${String(l[c] ?? "").replace(/"/g, '""')}"`).join(";"));
    const blob   = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement("a");
    a.href = url; a.download = "prospo_leads.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const rappelsDus  = counts.rappels ?? 0;
  const isFreeUser  = !loading && !planLoading && plan === "free";
  const leadsLeft   = isFreeUser ? Math.max(0, 100 - leads.length) : null;

  return (
    <div className="flex flex-col h-screen">
      {/* Ligne gradient haut de page */}
      <div className="h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent shrink-0" />

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] shrink-0 bg-[#0c0e15]/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-slate-100 tracking-tight">Leads</h1>
          {/* Badge limite Free */}
          {isFreeUser && leadsLeft !== null && (
            <a href="/landing#pricing"
              className={[
                "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border transition-colors",
                leadsLeft === 0
                  ? "bg-red-500/10 border-red-500/25 text-red-400 hover:bg-red-500/20"
                  : leadsLeft <= 20
                  ? "bg-amber-500/10 border-amber-500/25 text-amber-400 hover:bg-amber-500/20"
                  : "bg-white/[0.04] border-white/[0.08] text-slate-600 hover:text-slate-400",
              ].join(" ")}
              title={leadsLeft === 0 ? "Limite atteinte — passez Pro pour des leads illimités" : "Plan Free — 100 leads max"}
            >
              {leads.length}/100 leads
            </a>
          )}
          {rappelsDus > 0 && (
            <button onClick={() => setFilter("rappels")}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {rappelsDus} rappel{rappelsDus > 1 ? "s" : ""}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <EnrichButton leads={leads} onEnriched={loadLeads} plan={plan} />
          {/* Import — réservé Pro+ (show full button while plan loads to avoid flash) */}
          {planLoading || plan === "pro" || plan === "agency" ? (
            <button onClick={() => setShowImport(true)}
              className="h-7 px-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-xs text-slate-400 hover:text-slate-200 transition-all">
              ↑ Import
            </button>
          ) : (
            <a href="/landing#pricing" title="Importer un CSV — réservé Pro"
              className="h-7 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-700 flex items-center gap-1 cursor-pointer hover:text-slate-500 transition-colors">
              🔒 Import
            </a>
          )}
          {/* Export — réservé Pro+ */}
          {planLoading || plan === "pro" || plan === "agency" ? (
            <button onClick={exportCSV}
              className="h-7 px-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-xs text-slate-400 hover:text-slate-200 transition-all">
              ↓ Export
            </button>
          ) : (
            <a href="/landing#pricing" title="Exporter en CSV — réservé Pro"
              className="h-7 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-700 flex items-center gap-1 cursor-pointer hover:text-slate-500 transition-colors">
              🔒 Export
            </a>
          )}
        </div>
      </header>

      {/* Stats */}
      {!loading && <StatsBar leads={leads} />}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-2.5 border-b border-white/[0.06] shrink-0">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="h-8 pl-8 pr-3 rounded-lg bg-white/[0.05] border border-white/[0.09] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.07] transition-all w-48"
          />
        </div>
        <FilterPills active={filter} counts={counts} onChange={setFilter} />
      </div>

      {/* Zone scraping */}
      <div className="px-5 py-3 border-b border-white/[0.06] shrink-0 bg-white/[0.015]">
        <ScrapeForm onDone={loadLeads} />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-700">
            <div className="w-6 h-6 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
            <span className="text-xs">Chargement des leads…</span>
          </div>
        ) : (
          <LeadsTable leads={filtered} onOpen={setSelected} onTagChange={handleTagChange} />
        )}
      </div>

      <LeadDrawer
        lead={selected}
        onClose={() => setSelected(null)}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />

      {showImport && (
        <ImportCSV
          onClose={() => setShowImport(false)}
          onImported={() => { setShowImport(false); loadLeads(); }}
        />
      )}

      {/* Modal onboarding — affiché au 1er login uniquement */}
      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}
