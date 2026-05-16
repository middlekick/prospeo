"use client";

import { useEffect, useState } from "react";

// ─── Données ──────────────────────────────────────────────────────────────────
const LEADS = [
  { n: "Martin Plomberie",  tel: "06 12 34 56 78", ville: "Lyon 3e" },
  { n: "Dupont & Fils",     tel: "06 98 76 54 32", ville: "Lyon 7e" },
  { n: "SAS Plomb Pro",    tel: "07 11 22 33 44", ville: "Lyon 2e" },
  { n: "Ferretti Réno",    tel: "06 55 66 77 88", ville: "Lyon 9e" },
  { n: "Espace Sanitaire", tel: "06 33 44 55 66", ville: "Lyon 6e" },
];

const INPI_RESULTS = [
  { siren: "823 456 789", nom: "MARTIN PLOMBERIE",   dir: "Martin J-P",  rm: true  },
  { siren: "912 345 678", nom: "EAU CONFORT SAS",    dir: "Lefebvre M.", rm: false },
  { siren: "734 567 890", nom: "DUPONT INSTALL PRO", dir: "Dupont A.",   rm: true  },
  { siren: "645 678 901", nom: "RHÔNE SANITAIRE",    dir: "Bernard L.",  rm: true  },
];

type Phase =
  // Scène 1 — Scraping + Leads
  | "s1-start" | "s1-typing-metier" | "s1-typing-ville" | "s1-loading"
  | "s1-leads" | "s1-hover" | "s1-drawer" | "s1-tag" | "s1-activity"
  // Scène 2 — INPI
  | "s2-start" | "s2-typing" | "s2-loading" | "s2-results" | "s2-select" | "s2-import"
  // Scène 3 — Scripts
  | "s3-start" | "s3-active" | "s3-objection"
  // Reset
  | "done";

function getScene(p: Phase): 1 | 2 | 3 {
  if (p.startsWith("s1")) return 1;
  if (p.startsWith("s2")) return 2;
  return 3;
}

function TagBadge({ tag }: { tag: string }) {
  const map: Record<string, string> = {
    "Non appelé": "bg-slate-500/15  text-slate-400  border-slate-500/25",
    "Intéressé":  "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    "RDV pris":   "bg-violet-500/15  text-violet-400  border-violet-500/25",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border transition-all duration-500 ${map[tag] ?? map["Non appelé"]}`}>
      {tag}
    </span>
  );
}

// ─── Composant ────────────────────────────────────────────────────────────────
export default function AnimatedDemo() {
  const [phase,        setPhase]        = useState<Phase>("s1-start");
  const [contentFade,  setContentFade]  = useState(true);
  const [fadingOut,    setFadingOut]    = useState(false);

  // Scène 1
  const [metierText,   setMetierText]   = useState("");
  const [villeText,    setVilleText]    = useState("");
  const [visibleLeads, setVisibleLeads] = useState(0);
  const [hoveredLead,  setHoveredLead]  = useState(-1);
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [leadTag,      setLeadTag]      = useState("Non appelé");
  const [showActivity, setShowActivity] = useState(false);

  // Scène 2
  const [inpiText,      setInpiText]      = useState("");
  const [visibleInpi,   setVisibleInpi]   = useState(0);
  const [selectedInpi,  setSelectedInpi]  = useState<number[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);

  // Scène 3
  const [scriptScroll,   setScriptScroll]   = useState(false);
  const [objectionOpen,  setObjectionOpen]  = useState(false);

  const scene        = getScene(phase);
  const sidebarActive = scene === 1 ? 0 : scene === 2 ? 2 : 3;

  // ── Séquence des phases ────────────────────────────────────────────────────
  useEffect(() => {
    let t:  ReturnType<typeof setTimeout>;
    let iv: ReturnType<typeof setInterval>;

    // Helpers
    const go   = (next: Phase, ms: number) => { t = setTimeout(() => setPhase(next), ms); };
    const fade = (next: Phase, pause: number) => {
      t = setTimeout(() => {
        setContentFade(false);
        setTimeout(() => { setPhase(next); setContentFade(true); }, 380);
      }, pause);
    };
    const typeText = (setter: (s: string) => void, word: string, speed: number, next: Phase, gap = 350) => {
      let i = 0;
      iv = setInterval(() => {
        i++;
        setter(word.slice(0, i));
        if (i >= word.length) { clearInterval(iv); t = setTimeout(() => setPhase(next), gap); }
      }, speed);
    };

    switch (phase) {

      // ── Scène 1
      case "s1-start":
        setMetierText(""); setVilleText(""); setVisibleLeads(0);
        setHoveredLead(-1); setDrawerOpen(false);
        setLeadTag("Non appelé"); setShowActivity(false);
        go("s1-typing-metier", 700);
        break;

      case "s1-typing-metier":
        typeText(setMetierText, "Plombier", 70, "s1-typing-ville");
        break;

      case "s1-typing-ville":
        typeText(setVilleText, "Lyon", 70, "s1-loading", 300);
        break;

      case "s1-loading":
        go("s1-leads", 1700);
        break;

      case "s1-leads": {
        let i = 0;
        iv = setInterval(() => {
          i++; setVisibleLeads(i);
          if (i >= LEADS.length) { clearInterval(iv); t = setTimeout(() => setPhase("s1-hover"), 800); }
        }, 220);
        break;
      }

      case "s1-hover":
        setHoveredLead(0);
        go("s1-drawer", 700);
        break;

      case "s1-drawer":
        setDrawerOpen(true);
        go("s1-tag", 1500);
        break;

      case "s1-tag":
        setLeadTag("Intéressé");
        go("s1-activity", 900);
        break;

      case "s1-activity":
        setShowActivity(true);
        fade("s2-start", 2400);
        break;

      // ── Scène 2
      case "s2-start":
        setInpiText(""); setVisibleInpi(0); setSelectedInpi([]); setImportSuccess(false);
        go("s2-typing", 500);
        break;

      case "s2-typing":
        typeText(setInpiText, "plomberie", 65, "s2-loading", 300);
        break;

      case "s2-loading":
        go("s2-results", 1500);
        break;

      case "s2-results": {
        let i = 0;
        iv = setInterval(() => {
          i++; setVisibleInpi(i);
          if (i >= INPI_RESULTS.length) { clearInterval(iv); t = setTimeout(() => setPhase("s2-select"), 700); }
        }, 200);
        break;
      }

      case "s2-select": {
        let i = 0;
        iv = setInterval(() => {
          setSelectedInpi(prev => [...prev, i]);
          i++;
          if (i >= 3) { clearInterval(iv); t = setTimeout(() => setPhase("s2-import"), 600); }
        }, 520);
        break;
      }

      case "s2-import":
        setImportSuccess(true);
        fade("s3-start", 2000);
        break;

      // ── Scène 3
      case "s3-start":
        setScriptScroll(false); setObjectionOpen(false);
        go("s3-active", 500);
        break;

      case "s3-active":
        setScriptScroll(true);
        go("s3-objection", 3400);
        break;

      case "s3-objection":
        setObjectionOpen(true);
        go("done", 3800);
        break;

      case "done":
        t = setTimeout(() => {
          setFadingOut(true);
          setTimeout(() => { setPhase("s1-start"); setFadingOut(false); setContentFade(true); }, 600);
        }, 1200);
        break;
    }

    return () => { clearTimeout(t); clearInterval(iv); };
  }, [phase]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border border-white/10 bg-[#0f1117]"
      style={{
        boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 40px 120px rgba(124,58,237,0.28), 0 0 60px rgba(124,58,237,0.12)",
        opacity: fadingOut ? 0 : 1,
        transition: "opacity 0.6s ease",
      }}
    >
      {/* Ligne gradient haut */}
      <div className="h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

      {/* Barre titre */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#080a0f] border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
        </div>
        <span className="ml-2 text-[11px] text-slate-500 font-mono">prospeo.app</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-slate-600 font-mono">
            {scene === 1 ? "/ leads" : scene === 2 ? "/ inpi" : "/ scripts"}
          </span>
          <span className="text-[10px] text-violet-400/60 font-mono">● live</span>
        </div>
      </div>

      {/* Corps */}
      <div className="flex h-72 relative">

        {/* Sidebar */}
        <div className="w-12 bg-[#080a0f] border-r border-white/5 flex flex-col items-center py-3 gap-3 flex-shrink-0 z-10">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <span className="text-violet-400 text-xs font-bold">P</span>
          </div>
          {[
            { ic: "◈", label: "Leads" },
            { ic: "◉", label: "Dashboard" },
            { ic: "🏛", label: "INPI" },
            { ic: "◎", label: "Scripts" },
          ].map((item, i) => (
            <div
              key={i}
              title={item.label}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all duration-500 ${
                i === sidebarActive
                  ? "bg-violet-500/20 text-violet-400 shadow-[0_0_10px_rgba(124,58,237,0.3)]"
                  : "text-slate-700"
              }`}
            >
              {item.ic}
            </div>
          ))}
        </div>

        {/* Zone de contenu avec fade entre scènes */}
        <div
          className="flex-1 overflow-hidden"
          style={{ opacity: contentFade ? 1 : 0, transition: "opacity 0.35s ease" }}
        >

          {/* ── Scène 1 : Scraping + Leads ── */}
          {scene === 1 && (
            <>
              {/* Formulaire scraping */}
              {["s1-start","s1-typing-metier","s1-typing-ville","s1-loading"].includes(phase) && (
                <div className="h-full flex flex-col justify-center items-center gap-4 px-8">
                  <span className="text-[11px] text-violet-400/80 font-mono uppercase tracking-widest">
                    Scraping Google Maps
                  </span>
                  <div className="w-full flex gap-3">
                    <div className="flex-1">
                      <label className="block text-[9px] text-slate-600 mb-1 ml-1 uppercase tracking-wider">Métier</label>
                      <div className="px-3 py-2.5 bg-white/[0.04] border border-white/[0.10] rounded-lg text-xs text-slate-300 font-mono min-h-[34px] flex items-center">
                        {metierText}
                        {phase === "s1-typing-metier" && <span className="ml-px w-px h-3 bg-violet-400 inline-block animate-pulse" />}
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-[9px] text-slate-600 mb-1 ml-1 uppercase tracking-wider">Ville</label>
                      <div className="px-3 py-2.5 bg-white/[0.04] border border-white/[0.10] rounded-lg text-xs text-slate-300 font-mono min-h-[34px] flex items-center">
                        {villeText}
                        {phase === "s1-typing-ville" && <span className="ml-px w-px h-3 bg-violet-400 inline-block animate-pulse" />}
                      </div>
                    </div>
                  </div>
                  {phase === "s1-loading" ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-7 h-7 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
                      <span className="text-[10px] text-slate-600 font-mono">Recherche en cours…</span>
                    </div>
                  ) : (
                    <button className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                      phase === "s1-typing-ville"
                        ? "bg-violet-600 text-white shadow-[0_0_16px_rgba(124,58,237,0.4)]"
                        : "bg-white/[0.05] text-slate-600 border border-white/[0.08]"
                    }`}>
                      {phase === "s1-typing-ville" ? "Lancer →" : "Rechercher"}
                    </button>
                  )}
                </div>
              )}

              {/* Table + Drawer */}
              {["s1-leads","s1-hover","s1-drawer","s1-tag","s1-activity"].includes(phase) && (
                <div className="flex h-full relative">
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Stats */}
                    <div className="flex gap-2 px-3 pt-3 pb-2 flex-shrink-0">
                      {[
                        { l: "Total",      v: String(visibleLeads),            c: "text-slate-300"  },
                        { l: "Intéressés", v: leadTag === "Intéressé" ? "1":"0", c: "text-emerald-400" },
                        { l: "RDV",        v: "0",                            c: "text-violet-400" },
                      ].map(s => (
                        <div key={s.l} className="flex-1 bg-white/[0.05] rounded-lg px-2 py-1.5 border border-white/[0.08]">
                          <div className={`text-sm font-bold ${s.c}`}>{s.v}</div>
                          <div className="text-[9px] text-slate-600">{s.l}</div>
                        </div>
                      ))}
                      <div className="ml-auto flex items-center">
                        <span className="text-[9px] text-slate-700 font-mono">Plombier · Lyon</span>
                      </div>
                    </div>
                    {/* Leads */}
                    <div className="flex-1 px-2 pb-2 space-y-1 overflow-hidden">
                      {LEADS.slice(0, visibleLeads).map((lead, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-300 border ${
                            hoveredLead === i
                              ? "bg-violet-500/10 border-violet-500/20"
                              : "border-transparent"
                          }`}
                          style={{ animation: "slideIn 0.25s ease both" }}
                        >
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors ${
                            hoveredLead === i ? "bg-violet-500/20 text-violet-400" : "bg-white/5 text-slate-600"
                          }`}>
                            {lead.n[0]}
                          </div>
                          <span className="flex-1 text-xs text-slate-400 truncate">{lead.n}</span>
                          <span className="text-[10px] text-slate-600 font-mono hidden sm:block">{lead.tel}</span>
                          <TagBadge tag={i === 0 ? leadTag : "Non appelé"} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Drawer */}
                  <div
                    className="absolute top-0 right-0 bottom-0 w-52 bg-[#0d0f16] border-l border-white/[0.08] flex flex-col overflow-hidden transition-transform duration-500"
                    style={{ transform: drawerOpen ? "translateX(0)" : "translateX(100%)" }}
                  >
                    <div className="px-3 py-2.5 border-b border-white/[0.06] flex-shrink-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-md bg-violet-500/20 flex items-center justify-center text-[9px] font-bold text-violet-400">M</div>
                        <span className="text-xs font-semibold text-slate-200">Martin Plomberie</span>
                      </div>
                      <div className="text-[9px] text-slate-600">Lyon 3e · 06 12 34 56 78</div>
                    </div>
                    <div className="px-3 py-2.5 border-b border-white/[0.06]">
                      <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-1.5">Statut</div>
                      <div className="flex flex-wrap gap-1">
                        {["Non appelé","Intéressé","RDV pris"].map(t => (
                          <button key={t} className={`text-[9px] px-2 py-0.5 rounded-full border transition-all duration-500 ${
                            leadTag === t
                              ? t === "Intéressé"
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.2)]"
                                : "bg-slate-500/15 text-slate-400 border-slate-500/25"
                              : "bg-white/[0.04] text-slate-700 border-white/[0.08]"
                          }`}>{t}</button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 px-3 py-2.5 overflow-hidden">
                      <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-2">Journal</div>
                      <div
                        className="flex gap-2 items-start transition-all duration-500"
                        style={{ opacity: showActivity ? 1 : 0, transform: showActivity ? "translateY(0)" : "translateY(6px)" }}
                      >
                        <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-emerald-400 text-[8px]">✓</span>
                        </div>
                        <div>
                          <div className="text-[9px] text-slate-400 font-medium">Statut → Intéressé</div>
                          <div className="text-[8px] text-slate-700 font-mono">il y a 2s</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Scène 2 : INPI ── */}
          {scene === 2 && (
            <div className="flex flex-col h-full">
              {/* Header search */}
              <div className="px-4 pt-3 pb-2.5 border-b border-white/[0.06] flex-shrink-0">
                <div className="text-[10px] text-violet-400/70 font-mono uppercase tracking-widest mb-2">Base INPI / RNE</div>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/[0.10] rounded-lg text-xs text-slate-300 font-mono flex items-center min-h-[30px]">
                    {inpiText}
                    {phase === "s2-typing" && <span className="ml-px w-px h-3 bg-violet-400 inline-block animate-pulse" />}
                  </div>
                  <div className="px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[10px] text-slate-600 flex items-center whitespace-nowrap">
                    Dép. 69
                  </div>
                  <div className={`px-3 py-2 rounded-lg text-[10px] font-semibold flex items-center transition-all ${
                    phase === "s2-loading"
                      ? "bg-violet-500/10 text-violet-400"
                      : visibleInpi > 0
                        ? "bg-violet-600/20 text-violet-400 border border-violet-500/30"
                        : "bg-white/[0.05] text-slate-600 border border-white/[0.08]"
                  }`}>
                    {phase === "s2-loading"
                      ? <span className="w-3 h-3 rounded-full border border-violet-500/40 border-t-violet-400 animate-spin block" />
                      : "Chercher"}
                  </div>
                </div>
              </div>

              {/* Résultats */}
              <div className="flex-1 overflow-hidden px-3 py-2 space-y-1.5">
                {INPI_RESULTS.slice(0, visibleInpi).map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg border transition-all duration-300 ${
                      selectedInpi.includes(i)
                        ? "bg-violet-500/10 border-violet-500/25"
                        : "bg-white/[0.03] border-white/[0.06]"
                    }`}
                    style={{ animation: "slideIn 0.2s ease both" }}
                  >
                    <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all duration-300 ${
                      selectedInpi.includes(i)
                        ? "bg-violet-600 border-violet-500"
                        : "bg-white/[0.04] border-white/[0.15]"
                    }`}>
                      {selectedInpi.includes(i) && <span className="text-white text-[9px] leading-none">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-300 truncate font-medium">{r.nom}</div>
                      <div className="text-[9px] text-slate-600 font-mono">{r.siren} · {r.dir}</div>
                    </div>
                    {r.rm && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 flex-shrink-0">
                        RM
                      </span>
                    )}
                  </div>
                ))}

                {/* Bouton import */}
                {selectedInpi.length >= 2 && (
                  <div style={{ animation: "slideIn 0.3s ease both" }}>
                    <button className={`w-full py-2 mt-1 rounded-lg text-xs font-semibold transition-all duration-500 ${
                      importSuccess
                        ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]"
                    }`}>
                      {importSuccess
                        ? `✓ ${selectedInpi.length} leads importés + enrichissement lancé`
                        : `Importer ${selectedInpi.length} entreprises →`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Scène 3 : Scripts ── */}
          {scene === 3 && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="px-4 pt-3 pb-2.5 border-b border-white/[0.06] flex-shrink-0 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-violet-400/70 font-mono uppercase tracking-widest">Téléprompter</div>
                  <div className="text-xs text-slate-400 font-semibold mt-0.5">Cold Call — Artisan</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] text-emerald-400 font-mono">en appel</span>
                </div>
              </div>

              {/* Texte script avec défilement */}
              <div className="flex-1 relative overflow-hidden px-5 py-4">
                <div
                  className="text-sm text-slate-200 leading-relaxed font-medium"
                  style={{
                    transform: scriptScroll ? "translateY(-14px)" : "translateY(0)",
                    transition: "transform 3.2s ease-in-out",
                  }}
                >
                  <span className="text-slate-600 text-[9px] font-mono uppercase tracking-wider block mb-2">Intro</span>
                  <p className="mb-3">
                    Bonjour{" "}
                    <span className="text-violet-300 bg-violet-500/10 px-1 rounded">[prénom]</span>,
                    {" "}je vous contacte car je travaille avec des{" "}
                    <span className="text-violet-300">plombiers</span>{" "}
                    dans votre secteur pour les aider à avoir plus de chantiers via Google.
                  </p>
                  <p className="text-slate-400 text-[13px]">
                    Est-ce que vous cherchez à développer votre activité en ce moment ?
                  </p>
                </div>

                {/* Fade bas */}
                <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-[#0f1117] to-transparent pointer-events-none" />
              </div>

              {/* Objection */}
              <div
                className="px-4 pb-3 flex-shrink-0 overflow-hidden"
                style={{
                  maxHeight: objectionOpen ? "120px" : "0",
                  opacity:   objectionOpen ? 1 : 0,
                  transition: "max-height 0.5s ease, opacity 0.4s ease",
                }}
              >
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.07] p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-amber-400 text-[10px]">⚡</span>
                    <span className="text-amber-400 text-[10px] font-semibold uppercase tracking-wider">Objection</span>
                  </div>
                  <div className="text-[10px] text-slate-500 italic mb-1.5">&ldquo;Je n&apos;ai pas le temps&rdquo;</div>
                  <div className="text-[10px] text-slate-300 leading-relaxed">
                    &ldquo;La semaine test est gratuite — vous payez uniquement le budget Google directement. Pas de risque de votre côté.&rdquo;
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Gradient fade bas */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#0f1117] to-transparent pointer-events-none" />

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
