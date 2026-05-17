"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import FilterPills      from "@/components/leads/FilterPills";
import LeadsTable       from "@/components/leads/LeadsTable";
import KanbanView       from "@/components/leads/KanbanView";
import LeadDrawer       from "@/components/leads/LeadDrawer";
import CallSession      from "@/components/leads/CallSession";
import ScrapeForm       from "@/components/leads/ScrapeForm";
import ImportCSV        from "@/components/leads/ImportCSV";
import StatsBar         from "@/components/leads/StatsBar";
import EnrichButton     from "@/components/leads/EnrichButton";
import OnboardingModal  from "@/components/ui/OnboardingModal";
import { Lead, TAGS, TagValue, TAG_OPTIONS, TAG_LABEL } from "@/components/leads/types";
import { usePlan } from "@/hooks/usePlan";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmModal";

type ViewMode = "table" | "kanban";

// ── Skeleton de chargement ────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="divide-y divide-white/[0.04] animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <div className="w-2 h-2 rounded-full bg-white/[0.06] shrink-0" />
          <div className="w-[200px] h-3.5 bg-white/[0.06] rounded-md" />
          <div className="w-[120px] h-3 bg-white/[0.04] rounded-md" />
          <div className="w-[120px] h-3 bg-white/[0.04] rounded-md" />
          <div className="flex-1 h-3 bg-white/[0.03] rounded-md hidden xl:block" />
          <div className="w-[80px] h-5 bg-white/[0.06] rounded-full" />
          <div className="w-[70px] h-3 bg-white/[0.03] rounded-md" />
        </div>
      ))}
    </div>
  );
}

// ── Barre d'actions en masse ──────────────────────────────────────────────────

interface BulkBarProps {
  count: number;
  onClear: () => void;
  onBulkTag: (tag: string) => void;
  onBulkDelete: () => void;
  loading: boolean;
}

function BulkBar({ count, onClear, onBulkTag, onBulkDelete, loading }: BulkBarProps) {
  const [showTags, setShowTags] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowTags(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 md:px-4 py-2.5 bg-[#1a1d2e] border border-violet-500/30 rounded-2xl shadow-2xl shadow-violet-900/20 max-w-[calc(100vw-1.5rem)] overflow-x-auto">
      <span className="text-xs font-semibold text-violet-300">{count} sélectionné{count > 1 ? "s" : ""}</span>
      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* Changer le statut */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setShowTags(v => !v)}
          disabled={loading}
          className="h-7 px-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs text-slate-300 transition-all flex items-center gap-1.5 disabled:opacity-40"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          Changer statut
        </button>
        {showTags && (
          <div className="absolute bottom-full mb-2 left-0 bg-[#181b26] border border-white/12 rounded-xl shadow-2xl p-1.5 min-w-[160px]">
            {TAG_OPTIONS.map(o => (
              <button
                key={o.value}
                onClick={() => { setShowTags(false); onBulkTag(o.value); }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
              >
                {TAG_LABEL[o.value]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Supprimer */}
      <button
        onClick={onBulkDelete}
        disabled={loading}
        className="h-7 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs text-red-400 transition-all flex items-center gap-1.5 disabled:opacity-40"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        Supprimer
      </button>

      {/* Annuler */}
      <button
        onClick={onClear}
        className="h-7 px-2 rounded-lg hover:bg-white/[0.05] text-slate-600 hover:text-slate-400 text-xs transition-all"
      >
        ✕
      </button>

      {loading && <div className="w-3.5 h-3.5 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [leads,        setLeads]        = useState<Lead[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState<TagValue>("tous");
  const [search,       setSearch]       = useState("");
  const [selected,     setSelected]     = useState<Lead | null>(null);
  const [showImport,   setShowImport]   = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [viewMode,     setViewMode]     = useState<ViewMode>("table");
  const [callSession,  setCallSession]  = useState<Lead[] | null>(null);
  // Sélection multiple
  const [selSet,       setSelSet]       = useState<Set<string>>(new Set());
  const [bulkLoading,  setBulkLoading]  = useState(false);

  const { plan, loading: planLoading } = usePlan();
  const { success, error: toastError, warning } = useToast();
  const confirm = useConfirm();

  // Afficher l'onboarding au 1er login
  useEffect(() => {
    try { if (!localStorage.getItem("onboarding_done")) setShowOnboarding(true); } catch { /* ignore */ }
  }, []);

  const loadLeads = useCallback(async () => {
    try {
      const res  = await fetch("/api/leads");
      const data = await res.json();
      setLeads(data.artisans || []);
    } catch (e) {
      console.error("[leads] Erreur chargement", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  // ── Raccourcis clavier ──────────────────────────────────────────────────────
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      const inInput = ["INPUT", "TEXTAREA", "SELECT"].includes(tag);

      if (e.key === "Escape") {
        if (selected) { setSelected(null); return; }
        if (selSet.size > 0) { setSelSet(new Set()); return; }
        if (search) setSearch("");
      }
      if (inInput) return;

      if (e.key === "k" && !e.ctrlKey && !e.metaKey) {
        setViewMode(v => v === "table" ? "kanban" : "table");
      }
      // "/" pour focus la barre de recherche
      if (e.key === "/") {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, selSet, search]);

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

  function handleTagChange(lead: Lead, tag: string) {
    setLeads(prev => prev.map(l =>
      l.nom === lead.nom && l.telephone === lead.telephone ? { ...l, tag } : l
    ));
  }

  // Lance une session d'appels : priorité aux non-appelés de la liste filtrée,
  // sinon toute la liste filtrée actuelle (respecte la recherche + le filtre)
  function startCallSession() {
    const nonAppeles = filtered.filter(l => l.tag === "non_appele");
    const pool = nonAppeles.length > 0 ? nonAppeles : filtered;
    if (pool.length === 0) {
      warning("Aucun lead à appeler dans cette vue");
      return;
    }
    setSelected(null);
    setCallSession(pool);
  }

  // Mise à jour optimiste pendant la session (sans fermer le flux)
  function handleSessionUpdate(lead: Lead, tag: string) {
    setLeads(prev => prev.map(l =>
      l.nom === lead.nom && l.telephone === lead.telephone
        ? { ...l, tag, contacted_at: l.contacted_at || new Date().toISOString().slice(0, 10) }
        : l
    ));
  }

  // ── Sélection multiple ──────────────────────────────────────────────────────

  function toggleSelect(key: string) {
    setSelSet(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function clearSelection() { setSelSet(new Set()); }

  async function handleBulkTag(tag: string) {
    if (selSet.size === 0) return;
    setBulkLoading(true);
    // Mise à jour optimiste
    setLeads(prev => prev.map(l => selSet.has(`${l.nom}|${l.telephone}`) ? { ...l, tag } : l));
    try {
      const selectedLeads = leads.filter(l => selSet.has(`${l.nom}|${l.telephone}`));
      await Promise.all(selectedLeads.map(l =>
        fetch("/api/leads/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...l, tag }),
        })
      ));
      success(`${selSet.size} lead${selSet.size > 1 ? "s" : ""} mis à jour → ${TAG_LABEL[tag]}`);
      clearSelection();
    } catch {
      toastError("Erreur lors de la mise à jour en masse");
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selSet.size === 0) return;
    const ok = await confirm({
      title:        `Supprimer ${selSet.size} lead${selSet.size > 1 ? "s" : ""} ?`,
      message:      "Cette action est irréversible.",
      confirmLabel: "Supprimer",
      danger:       true,
    });
    if (!ok) return;
    setBulkLoading(true);
    try {
      const selectedLeads = leads.filter(l => selSet.has(`${l.nom}|${l.telephone}`));
      await Promise.all(selectedLeads.map(l =>
        fetch("/api/leads/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nom: l.nom, telephone: l.telephone }),
        })
      ));
      setLeads(prev => prev.filter(l => !selSet.has(`${l.nom}|${l.telephone}`)));
      warning(`${selSet.size} lead${selSet.size > 1 ? "s" : ""} supprimé${selSet.size > 1 ? "s" : ""}`);
      clearSelection();
    } catch {
      toastError("Erreur lors de la suppression en masse");
    } finally {
      setBulkLoading(false);
    }
  }

  function exportCSV() {
    const cols: (keyof Lead)[] = ["nom", "metier", "telephone", "site", "emplacement", "pays", "tag", "rappel", "note"];
    const header = cols.join(";");
    const rows   = leads.map(l => cols.map(c => `"${String(l[c] ?? "").replace(/"/g, '""')}"`).join(";"));
    const blob   = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement("a");
    a.href = url; a.download = "prospeo_leads.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const rappelsDus = counts.rappels ?? 0;
  const isFreeUser = !loading && !planLoading && plan === "free";
  const leadsLeft  = isFreeUser ? Math.max(0, 100 - leads.length) : null;

  return (
    <div className="flex flex-col h-screen">
      {/* Trait de lumière haut */}
      <div className="h-px bg-gradient-to-r from-transparent via-violet-500/25 to-transparent shrink-0" />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-2
                         pl-14 md:pl-5 pr-3 md:pr-5 py-3
                         border-b border-white/[0.05] shrink-0
                         bg-[#080b12]/70 backdrop-blur-md">
        {/* Titre + badges */}
        <div className="flex items-center gap-2.5 shrink-0">
          <h1 className="text-[13px] font-semibold text-slate-200 tracking-tight">Leads</h1>

          {isFreeUser && leadsLeft !== null && (
            <a
              href="/#pricing"
              title={leadsLeft === 0 ? "Limite atteinte — passez Pro" : "Plan Free — 100 leads max"}
              className={[
                "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors",
                leadsLeft === 0
                  ? "bg-red-500/10 border-red-500/25 text-red-400 hover:bg-red-500/20"
                  : leadsLeft <= 20
                  ? "bg-amber-500/10 border-amber-500/25 text-amber-400 hover:bg-amber-500/20"
                  : "bg-white/[0.03] border-white/[0.07] text-slate-600 hover:text-slate-400",
              ].join(" ")}
            >
              <span className="font-mono">{leads.length}</span>/100
            </a>
          )}

          {rappelsDus > 0 && (
            <button
              onClick={() => setFilter("rappels")}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full
                         bg-amber-500/[0.08] border border-amber-500/25 text-amber-400
                         text-[11px] font-medium hover:bg-amber-500/[0.15] transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              {rappelsDus} rappel{rappelsDus > 1 ? "s" : ""}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-0.5 md:pb-0">
          {/* Session d'appels */}
          <button
            onClick={startCallSession}
            title="Lancer une session d'appels enchaînés"
            className="h-7 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[12px] font-semibold
                       transition-all flex items-center gap-1.5 mr-1
                       shadow-[0_0_20px_rgba(124,58,237,0.22)] hover:shadow-[0_0_24px_rgba(124,58,237,0.35)]"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            Session d&apos;appels
          </button>

          {/* Toggle table / kanban */}
          <div className="flex items-center bg-white/[0.04] border border-white/[0.07] rounded-lg p-[3px] mr-1">
            <button
              onClick={() => setViewMode("table")}
              title="Vue table (K)"
              className={[
                "h-[22px] px-2 rounded-md text-xs transition-all flex items-center",
                viewMode === "table"
                  ? "bg-violet-500/[0.18] text-violet-300"
                  : "text-slate-600 hover:text-slate-400",
              ].join(" ")}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              title="Vue kanban (K)"
              className={[
                "h-[22px] px-2 rounded-md text-xs transition-all flex items-center",
                viewMode === "kanban"
                  ? "bg-violet-500/[0.18] text-violet-300"
                  : "text-slate-600 hover:text-slate-400",
              ].join(" ")}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="13" rx="1"/><rect x="17" y="3" width="5" height="9" rx="1"/>
              </svg>
            </button>
          </div>

          <EnrichButton leads={leads} onEnriched={loadLeads} plan={plan} />

          {planLoading || plan === "pro" || plan === "agency" ? (
            <button
              onClick={() => setShowImport(true)}
              className="h-7 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-[12px] text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1.5"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Import
            </button>
          ) : (
            <a
              href="/#pricing"
              title="Import CSV — réservé Pro"
              className="h-7 px-3 rounded-lg bg-white/[0.02] border border-white/[0.05] text-[12px] text-slate-700 flex items-center gap-1.5 cursor-pointer hover:text-slate-500 transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Import
            </a>
          )}

          {planLoading || plan === "pro" || plan === "agency" ? (
            <button onClick={exportCSV}
              className="h-7 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-[12px] text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export
            </button>
          ) : (
            <a
              href="/#pricing"
              title="Export CSV — réservé Pro"
              className="h-7 px-3 rounded-lg bg-white/[0.02] border border-white/[0.05] text-[12px] text-slate-700 flex items-center gap-1.5 cursor-pointer hover:text-slate-500 transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Export
            </a>
          )}
        </div>
      </header>

      {/* Stats */}
      {!loading && <StatsBar leads={leads} />}

      {/* ── Toolbar recherche + filtres ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2.5 px-5 py-2.5 border-b border-white/[0.05] shrink-0 bg-[#080b12]/30">
        {/* Barre de recherche */}
        <div className="relative w-full sm:w-56">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un lead…"
            id="search-input"
            className="h-8 pl-8 pr-3 rounded-xl bg-white/[0.04] border border-white/[0.07]
                       text-[13px] text-slate-200 placeholder:text-slate-600
                       focus:outline-none focus:border-violet-500/35 focus:bg-white/[0.06]
                       transition-all w-full"
          />
        </div>

        {/* Filtres */}
        <div className="w-full sm:w-auto overflow-x-auto">
          <FilterPills active={filter} counts={counts} onChange={setFilter} />
        </div>

        {/* Hints raccourcis */}
        <div className="ml-auto hidden lg:flex items-center gap-2 text-[10px] text-slate-700">
          <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.07] font-mono">/</kbd>
          <span className="mr-2">recherche</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.07] font-mono">K</kbd>
          <span className="mr-2">kanban</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.07] font-mono text-[9px]">Esc</kbd>
          <span>fermer</span>
        </div>
      </div>

      {/* ── Zone scraping ─────────────────────────────────────────────────────── */}
      <div className="px-5 py-3 border-b border-white/[0.05] shrink-0 bg-[#080b12]/20">
        <ScrapeForm onDone={loadLeads} />
      </div>

      {/* ── Zone principale (table ou kanban) ───────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <TableSkeleton />
        ) : viewMode === "kanban" ? (
          <KanbanView
            leads={filtered}
            onOpen={setSelected}
            onTagChange={handleTagChange}
          />
        ) : (
          <LeadsTable
            leads={filtered}
            onOpen={setSelected}
            onTagChange={handleTagChange}
            selected={selSet}
            onToggleSelect={toggleSelect}
            selectionMode={selSet.size > 0}
          />
        )}
      </div>

      {/* ── Drawer ──────────────────────────────────────────────────────────── */}
      <LeadDrawer
        lead={selected}
        onClose={() => setSelected(null)}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />

      {/* ── Barre bulk actions ───────────────────────────────────────────── */}
      {selSet.size > 0 && (
        <BulkBar
          count={selSet.size}
          onClear={clearSelection}
          onBulkTag={handleBulkTag}
          onBulkDelete={handleBulkDelete}
          loading={bulkLoading}
        />
      )}

      {showImport && (
        <ImportCSV
          onClose={() => setShowImport(false)}
          onImported={() => { setShowImport(false); loadLeads(); }}
        />
      )}

      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}

      {/* Mode Session d'appels — plein écran */}
      {callSession && (
        <CallSession
          leads={callSession}
          onClose={() => setCallSession(null)}
          onLeadUpdated={handleSessionUpdate}
        />
      )}
    </div>
  );
}
