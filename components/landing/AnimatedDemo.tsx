"use client";

import { useEffect, useRef, useState } from "react";

// ─── Données fictives ──────────────────────────────────────────────────────────
const LEADS = [
  { n: "Martin Plomberie",  tel: "06 12 34 56 78", ville: "Lyon 3e",  tag: "interesse" },
  { n: "Dupont & Fils",     tel: "06 98 76 54 32", ville: "Lyon 7e",  tag: "non_appele" },
  { n: "SAS Plomb Pro",     tel: "07 11 22 33 44", ville: "Lyon 2e",  tag: "non_appele" },
  { n: "Ferretti Réno",     tel: "06 55 66 77 88", ville: "Lyon 9e",  tag: "rdv" },
  { n: "Espace Sanitaire",  tel: "06 33 44 55 66", ville: "Lyon 6e",  tag: "non_appele" },
];

const INPI_RESULTS = [
  { siren: "823 456 789", nom: "MARTIN PLOMBERIE",   dir: "Martin J-P",  rm: true,  age: "2 mois"  },
  { siren: "912 345 678", nom: "EAU CONFORT SAS",    dir: "Lefebvre M.", rm: false, age: "5 mois"  },
  { siren: "734 567 890", nom: "DUPONT INSTALL PRO", dir: "Dupont A.",   rm: true,  age: "1 mois"  },
  { siren: "645 678 901", nom: "RHÔNE SANITAIRE",    dir: "Bernard L.",  rm: true,  age: "8 mois"  },
];

const KANBAN_COLS = [
  { id: "non_appele", label: "Non appelé", color: "text-slate-500",  count: 3 },
  { id: "interesse",  label: "Intéressé",  color: "text-emerald-400", count: 1 },
  { id: "rdv",        label: "RDV pris",   color: "text-violet-400",  count: 0 },
];

type Scene = "scraping" | "kanban" | "inpi" | "session" | "scripts";

// ─── Helpers visuels ──────────────────────────────────────────────────────────
function TagBadge({ tag }: { tag: string }) {
  const cls: Record<string, string> = {
    non_appele: "bg-slate-500/15  text-slate-400  border-slate-500/25",
    interesse:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    rdv:        "bg-violet-500/15  text-violet-400  border-violet-500/25",
  };
  const labels: Record<string, string> = {
    non_appele: "Non appelé", interesse: "Intéressé", rdv: "RDV pris",
  };
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium border ${cls[tag] ?? cls.non_appele}`}>
      {labels[tag] ?? tag}
    </span>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function AnimatedDemo({ forceScene }: { forceScene?: Scene } = {}) {
  const [scene,        setScene]        = useState<Scene>(forceScene ?? "scraping");
  const [fadingOut,    setFadingOut]    = useState(false);
  const [contentFade,  setContentFade]  = useState(true);

  // Scène Scraping
  const [metierText,   setMetierText]   = useState("");
  const [villeText,    setVilleText]    = useState("");
  const [scrapePhase,  setScrapePhase]  = useState<"typing"|"loading"|"table"|"drawer"|"tagged">("typing");
  const [visibleLeads, setVisibleLeads] = useState(0);
  const [leadTag,      setLeadTag]      = useState("non_appele");
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  // Scène Kanban
  const [kanbanPhase,  setKanbanPhase]  = useState<"show"|"drag"|"dropped">("show");
  const [movingCard,   setMovingCard]   = useState(false);

  // Scène INPI
  const [inpiText,      setInpiText]      = useState("");
  const [visibleInpi,   setVisibleInpi]   = useState(0);
  const [selectedInpi,  setSelectedInpi]  = useState<number[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);
  const [inpiPhase,     setInpiPhase]     = useState<"typing"|"loading"|"results"|"selecting"|"done">("typing");

  // Scène Session
  const [sessionPhase, setSessionPhase] = useState<"start"|"calling"|"result">("start");
  const [sessionCount, setSessionCount] = useState(0);

  // Scène Scripts
  const [scriptScroll,  setScriptScroll]  = useState(false);
  const [objectionOpen, setObjectionOpen] = useState(false);

  const sidebarIdx: Record<Scene, number> = {
    scraping: 0, kanban: 0, inpi: 2, session: 0, scripts: 3,
  };

  // ── Mode contrôlé : forceScene piloté depuis ScrollDemoSection ────────────
  const prevForceScene = useRef<Scene | undefined>(undefined);
  useEffect(() => {
    if (forceScene === undefined) return;
    if (forceScene === prevForceScene.current) return;
    prevForceScene.current = forceScene;
    setContentFade(false);
    const t = setTimeout(() => { setScene(forceScene); setContentFade(true); }, 260);
    return () => clearTimeout(t);
  }, [forceScene]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Transitions entre scènes ───────────────────────────────────────────────
  const switchScene = (next: Scene, delay: number) => {
    setTimeout(() => {
      setContentFade(false);
      setTimeout(() => {
        setScene(next);
        setContentFade(true);
      }, 380);
    }, delay);
  };

  // ── Orchestration ──────────────────────────────────────────────────────────
  useEffect(() => {
    let timers: ReturnType<typeof setTimeout>[] = [];
    let intervals: ReturnType<typeof setInterval>[] = [];
    const T  = (fn: () => void, ms: number) => { const t = setTimeout(fn, ms); timers.push(t); };
    const IV = (fn: () => void, ms: number) => { const i = setInterval(fn, ms); intervals.push(i); return i; };
    const clearAll = () => { timers.forEach(clearTimeout); intervals.forEach(clearInterval); };

    if (scene === "scraping") {
      // Reset
      setMetierText(""); setVilleText(""); setVisibleLeads(0);
      setLeadTag("non_appele"); setDrawerOpen(false);
      setShowActivity(false); setScrapePhase("typing");

      // Typing "Plombier"
      let i = 0; const word1 = "Plombier";
      const iv1 = IV(() => { i++; setMetierText(word1.slice(0, i)); if (i >= word1.length) { clearInterval(iv1); } }, 70);
      T(() => {
        let j = 0; const word2 = "Lyon";
        const iv2 = IV(() => { j++; setVilleText(word2.slice(0, j)); if (j >= word2.length) { clearInterval(iv2); } }, 70);
        T(() => {
          setScrapePhase("loading");
          T(() => {
            setScrapePhase("table");
            let k = 0;
            const iv3 = IV(() => { k++; setVisibleLeads(k); if (k >= LEADS.length) clearInterval(iv3); }, 200);
            T(() => {
              // Hover lead 1 → open drawer
              setScrapePhase("drawer");
              T(() => {
                setDrawerOpen(true);
                T(() => {
                  setLeadTag("interesse");
                  T(() => {
                    setShowActivity(true);
                    if (!forceScene) switchScene("kanban", 2800);
                  }, 900);
                }, 1400);
              }, 600);
            }, 1400);
          }, 1600);
        }, 900);
      }, 900);
    }

    if (scene === "kanban") {
      setKanbanPhase("show");
      setMovingCard(false);
      T(() => {
        setKanbanPhase("drag");
        T(() => {
          setMovingCard(true);
          T(() => {
            setKanbanPhase("dropped");
            if (!forceScene) switchScene("inpi", 2200);
          }, 700);
        }, 900);
      }, 1400);
    }

    if (scene === "inpi") {
      setInpiText(""); setVisibleInpi(0); setSelectedInpi([]);
      setImportSuccess(false); setInpiPhase("typing");

      let i = 0; const word = "plomberie";
      const iv = IV(() => { i++; setInpiText(word.slice(0, i)); if (i >= word.length) clearInterval(iv); }, 65);
      T(() => {
        setInpiPhase("loading");
        T(() => {
          setInpiPhase("results");
          let k = 0;
          const iv2 = IV(() => { k++; setVisibleInpi(k); if (k >= INPI_RESULTS.length) clearInterval(iv2); }, 180);
          T(() => {
            setInpiPhase("selecting");
            let s = 0;
            const iv3 = IV(() => {
              setSelectedInpi(prev => [...prev, s]); s++;
              if (s >= 3) clearInterval(iv3);
            }, 480);
            T(() => {
              setImportSuccess(true);
              if (!forceScene) switchScene("session", 2000);
            }, 2000);
          }, 1000);
        }, 1500);
      }, 1100);
    }

    if (scene === "session") {
      setSessionPhase("start"); setSessionCount(0);
      T(() => {
        setSessionPhase("calling"); setSessionCount(1);
        T(() => { setSessionCount(2); }, 400);
        T(() => { setSessionCount(3); }, 900);
        T(() => {
          setSessionPhase("result");
          if (!forceScene) switchScene("scripts", 2600);
        }, 2400);
      }, 700);
    }

    if (scene === "scripts") {
      setScriptScroll(false); setObjectionOpen(false);
      T(() => setScriptScroll(true), 600);
      T(() => setObjectionOpen(true), 3800);
      if (!forceScene) T(() => {
        // Fin du cycle → restart (autoplay uniquement)
        setFadingOut(true);
        setTimeout(() => {
          setFadingOut(false);
          setScene("scraping");
          setContentFade(true);
        }, 600);
      }, 7500);
    }

    return clearAll;
  }, [scene]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeNav = sidebarIdx[scene];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="relative w-full bg-[#0c0e15] overflow-hidden"
      style={{
        opacity: fadingOut ? 0 : 1,
        transition: "opacity 0.55s ease",
      }}
    >
      {/* Ligne gradient haut */}
      <div className="h-px bg-gradient-to-r from-transparent via-violet-500/50 to-cyan-500/30" />

      {/* ── Shell app interne ─────────────────────────────────────────────── */}
      <div className="flex" style={{ height: 360 }}>

        {/* Sidebar mini */}
        <div className="w-14 bg-[#080a0f] border-r border-white/[0.05] flex flex-col items-center py-3 gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center mb-1 shadow-[0_0_12px_rgba(124,58,237,0.4)]">
            <span className="text-white text-xs font-bold">P</span>
          </div>
          {[
            { ic: "◈", label: "Leads"     },
            { ic: "◊", label: "Dashboard" },
            { ic: "🏛", label: "INPI"     },
            { ic: "◎", label: "Scripts"   },
            { ic: "⚡", label: "Auto"     },
          ].map((item, i) => (
            <div key={i} title={item.label}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all duration-500 ${
                i === activeNav
                  ? "bg-violet-500/20 text-violet-400 shadow-[0_0_10px_rgba(124,58,237,0.25)]"
                  : "text-slate-700 hover:text-slate-500"
              }`}>
              {item.ic}
            </div>
          ))}
        </div>

        {/* Zone contenu */}
        <div className="flex-1 overflow-hidden relative"
             style={{ opacity: contentFade ? 1 : 0, transition: "opacity 0.35s ease" }}>

          {/* ════════════════════════════════════════════════════════════
              SCÈNE 1  Scraping + Table + Drawer
          ════════════════════════════════════════════════════════════ */}
          {scene === "scraping" && (
            <>
              {/* Formulaire */}
              {scrapePhase === "typing" || scrapePhase === "loading" ? (
                <div className="h-full flex flex-col justify-center items-center gap-5 px-10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-violet-400/80 uppercase tracking-widest">
                      Scraping Google Maps
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  </div>
                  <div className="w-full flex gap-3 max-w-sm">
                    <div className="flex-1">
                      <label className="block text-[9px] text-slate-600 mb-1 ml-1 uppercase tracking-wider">Métier</label>
                      <div className="px-3 py-2.5 bg-white/[0.04] border border-white/[0.10] rounded-lg text-xs text-slate-300 font-mono min-h-[34px] flex items-center">
                        {metierText}
                        {metierText.length < 8 && metierText.length > 0 && <span className="ml-px w-px h-3 bg-violet-400 inline-block animate-pulse" />}
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-[9px] text-slate-600 mb-1 ml-1 uppercase tracking-wider">Ville</label>
                      <div className="px-3 py-2.5 bg-white/[0.04] border border-white/[0.10] rounded-lg text-xs text-slate-300 font-mono min-h-[34px] flex items-center">
                        {villeText}
                        {villeText.length > 0 && villeText.length < 4 && <span className="ml-px w-px h-3 bg-violet-400 inline-block animate-pulse" />}
                      </div>
                    </div>
                  </div>
                  {scrapePhase === "loading" ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-7 h-7 rounded-full border-2 border-violet-500/25 border-t-violet-500 animate-spin" />
                      <span className="text-[10px] text-slate-600 font-mono">Recherche Maps en cours</span>
                    </div>
                  ) : (
                    <button className={`px-6 py-2 rounded-lg text-xs font-semibold transition-all ${
                      villeText.length > 0
                        ? "bg-violet-600 text-white shadow-[0_0_14px_rgba(124,58,237,0.4)]"
                        : "bg-white/[0.05] text-slate-600 border border-white/[0.08]"
                    }`}>
                      {villeText.length > 0 ? "Lancer →" : "Rechercher"}
                    </button>
                  )}
                </div>
              ) : (
                /* Table + Drawer */
                <div className="flex h-full relative">
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Stats bar */}
                    <div className="flex gap-2 px-3 pt-2.5 pb-2 flex-shrink-0">
                      {[
                        { l: "Total",       v: String(visibleLeads), c: "text-slate-200"   },
                        { l: "Intéressés",  v: leadTag === "interesse" ? "1" : "0", c: "text-emerald-400" },
                        { l: "RDV pris",    v: "1",                  c: "text-violet-400"  },
                        { l: "Rappels",     v: "0",                  c: "text-amber-400"   },
                      ].map(s => (
                        <div key={s.l} className="flex-1 bg-white/[0.04] rounded-lg px-2 py-1.5 border border-white/[0.06]">
                          <div className={`text-sm font-bold ${s.c}`}>{s.v}</div>
                          <div className="text-[8px] text-slate-700">{s.l}</div>
                        </div>
                      ))}
                      <div className="ml-1 flex items-center">
                        <span className="text-[9px] text-slate-700 font-mono whitespace-nowrap">Plombier · Lyon</span>
                      </div>
                    </div>
                    {/* Header table */}
                    <div className="grid grid-cols-[auto_1fr_auto_auto] gap-2 px-4 pb-1.5 border-b border-white/[0.04]">
                      {["","Nom","Tél.","Statut"].map((h, i) => (
                        <span key={i} className="text-[9px] text-slate-600 uppercase tracking-wider">{h}</span>
                      ))}
                    </div>
                    {/* Leads */}
                    <div className="flex-1 px-2 pb-2 space-y-0.5 overflow-hidden">
                      {LEADS.slice(0, visibleLeads).map((lead, i) => (
                        <div key={i}
                          className={`grid grid-cols-[auto_1fr_auto_auto] gap-2 items-center px-2 py-1.5 rounded-lg border transition-all duration-300 ${
                            i === 0 && drawerOpen ? "bg-violet-500/10 border-violet-500/20" : "border-transparent"
                          }`}
                          style={{ animation: "demoSlideIn 0.22s ease both" }}
                        >
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                            i === 0 && drawerOpen ? "bg-violet-500/20 text-violet-400" : "bg-white/5 text-slate-600"
                          }`}>{lead.n[0]}</div>
                          <span className="text-xs text-slate-400 truncate">{lead.n}</span>
                          <span className="text-[9px] text-slate-600 font-mono">{lead.tel}</span>
                          <TagBadge tag={i === 0 ? leadTag : lead.tag} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Drawer */}
                  <div className="absolute top-0 right-0 bottom-0 w-48 bg-[#0d0f18] border-l border-white/[0.07] flex flex-col transition-transform duration-500"
                       style={{ transform: drawerOpen ? "translateX(0)" : "translateX(100%)" }}>
                    <div className="px-3 py-2.5 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-md bg-violet-500/20 flex items-center justify-center text-[9px] font-bold text-violet-400">M</div>
                        <span className="text-xs font-semibold text-slate-200 truncate">Martin Plomberie</span>
                      </div>
                      <div className="text-[9px] text-slate-600">Lyon 3e · 06 12 34 56 78</div>
                    </div>
                    <div className="px-3 py-2.5 border-b border-white/[0.06]">
                      <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-2">Statut</div>
                      <div className="flex flex-wrap gap-1">
                        {[["non_appele","Non appelé"],["interesse","Intéressé"],["rdv","RDV pris"]].map(([v,l]) => (
                          <button key={v} className={`text-[9px] px-2 py-0.5 rounded-full border transition-all duration-500 ${
                            leadTag === v
                              ? v === "interesse"
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : "bg-white/[0.06] text-slate-400 border-white/[0.12]"
                              : "bg-white/[0.03] text-slate-700 border-white/[0.06]"
                          }`}>{l}</button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 px-3 py-2.5">
                      <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-2">Journal</div>
                      <div className="transition-all duration-500" style={{ opacity: showActivity ? 1 : 0, transform: showActivity ? "translateY(0)" : "translateY(6px)" }}>
                        <div className="flex gap-2 items-start">
                          <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-emerald-400 text-[8px]">✓</span>
                          </div>
                          <div>
                            <div className="text-[9px] text-slate-300">Statut → Intéressé</div>
                            <div className="text-[8px] text-slate-700 font-mono">à l&apos;instant</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ════════════════════════════════════════════════════════════
              SCÈNE 2  Vue Kanban
          ════════════════════════════════════════════════════════════ */}
          {scene === "kanban" && (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.05] flex-shrink-0">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Vue Kanban</span>
                <div className="flex gap-1.5">
                  <button className="text-[9px] px-2.5 py-1 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/25 font-medium">Kanban</button>
                  <button className="text-[9px] px-2.5 py-1 rounded-lg bg-white/[0.04] text-slate-600 border border-white/[0.07]">Table</button>
                </div>
              </div>
              <div className="flex-1 flex gap-3 px-3 pt-3 pb-2 overflow-hidden">
                {KANBAN_COLS.map((col, colIdx) => {
                  const colLeads = colIdx === 0
                    ? LEADS.filter(l => l.tag === "non_appele").slice(0, kanbanPhase === "dropped" ? 2 : 3)
                    : colIdx === 1
                    ? [
                        LEADS.find(l => l.tag === "interesse")!,
                        ...(kanbanPhase === "dropped" ? [LEADS.find(l => l.tag === "non_appele")!] : []),
                      ]
                    : [LEADS.find(l => l.tag === "rdv")!];

                  return (
                    <div key={col.id} className={`flex-1 flex flex-col gap-1.5 min-w-0 transition-all duration-300 ${
                      kanbanPhase === "drag" && colIdx === 1 ? "ring-1 ring-violet-500/30 rounded-xl bg-violet-500/[0.04]" : ""
                    }`}>
                      <div className="flex items-center justify-between px-1 mb-0.5">
                        <span className={`text-[9px] font-semibold uppercase tracking-wider ${col.color}`}>{col.label}</span>
                        <span className="text-[9px] text-slate-700">{colLeads.filter(Boolean).length}</span>
                      </div>
                      {colLeads.filter(Boolean).map((lead, i) => (
                        <div key={lead!.n + i}
                          className={`p-2.5 rounded-xl border text-[10px] transition-all duration-500 ${
                            kanbanPhase === "drag" && colIdx === 0 && i === 0
                              ? "opacity-30 border-dashed border-white/[0.10] bg-transparent"
                              : kanbanPhase === "dropped" && colIdx === 1 && i === 1
                              ? "border-emerald-400/30 bg-emerald-500/[0.08] shadow-[0_0_12px_rgba(52,211,153,0.1)]"
                              : "border-white/[0.07] bg-white/[0.03]"
                          }`}
                          style={kanbanPhase === "dropped" && colIdx === 1 && i === 1
                            ? { animation: "demoSlideIn 0.35s ease both" } : {}}>
                          <div className="font-medium text-slate-300 truncate">{lead!.n}</div>
                          <div className="text-slate-600 mt-0.5">{lead!.ville}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              {/* Carte "en vol" */}
              {kanbanPhase === "drag" && (
                <div className="absolute top-[90px] left-[120px] w-40 p-2.5 rounded-xl border border-violet-400/40 bg-[#131520] shadow-[0_8px_32px_rgba(124,58,237,0.25)] text-[10px]"
                     style={{
                       animation: "none",
                       transform: movingCard ? "translate(100px, 0) rotate(2deg)" : "translate(0,0) rotate(3deg)",
                       transition: "transform 0.65s cubic-bezier(.22,1,.36,1)",
                       zIndex: 20,
                     }}>
                  <div className="font-medium text-violet-300 truncate">SAS Plomb Pro</div>
                  <div className="text-slate-600 mt-0.5">Lyon 2e</div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              SCÈNE 3  Recherche INPI
          ════════════════════════════════════════════════════════════ */}
          {scene === "inpi" && (
            <div className="flex flex-col h-full">
              <div className="px-4 pt-2.5 pb-2 border-b border-white/[0.05] flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-cyan-400/80 font-mono uppercase tracking-widest">Base INPI / RNE</span>
                  <span className="text-[9px] text-slate-600"> entreprises créées récemment</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/[0.09] rounded-lg text-xs text-slate-300 font-mono flex items-center min-h-[30px]">
                    {inpiText}
                    {inpiPhase === "typing" && <span className="ml-px w-px h-3 bg-cyan-400 inline-block animate-pulse" />}
                  </div>
                  <div className="px-2.5 py-2 bg-white/[0.03] border border-white/[0.07] rounded-lg text-[9px] text-slate-600 flex items-center whitespace-nowrap">
                    &lt; 6 mois
                  </div>
                  <div className={`px-3 py-2 rounded-lg text-[10px] font-semibold flex items-center transition-all ${
                    inpiPhase === "loading"
                      ? "bg-cyan-500/10 text-cyan-400"
                      : visibleInpi > 0 ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/30"
                      : "bg-white/[0.04] text-slate-600 border border-white/[0.07]"
                  }`}>
                    {inpiPhase === "loading"
                      ? <span className="w-3 h-3 rounded-full border border-cyan-500/40 border-t-cyan-400 animate-spin block" />
                      : "Chercher"}
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-hidden px-3 py-2 space-y-1.5">
                {INPI_RESULTS.slice(0, visibleInpi).map((r, i) => (
                  <div key={i}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg border transition-all duration-300 ${
                      selectedInpi.includes(i) ? "bg-cyan-500/[0.07] border-cyan-500/20" : "bg-white/[0.02] border-white/[0.05]"
                    }`}
                    style={{ animation: "demoSlideIn 0.2s ease both" }}>
                    <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all duration-300 ${
                      selectedInpi.includes(i) ? "bg-cyan-600 border-cyan-500" : "bg-white/[0.04] border-white/[0.14]"
                    }`}>
                      {selectedInpi.includes(i) && <span className="text-white text-[9px]">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-300 truncate font-medium">{r.nom}</div>
                      <div className="text-[9px] text-slate-600 font-mono">{r.siren} · {r.dir}</div>
                    </div>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400/70 border border-cyan-500/15 flex-shrink-0 whitespace-nowrap">{r.age}</span>
                    {r.rm && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">RM</span>
                    )}
                  </div>
                ))}
                {selectedInpi.length >= 2 && (
                  <div style={{ animation: "demoSlideIn 0.3s ease both" }}>
                    <button className={`w-full py-2 mt-1 rounded-lg text-xs font-semibold transition-all duration-500 ${
                      importSuccess
                        ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-cyan-600/80 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                    }`}>
                      {importSuccess ? `✓ ${selectedInpi.length} leads importés + enrichissement lancé` : `Importer ${selectedInpi.length} entreprises →`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              SCÈNE 4  Session d'appels
          ════════════════════════════════════════════════════════════ */}
          {scene === "session" && (
            <div className="h-full flex">
              {/* Panel gauche  lead actuel */}
              <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 bg-gradient-to-b from-[#0a0c14] to-[#050508]">
                <div className="text-[9px] font-mono text-violet-400/70 uppercase tracking-widest">
                  Session d&apos;appels · {sessionCount} contacté{sessionCount > 1 ? "s" : ""}
                </div>
                {/* Numéro géant */}
                <div className={`text-2xl font-bold font-mono text-slate-50 tracking-widest transition-all duration-500 ${
                  sessionPhase === "calling" ? "scale-105" : "scale-100"
                }`}>
                  06 98 76 54 32
                </div>
                <div className="text-sm text-slate-500">Dupont &amp; Fils · Lyon 7e · Plombier</div>
                {/* Boutons résultat */}
                <div className="grid grid-cols-2 gap-2 w-full max-w-[240px] mt-1">
                  {[
                    { l: "1  Intéressé",    c: "bg-emerald-600/20 text-emerald-400 border-emerald-500/25" },
                    { l: "2  Rappeler",     c: "bg-amber-600/15   text-amber-400   border-amber-500/20"   },
                    { l: "3  Ne répond pas",c: "bg-slate-600/15   text-slate-400   border-slate-500/20"   },
                    { l: "4  Pas intéressé",c: "bg-red-600/12     text-red-400     border-red-500/18"     },
                  ].map((b, i) => (
                    <button key={i}
                      className={`py-1.5 px-2 rounded-lg text-[9px] font-medium border transition-all ${b.c} ${
                        sessionPhase === "result" && i === 0 ? "ring-1 ring-emerald-400/40 scale-[1.05]" : ""
                      }`}>
                      {b.l}
                    </button>
                  ))}
                </div>
              </div>
              {/* Panel droit  stats session */}
              <div className="w-36 bg-[#080a0f] border-l border-white/[0.05] flex flex-col p-3 gap-2.5">
                <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Stats live</div>
                {[
                  { l: "Appelés",      v: String(sessionCount), c: "text-slate-200" },
                  { l: "Réponses",     v: "2",                  c: "text-violet-400" },
                  { l: "Intéressés",   v: "1",                  c: "text-emerald-400" },
                  { l: "Rythme",       v: "8/h",                c: "text-cyan-400"   },
                ].map(s => (
                  <div key={s.l} className="bg-white/[0.03] rounded-lg px-2.5 py-2 border border-white/[0.05]">
                    <div className={`text-base font-bold ${s.c}`}>{s.v}</div>
                    <div className="text-[8px] text-slate-700">{s.l}</div>
                  </div>
                ))}
                <div className="mt-auto">
                  <div className="text-[8px] text-slate-700 mb-1 font-mono uppercase">Progression</div>
                  <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                    <div className="h-full bg-violet-500/60 rounded-full transition-all duration-700"
                         style={{ width: `${(sessionCount / 10) * 100}%` }} />
                  </div>
                  <div className="text-[8px] text-slate-700 mt-0.5 font-mono">{sessionCount}/10</div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              SCÈNE 5  Scripts téléprompter
          ════════════════════════════════════════════════════════════ */}
          {scene === "scripts" && (
            <div className="flex h-full">
              {/* Nav étapes */}
              <div className="w-10 bg-[#080a0f] border-r border-white/[0.05] flex flex-col items-center py-3 gap-1.5">
                {["Intro","QR","Prix","Close"].map((step, i) => (
                  <div key={step} title={step}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-mono transition-all ${
                      i === 0 ? "bg-violet-500/20 text-violet-400" : "text-slate-700"
                    }`}>
                    {String(i + 1).padStart(2,"0")}
                  </div>
                ))}
              </div>
              {/* Contenu script */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 py-2.5 border-b border-white/[0.05] flex items-center justify-between flex-shrink-0">
                  <div>
                    <div className="text-[9px] text-violet-400/70 font-mono uppercase tracking-widest">Téléprompter</div>
                    <div className="text-xs text-slate-300 font-semibold mt-0.5">Cold Call  Artisan</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] text-emerald-400 font-mono">en appel</span>
                  </div>
                </div>
                <div className="flex-1 relative overflow-hidden px-5 py-4">
                  <div className="text-sm text-slate-200 leading-relaxed font-medium"
                       style={{
                         transform: scriptScroll ? "translateY(-16px)" : "translateY(0)",
                         transition: "transform 3.5s ease-in-out",
                       }}>
                    <span className="text-slate-600 text-[9px] font-mono uppercase tracking-wider block mb-2">Intro</span>
                    <p className="mb-3">
                      Bonjour{" "}
                      <span className="text-violet-300 bg-violet-500/10 px-1 rounded">[prénom]</span>,
                      {" "}je travaille avec des{" "}
                      <span className="text-violet-300">plombiers</span>{" "}
                      pour les aider à avoir plus de chantiers via Google.
                    </p>
                    <p className="text-slate-400 text-[13px]">
                      Est-ce que vous cherchez à développer votre activité ?
                    </p>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-[#0c0e15] to-transparent pointer-events-none" />
                </div>
                {/* Objection */}
                <div className="px-4 pb-3 flex-shrink-0 overflow-hidden"
                     style={{
                       maxHeight: objectionOpen ? "110px" : "0",
                       opacity:   objectionOpen ? 1 : 0,
                       transition: "max-height 0.5s ease, opacity 0.4s ease",
                     }}>
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-amber-400 text-[10px]">⚡</span>
                      <span className="text-amber-400 text-[10px] font-semibold uppercase tracking-wider">Objection détectée</span>
                    </div>
                    <div className="text-[9px] text-slate-500 italic mb-1">&ldquo;Je n&apos;ai pas le temps.&rdquo;</div>
                    <div className="text-[9px] text-slate-300 leading-relaxed">
                      &ldquo;C&apos;est justement pour ça  on gère tout, vous recevez des appels entrants qualifiés.&rdquo;
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>{/* /zone contenu */}
      </div>{/* /flex shell */}

      {/* Barre scènes en bas */}
      <div className="flex items-center justify-center gap-3 px-4 py-2.5 border-t border-white/[0.05] bg-[#080a0f]">
        {(["scraping","kanban","inpi","session","scripts"] as Scene[]).map((s) => {
          const labels: Record<Scene,string> = {
            scraping: "Sourcing", kanban: "Kanban", inpi: "INPI", session: "Session", scripts: "Scripts",
          };
          return (
            <div key={s}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                scene === s
                  ? "bg-violet-500/15 text-violet-300 border border-violet-500/25"
                  : "text-slate-700"
              }`}>
              {scene === s && <span className="w-1 h-1 rounded-full bg-violet-400" />}
              {labels[s]}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes demoSlideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
