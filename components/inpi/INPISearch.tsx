"use client";

import { useState } from "react";

// ── Types réels de l'API ──────────────────────────────────────────────────────

interface Dirigeant {
  nom?: string;
  prenoms?: string;
  qualite?: string;
  date_de_naissance?: string;
}

interface Entreprise {
  siren: string;
  nom_complet: string;
  activite_principale?: string;
  date_creation?: string;
  categorie_entreprise?: string;
  nature_juridique?: string;
  dirigeants?: Dirigeant[];
  siege?: {
    adresse?: string;
    code_postal?: string;
    libelle_commune?: string;
    departement?: string;
    activite_principale_registre_metier?: string | null;
    siret?: string;
  };
}

interface SearchResult {
  results?:       Entreprise[];
  total_results?: number;
  has_more?:      boolean;
  error?:         string;
}

// ── Données de référence ──────────────────────────────────────────────────────

const DEPARTEMENTS: [string, string][] = [
  ["01","Ain"],["02","Aisne"],["03","Allier"],["04","Alpes-de-Haute-Provence"],["05","Hautes-Alpes"],
  ["06","Alpes-Maritimes"],["07","Ardèche"],["08","Ardennes"],["09","Ariège"],["10","Aube"],
  ["11","Aude"],["12","Aveyron"],["13","Bouches-du-Rhône"],["14","Calvados"],["15","Cantal"],
  ["16","Charente"],["17","Charente-Maritime"],["18","Cher"],["19","Corrèze"],["21","Côte-d'Or"],
  ["22","Côtes-d'Armor"],["23","Creuse"],["24","Dordogne"],["25","Doubs"],["26","Drôme"],
  ["27","Eure"],["28","Eure-et-Loir"],["29","Finistère"],["2A","Corse-du-Sud"],["2B","Haute-Corse"],
  ["30","Gard"],["31","Haute-Garonne"],["32","Gers"],["33","Gironde"],["34","Hérault"],
  ["35","Ille-et-Vilaine"],["36","Indre"],["37","Indre-et-Loire"],["38","Isère"],["39","Jura"],
  ["40","Landes"],["41","Loir-et-Cher"],["42","Loire"],["43","Haute-Loire"],["44","Loire-Atlantique"],
  ["45","Loiret"],["46","Lot"],["47","Lot-et-Garonne"],["48","Lozère"],["49","Maine-et-Loire"],
  ["50","Manche"],["51","Marne"],["52","Haute-Marne"],["53","Mayenne"],["54","Meurthe-et-Moselle"],
  ["55","Meuse"],["56","Morbihan"],["57","Moselle"],["58","Nièvre"],["59","Nord"],
  ["60","Oise"],["61","Orne"],["62","Pas-de-Calais"],["63","Puy-de-Dôme"],["64","Pyrénées-Atlantiques"],
  ["65","Hautes-Pyrénées"],["66","Pyrénées-Orientales"],["67","Bas-Rhin"],["68","Haut-Rhin"],["69","Rhône"],
  ["70","Haute-Saône"],["71","Saône-et-Loire"],["72","Sarthe"],["73","Savoie"],["74","Haute-Savoie"],
  ["75","Paris"],["76","Seine-Maritime"],["77","Seine-et-Marne"],["78","Yvelines"],["79","Deux-Sèvres"],
  ["80","Somme"],["81","Tarn"],["82","Tarn-et-Garonne"],["83","Var"],["84","Vaucluse"],
  ["85","Vendée"],["86","Vienne"],["87","Haute-Vienne"],["88","Vosges"],["89","Yonne"],
  ["90","Territoire de Belfort"],["91","Essonne"],["92","Hauts-de-Seine"],["93","Seine-Saint-Denis"],
  ["94","Val-de-Marne"],["95","Val-d'Oise"],
];

const NAF_LABELS: Record<string, string> = {
  "43.11Z": "Travaux de démolition",
  "43.12A": "Terrassement courant",
  "43.21A": "Installation électrique",
  "43.22A": "Plomberie",
  "43.22B": "Chauffage / climatisation",
  "43.31Z": "Plâtrerie",
  "43.32A": "Menuiserie bois",
  "43.32B": "Menuiserie métal / PVC",
  "43.33Z": "Carrelage",
  "43.34Z": "Peinture / vitrerie",
  "43.91A": "Charpente",
  "43.91B": "Couverture",
  "43.99C": "Maçonnerie",
  "43.99D": "Isolation",
  "41.20A": "Construction maisons individuelles",
  "41.20B": "Construction bâtiments divers",
  "45.20A": "Entretien / réparation auto",
  "45.20B": "Carrosserie",
  "96.02A": "Coiffure",
  "56.10A": "Restauration traditionnelle",
  "47.71Z": "Commerce habillement",
};

const NAF_SUGGESTIONS: [string, string][] = [
  ["43.22A", "Plomberie"],
  ["43.22B", "Chauffage / climatisation"],
  ["43.21A", "Installation électrique"],
  ["43.34Z", "Peinture / vitrerie"],
  ["43.91B", "Couverture"],
  ["43.91A", "Charpente"],
  ["43.32A", "Menuiserie bois"],
  ["43.32B", "Menuiserie métal / PVC"],
  ["43.33Z", "Carrelage"],
  ["43.31Z", "Plâtrerie"],
  ["43.99C", "Maçonnerie"],
  ["43.99D", "Isolation"],
  ["41.20A", "Construction maisons individuelles"],
  ["43.12A", "Terrassement"],
  ["45.20A", "Entretien / réparation auto"],
];

const NATURE_LABELS: Record<string, string> = {
  "1000": "Entrepreneur individuel",
  "5499": "SARL",
  "5710": "SAS",
  "5720": "SASU",
  "1110": "Auto-entrepreneur",
  "5308": "EURL",
};

function nafLabel(code?: string) {
  if (!code) return "—";
  return NAF_LABELS[code] || code;
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR");
}

function dirigeantName(d: Dirigeant) {
  return [d.prenoms, d.nom].filter(Boolean).join(" ") || "—";
}

// ── Composant principal ───────────────────────────────────────────────────────

interface Props {
  onAddLeads: (leads: Record<string, unknown>[]) => void;
}

export default function INPISearch({ onAddLeads }: Props) {
  const [q,         setQ]        = useState("");
  const [dept,      setDept]     = useState("");
  const [naf,       setNaf]      = useState("");
  const [annees,    setAnnees]   = useState(5);
  // 0 = utilise "annees" ; sinon ne garde que les créées dans les N derniers mois
  const [moisMax,   setMoisMax]  = useState(0);
  const [rmOnly,    setRmOnly]   = useState(false);
  const [results,   setResults]  = useState<Entreprise[]>([]);
  const [total,     setTotal]    = useState(0);
  const [page,      setPage]     = useState(1);
  const [loading,   setLoading]  = useState(false);
  const [searched,  setSearched] = useState(false);
  const [error,     setError]    = useState("");
  const [hasMore,   setHasMore]  = useState(false);
  const [selected,  setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  async function search(p = 1) {
    setLoading(true);
    setError("");
    setPage(p);
    setSelected(new Set());
    try {
      const params = new URLSearchParams({ annees: String(annees), page: String(p) });
      if (moisMax > 0) params.set("moisMax", String(moisMax));
      if (q)      params.set("q", q);
      if (dept)   params.set("departement", dept);
      if (naf)    params.set("naf", naf);
      if (rmOnly) params.set("rmOnly", "1");
      const res  = await fetch(`/api/inpi?${params}`);
      const data: SearchResult = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.results || []);
      setTotal(data.total_results || 0);
      setHasMore(data.has_more || false);
      setSearched(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(siren: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(siren) ? next.delete(siren) : next.add(siren);
      return next;
    });
  }

  function toggleAll() {
    setSelected(prev => prev.size === results.length ? new Set() : new Set(results.map(r => r.siren)));
  }

  async function importSelected() {
    const toImport = results
      .filter(r => selected.has(r.siren))
      .map(r => {
        const dirigeant = r.dirigeants?.[0];
        return {
          nom:         r.nom_complet,
          metier:      nafLabel(r.activite_principale),
          telephone:   "",
          site:        "",
          emplacement: [r.siege?.adresse, r.siege?.libelle_commune].filter(Boolean).join(" — "),
          pays:        "France",
          note:        [
            dirigeant ? `Dirigeant : ${dirigeantName(dirigeant)}` : "",
            r.siren ? `SIREN : ${r.siren}` : "",
            r.nature_juridique ? `Forme : ${NATURE_LABELS[r.nature_juridique] || r.nature_juridique}` : "",
          ].filter(Boolean).join("\n"),
        };
      });
    if (!toImport.length) return;
    setImporting(true);
    setImportMsg("");
    try {
      const res  = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: toImport }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImportMsg(`✓ ${data.added} ajouté(s) au CRM`);
      setSelected(new Set());
      onAddLeads(toImport);
    } catch (e) {
      setImportMsg(`✗ ${(e as Error).message}`);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Formulaire */}
      <div className="px-5 py-4 border-b border-white/[0.05] shrink-0 space-y-3 bg-[#080b12]/40">
        <div className="flex flex-wrap items-end gap-2.5">
          {/* Recherche libre */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Recherche</label>
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input value={q} onChange={e => setQ(e.target.value)}
                placeholder="plombier, maçon, SARL…"
                onKeyDown={e => e.key === "Enter" && search(1)}
                className="h-8 pl-8 pr-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand-500/40 w-52 transition-colors"
              />
            </div>
          </div>

          {/* Département */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Département</label>
            <div className="relative w-48">
              <select value={dept} onChange={e => setDept(e.target.value)}
                className="appearance-none h-8 w-full pl-3 pr-7 rounded-lg bg-[#0e1118] border border-white/[0.08]
                           text-[13px] text-slate-200 focus:outline-none focus:border-brand-500/40
                           cursor-pointer [color-scheme:dark] transition-colors">
                <option value="">Tous les dpts.</option>
                {DEPARTEMENTS.map(([code, label]) => (
                  <option key={code} value={code}>{code} — {label}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-600" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          {/* NAF */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Secteur NAF</label>
            <div className="relative w-52">
              <select value={naf} onChange={e => setNaf(e.target.value)}
                className="appearance-none h-8 w-full pl-3 pr-7 rounded-lg bg-[#0e1118] border border-white/[0.08]
                           text-[13px] text-slate-200 focus:outline-none focus:border-brand-500/40
                           cursor-pointer [color-scheme:dark] transition-colors">
                <option value="">Tous secteurs</option>
                {NAF_SUGGESTIONS.map(([code, label]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-600" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          {/* Jeunes entreprises */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-amber-500/70 uppercase tracking-wider flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Jeunes entreprises
            </label>
            <div className="relative">
              <select
                value={moisMax}
                onChange={e => setMoisMax(Number(e.target.value))}
                className="h-8 pl-3 pr-7 rounded-lg bg-[#0e1118] border border-amber-500/[0.15] text-[13px] text-slate-200 focus:outline-none focus:border-amber-500/40 appearance-none cursor-pointer [color-scheme:dark] transition-colors"
              >
                <option value={0}>Toutes (par ans)</option>
                <option value={3}>— &lt; 3 mois</option>
                <option value={6}>— &lt; 6 mois</option>
                <option value={12}>— &lt; 12 mois</option>
                <option value={24}>— &lt; 24 mois</option>
              </select>
              <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-amber-600" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          {/* Max ans (si pas filtre mois) */}
          <div className={`flex flex-col gap-1 transition-opacity ${moisMax > 0 ? "opacity-30 pointer-events-none" : ""}`}>
            <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Max ans</label>
            <input type="number" value={annees} min={1} max={10} disabled={moisMax > 0}
              onChange={e => setAnnees(Number(e.target.value))}
              className="h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13px] text-slate-200 focus:outline-none focus:border-brand-500/40 w-16 font-mono"
            />
          </div>

          {/* Rechercher */}
          <button onClick={() => search(1)} disabled={loading}
            className="h-8 px-5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-[13px] font-semibold text-white transition-all shadow-[0_0_16px_rgba(124,58,237,0.2)] flex items-center gap-2">
            {loading ? (
              <>
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity=".3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></svg>
                Recherche…
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                Rechercher
              </>
            )}
          </button>
        </div>

        {/* Filtre artisans + résultat count */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer w-fit group">
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rmOnly ? "bg-brand-500 border-brand-500" : "bg-white/[0.04] border-white/[0.12] group-hover:border-brand-500/40"}`}
              onClick={() => setRmOnly(v => !v)}>
              {rmOnly && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
            <input type="checkbox" checked={rmOnly} onChange={e => setRmOnly(e.target.checked)} className="hidden" />
            <span className="text-[12px] text-slate-400">Artisans seulement (Registre des Métiers)</span>
          </label>
          {total > 0 && (
            <span className="text-[11px] text-slate-600 font-mono">
              ~<span className="text-brand-400 font-semibold">{total.toLocaleString("fr-FR")}</span> dans l&apos;API
              {results.length > 0 && <span className="text-slate-700"> · {results.length} affichés</span>}
            </span>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/[0.07] border border-red-500/20 text-[12px] text-red-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {error}
          </div>
        )}
      </div>

      {/* Barre actions */}
      {results.length > 0 && (
        <div className="flex items-center justify-between px-5 py-2 border-b border-white/[0.05] bg-[#080b12]/30 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={toggleAll} className="text-[12px] text-slate-500 hover:text-slate-200 transition-colors">
              {selected.size === results.length ? "Tout désélectionner" : "Tout sélectionner"}
            </button>
            {selected.size > 0 && (
              <span className="text-[11px] font-mono text-brand-400 font-semibold">
                {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {importMsg && (
              <span className={`text-[12px] font-mono ${importMsg.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>
                {importMsg}
              </span>
            )}
            <button
              onClick={importSelected}
              disabled={!selected.size || importing}
              className="h-7 px-4 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-[12px] font-semibold text-white transition-colors shadow-[0_0_12px_rgba(124,58,237,0.2)]"
            >
              {importing ? "Import…" : `Ajouter ${selected.size || ""} au CRM`}
            </button>
          </div>
        </div>
      )}

      {/* Résultats */}
      <div className="flex-1 overflow-auto">

        {/* État vide initial */}
        {!searched && !loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-brand-500/10 blur-xl" />
              <div className="relative w-14 h-14 rounded-2xl bg-brand-500/[0.08] border border-brand-500/[0.15] flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-400">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                  <path d="M7 8h10M7 11h6"/>
                </svg>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[13px] font-semibold text-slate-400 mb-1">Base nationale des entreprises</p>
              <p className="text-[12px] text-slate-600 max-w-xs leading-relaxed">
                Sélectionnez un département et un secteur NAF pour trouver des entreprises récemment créées — leads qualifiés prêts à importer.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {[
                { dot: "bg-cyan-400", label: "Département" },
                { dot: "bg-brand-400", label: "Secteur NAF" },
                { dot: "bg-amber-400", label: "Ancienneté" },
              ].map(({ dot, label }) => (
                <div key={label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
                  <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                  <span className="text-[10px] font-mono text-slate-600">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chargement */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <svg className="animate-spin text-brand-500" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".2"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            <span className="text-[12px] text-slate-600 font-mono">Interrogation de la base RNE…</span>
          </div>
        )}

        {/* Aucun résultat */}
        {searched && !loading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-600">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M8 11h6"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[12px] font-semibold text-slate-500">Aucun résultat</p>
              <p className="text-[11px] text-slate-700 mt-0.5">Essayez d&apos;élargir les critères ou de changer le secteur</p>
            </div>
          </div>
        )}

        {/* Table résultats */}
        {results.length > 0 && (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-white/[0.06] sticky top-0 bg-[#080b12]/95 backdrop-blur-md z-10">
                <th className="py-2.5 px-3 w-9">
                  {/* Case à cocher globale */}
                  <div
                    onClick={toggleAll}
                    className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all ${
                      selected.size === results.length && results.length > 0
                        ? "bg-brand-500 border-brand-500 shadow-[0_0_6px_rgba(124,58,237,0.4)]"
                        : "bg-white/[0.03] border-white/[0.15] hover:border-brand-500/40"
                    }`}
                  >
                    {selected.size === results.length && results.length > 0 && (
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </div>
                </th>
                <th className="py-2.5 px-3 text-[10px] font-mono font-semibold text-slate-600 uppercase tracking-wider">Entreprise</th>
                <th className="py-2.5 px-3 text-[10px] font-mono font-semibold text-slate-600 uppercase tracking-wider">Dirigeant</th>
                <th className="py-2.5 px-3 text-[10px] font-mono font-semibold text-slate-600 uppercase tracking-wider">Secteur</th>
                <th className="py-2.5 px-3 text-[10px] font-mono font-semibold text-slate-600 uppercase tracking-wider">Création</th>
                <th className="py-2.5 px-3 text-[10px] font-mono font-semibold text-slate-600 uppercase tracking-wider">Localisation</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => {
                const checked = selected.has(r.siren);
                const dirigeant = r.dirigeants?.[0];
                const isArtisan = !!r.siege?.activite_principale_registre_metier;
                return (
                  <tr key={r.siren}
                    onClick={() => toggleSelect(r.siren)}
                    className={[
                      "border-b border-white/[0.04] cursor-pointer transition-all group",
                      checked
                        ? "bg-brand-500/[0.08] hover:bg-brand-500/[0.12]"
                        : "hover:bg-white/[0.025]",
                    ].join(" ")}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        checked
                          ? "bg-brand-500 border-brand-500 shadow-[0_0_6px_rgba(124,58,237,0.4)]"
                          : "bg-white/[0.03] border-white/[0.15] group-hover:border-brand-500/30"
                      }`}>
                        {checked && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                    </td>

                    {/* Entreprise */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[13px] text-slate-200 leading-tight">{r.nom_complet}</span>
                        {isArtisan && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/[0.10] text-amber-400 border border-amber-500/[0.20]">
                            <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6z"/></svg>
                            RM
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono text-slate-600">{r.siren}</span>
                        {r.nature_juridique && (
                          <span className="text-[10px] px-1.5 py-px rounded bg-white/[0.04] border border-white/[0.06] text-slate-600 font-mono">
                            {NATURE_LABELS[r.nature_juridique] || r.nature_juridique}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Dirigeant */}
                    <td className="py-3 px-3">
                      {dirigeant ? (
                        <div>
                          <div className="text-[12px] text-slate-300 font-medium">{dirigeantName(dirigeant)}</div>
                          {dirigeant.qualite && (
                            <div className="text-[11px] text-slate-600 mt-0.5">{dirigeant.qualite}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[12px] text-slate-700">—</span>
                      )}
                    </td>

                    {/* Secteur NAF */}
                    <td className="py-3 px-3 max-w-[180px]">
                      <div className="text-[12px] text-slate-400 leading-tight">{nafLabel(r.activite_principale)}</div>
                      {r.activite_principale && (
                        <div className="text-[10px] font-mono text-slate-600 mt-0.5">{r.activite_principale}</div>
                      )}
                    </td>

                    {/* Date de création */}
                    <td className="py-3 px-3">
                      <span className="text-[12px] font-mono text-slate-500">{formatDate(r.date_creation)}</span>
                    </td>

                    {/* Localisation */}
                    <td className="py-3 px-3">
                      {r.siege?.adresse ? (
                        <div>
                          <div className="text-[12px] text-slate-400 leading-tight">{r.siege.adresse}</div>
                          {r.siege.libelle_commune && (
                            <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                              {r.siege.code_postal} {r.siege.libelle_commune}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[12px] text-slate-700">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {(page > 1 || hasMore) && (
        <div className="flex items-center justify-center gap-3 px-6 py-3 border-t border-white/[0.05] bg-[#080b12]/50 shrink-0">
          <button
            disabled={page <= 1}
            onClick={() => search(page - 1)}
            className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] disabled:opacity-30 text-[12px] text-slate-400 border border-white/[0.06] hover:border-white/[0.10] transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Précédent
          </button>
          <span className="text-[11px] font-mono text-slate-600 px-2">Page <span className="text-slate-400">{page}</span></span>
          <button
            disabled={!hasMore}
            onClick={() => search(page + 1)}
            className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] disabled:opacity-30 text-[12px] text-slate-400 border border-white/[0.06] hover:border-white/[0.10] transition-all"
          >
            Suivant
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}
