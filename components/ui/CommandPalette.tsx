"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────

interface NavItem {
  id:    string;
  label: string;
  hint:  string;
  icon:  string;
  href:  string;
}

interface LeadLite {
  nom:         string;
  metier:      string;
  telephone:   string;
  emplacement: string;
}

// Pages navigables
const NAV: NavItem[] = [
  { id: "leads",      label: "Leads",          hint: "Gestion des prospects",      icon: "👥", href: "/app" },
  { id: "dashboard",  label: "Tableau de bord", hint: "Métriques & funnel",         icon: "📊", href: "/app/dashboard" },
  { id: "inpi",       label: "Recherche INPI",  hint: "Sourcing entreprises",       icon: "🏛️", href: "/app/inpi" },
  { id: "scripts",    label: "Scripts",         hint: "Téléprompter d'appel",       icon: "📜", href: "/app/scripts" },
  { id: "autoscrape", label: "Auto-scraping",   hint: "Leads automatiques",         icon: "⚡", href: "/app/auto-scrape" },
];

export default function CommandPalette() {
  const router = useRouter();
  const [open,   setOpen]   = useState(false);
  const [query,  setQuery]  = useState("");
  const [active, setActive] = useState(0);
  const [leads,  setLeads]  = useState<LeadLite[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ouverture via Cmd+K / Ctrl+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Charger les leads (1 fois à la 1ère ouverture)
  useEffect(() => {
    if (open && leads.length === 0) {
      fetch("/api/leads")
        .then(r => r.json())
        .then(d => setLeads((d.artisans || []).map((l: LeadLite) => ({
          nom: l.nom, metier: l.metier, telephone: l.telephone, emplacement: l.emplacement,
        }))))
        .catch(() => { /* silencieux */ });
    }
  }, [open, leads.length]);

  // Reset à l'ouverture
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Résultats filtrés
  const { navResults, leadResults } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const nav = q
      ? NAV.filter(n => n.label.toLowerCase().includes(q) || n.hint.toLowerCase().includes(q))
      : NAV;
    const lds = q
      ? leads.filter(l =>
          l.nom.toLowerCase().includes(q) ||
          l.metier.toLowerCase().includes(q) ||
          l.emplacement.toLowerCase().includes(q) ||
          l.telephone.includes(q)
        ).slice(0, 6)
      : [];
    return { navResults: nav, leadResults: lds };
  }, [query, leads]);

  const flatCount = navResults.length + leadResults.length;

  const runItem = useCallback((globalIdx: number) => {
    if (globalIdx < navResults.length) {
      router.push(navResults[globalIdx].href);
    } else {
      // Lead → page principale (la recherche reprend le contexte)
      router.push("/app");
    }
    setOpen(false);
  }, [navResults, router]);

  // Navigation clavier dans la liste
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, flatCount - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
      if (e.key === "Enter")     { e.preventDefault(); if (flatCount > 0) runItem(active); }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, flatCount, active, runItem]);

  useEffect(() => { setActive(0); }, [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl bg-[#15171f] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Champ de recherche */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-600">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher une page ou un lead…"
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
          />
          <kbd className="text-[10px] text-slate-700 bg-white/[0.05] border border-white/[0.08] rounded px-1.5 py-0.5">Échap</kbd>
        </div>

        {/* Résultats */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {flatCount === 0 ? (
            <div className="py-10 text-center text-sm text-slate-600">Aucun résultat</div>
          ) : (
            <>
              {navResults.length > 0 && (
                <div className="mb-1">
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">Navigation</p>
                  {navResults.map((n, i) => (
                    <button
                      key={n.id}
                      onClick={() => runItem(i)}
                      onMouseEnter={() => setActive(i)}
                      className={[
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors",
                        active === i ? "bg-violet-500/15" : "hover:bg-white/[0.04]",
                      ].join(" ")}
                    >
                      <span className="text-base w-6 text-center">{n.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm ${active === i ? "text-violet-200" : "text-slate-300"}`}>{n.label}</div>
                        <div className="text-xs text-slate-600">{n.hint}</div>
                      </div>
                      {active === i && <span className="text-xs text-violet-400">↵</span>}
                    </button>
                  ))}
                </div>
              )}

              {leadResults.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">Leads</p>
                  {leadResults.map((l, i) => {
                    const gi = navResults.length + i;
                    return (
                      <button
                        key={`${l.nom}-${l.telephone}-${i}`}
                        onClick={() => runItem(gi)}
                        onMouseEnter={() => setActive(gi)}
                        className={[
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors",
                          active === gi ? "bg-violet-500/15" : "hover:bg-white/[0.04]",
                        ].join(" ")}
                      >
                        <span className="w-6 text-center text-slate-600">·</span>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm truncate ${active === gi ? "text-violet-200" : "text-slate-300"}`}>{l.nom}</div>
                          <div className="text-xs text-slate-600 truncate">
                            {l.metier}{l.emplacement ? ` · ${l.emplacement}` : ""}
                          </div>
                        </div>
                        {l.telephone && <span className="text-xs mono text-slate-700 shrink-0">{l.telephone}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Pied */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/[0.06] text-[10px] text-slate-700">
          <span><kbd className="bg-white/[0.05] border border-white/[0.08] rounded px-1">↑↓</kbd> naviguer</span>
          <span><kbd className="bg-white/[0.05] border border-white/[0.08] rounded px-1">↵</kbd> ouvrir</span>
          <span className="ml-auto"><kbd className="bg-white/[0.05] border border-white/[0.08] rounded px-1">⌘K</kbd> ouvrir/fermer</span>
        </div>
      </div>
    </div>
  );
}
