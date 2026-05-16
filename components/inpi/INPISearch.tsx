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
      {/* Header */}
      <header className="pl-14 md:pl-5 pr-5 py-3 border-b border-white/[0.06] shrink-0 bg-[#0c0e15]/60 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-sm font-semibold text-slate-100 tracking-tight">Recherche INPI — Entreprises récentes</h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Source officielle : registre-entreprises.api.gouv.fr
              {total > 0 && (
                <span className="ml-2 text-violet-400 mono">
                  ~{total.toLocaleString("fr-FR")} dans l&apos;API
                  {results.length > 0 && <span className="text-slate-600"> · {results.length} affichés</span>}
                </span>
              )}
            </p>
          </div>
          <div className="text-xs text-slate-600 bg-white/[0.04] rounded-xl px-3 py-2 border border-white/[0.08] max-w-xs shrink-0">
            ⚠️ Les numéros ne sont pas dans les données RNE. Ils sont enrichis automatiquement après import.
          </div>
        </div>
      </header>

      {/* Formulaire */}
      <div className="px-5 py-4 border-b border-white/[0.06] shrink-0 space-y-3 bg-white/[0.01]">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Recherche libre</label>
            <input value={q} onChange={e => setQ(e.target.value)}
              placeholder="plombier, maçon, SARL…"
              onKeyDown={e => e.key === "Enter" && search(1)}
              className="h-8 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 w-52"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Département</label>
            <div className="relative w-48">
              <select value={dept} onChange={e => setDept(e.target.value)}
                className="appearance-none h-8 w-full pl-2 pr-7 rounded-md bg-[#16181f] border border-white/10
                           text-sm text-slate-200 focus:outline-none focus:border-violet-500/50
                           cursor-pointer [color-scheme:dark]">
                <option value="">Tous les départements</option>
                {DEPARTEMENTS.map(([code, label]) => (
                  <option key={code} value={code}>{code} — {label}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">▾</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Secteur (NAF)</label>
            <div className="relative w-56">
              <select value={naf} onChange={e => setNaf(e.target.value)}
                className="appearance-none h-8 w-full pl-2 pr-7 rounded-md bg-[#16181f] border border-white/10
                           text-sm text-slate-200 focus:outline-none focus:border-violet-500/50
                           cursor-pointer [color-scheme:dark]">
                <option value="">Tous secteurs</option>
                {NAF_SUGGESTIONS.map(([code, label]) => (
                  <option key={code} value={code}>{code} — {label}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">▾</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Créées il y a (max ans)</label>
            <input type="number" value={annees} min={1} max={10}
              onChange={e => setAnnees(Number(e.target.value))}
              className="h-8 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50 w-20 mono"
            />
          </div>

          <button onClick={() => search(1)} disabled={loading}
            className="h-8 px-5 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-sm font-medium text-white transition-colors">
            {loading ? "Recherche…" : "Rechercher"}
          </button>
        </div>

        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <input type="checkbox" checked={rmOnly} onChange={e => setRmOnly(e.target.checked)}
            className="w-3.5 h-3.5 accent-violet-500" />
          <span className="text-xs text-slate-400">Artisans seulement (inscrits au Registre des Métiers)</span>
        </label>

        {error && <p className="text-xs text-red-400 mono">{error}</p>}
      </div>

      {/* Barre actions */}
      {results.length > 0 && (
        <div className="flex items-center justify-between px-5 py-2 border-b border-white/[0.06] bg-white/[0.025] shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={toggleAll} className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
              {selected.size === results.length ? "Tout désélectionner" : "Tout sélectionner"}
            </button>
            {selected.size > 0 && <span className="text-xs text-violet-400">{selected.size} sélectionné(s)</span>}
          </div>
          <div className="flex items-center gap-2">
            {importMsg && (
              <span className={`text-xs mono ${importMsg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
                {importMsg}
              </span>
            )}
            <button
              onClick={importSelected}
              disabled={!selected.size || importing}
              className="h-7 px-4 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-xs font-medium text-white transition-colors"
            >
              {importing ? "Import…" : `Ajouter ${selected.size || ""} au CRM`}
            </button>
          </div>
        </div>
      )}

      {/* Résultats */}
      <div className="flex-1 overflow-auto">
        {!searched && !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-600 gap-3">
            <span className="text-4xl">🏛</span>
            <p className="text-sm font-medium">Recherchez des entreprises créées récemment</p>
            <p className="text-xs">Département + NAF + ancienneté → leads qualifiés à importer directement</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-24 text-slate-500 text-sm">Recherche en cours…</div>
        )}

        {searched && !loading && results.length === 0 && (
          <div className="flex items-center justify-center py-24 text-slate-600 text-sm">Aucun résultat pour ces critères</div>
        )}

        {results.length > 0 && (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-xs text-slate-600 border-b border-white/5 sticky top-0 bg-[#0b0d12]">
                <th className="py-2 px-3 w-8" />
                <th className="py-2 px-3">Entreprise</th>
                <th className="py-2 px-3">Dirigeant</th>
                <th className="py-2 px-3">Secteur</th>
                <th className="py-2 px-3">Création</th>
                <th className="py-2 px-3">Localisation</th>
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
                      "border-b border-white/5 cursor-pointer transition-colors",
                      checked ? "bg-violet-500/10 hover:bg-violet-500/15" : "hover:bg-white/3",
                    ].join(" ")}
                  >
                    <td className="py-2.5 px-3">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center text-xs transition-colors ${checked ? "bg-violet-500 border-violet-500 text-white" : "border-white/20"}`}>
                        {checked && "✓"}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-200">{r.nom_complet}</span>
                        {isArtisan && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-amber-900/40 text-amber-400 border border-amber-500/20 font-medium">RM</span>
                        )}
                      </div>
                      <div className="mono text-xs text-slate-600 mt-0.5">
                        {r.siren}
                        {r.nature_juridique && <span className="ml-2 text-slate-700">{NATURE_LABELS[r.nature_juridique] || r.nature_juridique}</span>}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-xs">
                      {dirigeant ? (
                        <div>
                          <div>{dirigeantName(dirigeant)}</div>
                          {dirigeant.qualite && <div className="text-slate-600">{dirigeant.qualite}</div>}
                        </div>
                      ) : <span className="text-slate-700">—</span>}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-xs max-w-[180px]">
                      {nafLabel(r.activite_principale)}
                      {r.activite_principale && <div className="mono text-slate-600">{r.activite_principale}</div>}
                    </td>
                    <td className="py-2.5 px-3 mono text-xs text-slate-500">{formatDate(r.date_creation)}</td>
                    <td className="py-2.5 px-3 text-xs text-slate-500">
                      {r.siege?.adresse
                        ? <div>{r.siege.adresse}</div>
                        : <span className="text-slate-700">—</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination — basée sur has_more (résultats réels filtrés) */}
      {(page > 1 || hasMore) && (
        <div className="flex items-center justify-center gap-3 px-6 py-3 border-t border-white/5 shrink-0">
          <button disabled={page <= 1} onClick={() => search(page - 1)}
            className="h-7 px-3 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-30 text-xs text-slate-400 transition-colors">
            ← Précédent
          </button>
          <span className="mono text-xs text-slate-500">Page {page}</span>
          <button disabled={!hasMore} onClick={() => search(page + 1)}
            className="h-7 px-3 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-30 text-xs text-slate-400 transition-colors">
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}
