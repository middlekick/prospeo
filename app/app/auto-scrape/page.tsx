"use client";

import { useState, useEffect, useCallback } from "react";
import { useConfirm } from "@/components/ui/ConfirmModal";

interface Config {
  id:             string;
  metier:         string;
  ville:          string;
  pays:           string;
  nb_per_run:     number;
  enabled:        boolean;
  last_run_at:    string | null;
  last_run_added: number | null;
  created_at:     string;
}

interface RunResult {
  metier:  string;
  ville:   string;
  added:   number;
  skipped: number;
}

// ─── Formatage date ───────────────────────────────────────────────────────────
function fmtDate(iso: string | null): string {
  if (!iso) return "jamais";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function AutoScrapePage() {
  const [configs,    setConfigs]    = useState<Config[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [running,    setRunning]    = useState(false);
  const [lastResults, setLastResults] = useState<RunResult[] | null>(null);
  const confirm = useConfirm();

  // Formulaire ajout
  const [metier,    setMetier]    = useState("");
  const [ville,     setVille]     = useState("");
  const [nbPerRun,  setNbPerRun]  = useState(20);
  const [adding,    setAdding]    = useState(false);
  const [showForm,  setShowForm]  = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Chargement des configs ──────────────────────────────────────────────────
  const loadConfigs = useCallback(async () => {
    try {
      const res  = await fetch("/api/auto-scrape");
      const data = await res.json() as { configs: Config[] };
      setConfigs(data.configs || []);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConfigs(); }, [loadConfigs]);

  // ── Ajouter une config ──────────────────────────────────────────────────────
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!metier.trim() || !ville.trim()) return;
    setAdding(true);
    setFormError(null);
    try {
      const res  = await fetch("/api/auto-scrape", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ metier, ville, nb_per_run: nbPerRun }),
      });
      const data = await res.json() as { config?: unknown; error?: string };
      if (res.ok) {
        setMetier("");
        setVille("");
        setNbPerRun(20);
        setShowForm(false);
        await loadConfigs();
      } else {
        setFormError(data.error || `Erreur ${res.status}`);
      }
    } catch (err) {
      setFormError((err as Error).message || "Erreur réseau");
    } finally {
      setAdding(false);
    }
  }

  // ── Toggle enable/disable ───────────────────────────────────────────────────
  async function toggleEnabled(id: string, current: boolean) {
    await fetch("/api/auto-scrape", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id, enabled: !current }),
    });
    await loadConfigs();
  }

  // ── Supprimer ───────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    const ok = await confirm({
      title:        "Supprimer cette config ?",
      message:      "Le scraping automatique associé sera arrêté.",
      confirmLabel: "Supprimer",
      danger:       true,
    });
    if (!ok) return;
    await fetch(`/api/auto-scrape?id=${id}`, { method: "DELETE" });
    await loadConfigs();
  }

  // ── Lancer maintenant ───────────────────────────────────────────────────────
  // Utilise /api/auto-scrape/run (protégé par Clerk) — pas de secret exposé
  async function handleRunNow() {
    setRunning(true);
    setLastResults(null);
    try {
      const res  = await fetch("/api/auto-scrape/run", { method: "POST" });
      const data = await res.json() as { ok: boolean; results?: RunResult[]; totalAdded?: number; error?: string };
      if (data.ok) {
        setLastResults(data.results || []);
        await loadConfigs();
      } else {
        console.error("[auto-scrape] Erreur run:", data.error);
      }
    } finally {
      setRunning(false);
    }
  }

  const enabledCount = configs.filter(c => c.enabled).length;

  return (
    <div className="flex flex-col h-screen">
      <div className="h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent shrink-0" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 pl-14 md:pl-5 pr-5 py-3 border-b border-white/[0.06] shrink-0 bg-[#0c0e15]/60 backdrop-blur-sm">
        <div>
          <h1 className="text-sm font-semibold text-slate-100">Auto-scraping</h1>
        </div>
        <div className="flex items-center gap-1.5 ml-1">
          <span className={`w-2 h-2 rounded-full ${enabledCount > 0 ? "bg-emerald-400 animate-pulse" : "bg-slate-700"}`} />
          <span className="text-xs text-slate-600">
            {enabledCount > 0 ? `${enabledCount} config${enabledCount > 1 ? "s" : ""} active${enabledCount > 1 ? "s" : ""}` : "Inactif"}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Lancer maintenant */}
          <button
            onClick={handleRunNow}
            disabled={running || configs.filter(c => c.enabled).length === 0}
            className="flex items-center gap-1.5 h-7 px-4 rounded-lg bg-emerald-600/80 hover:bg-emerald-500
                       text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {running ? (
              <><span className="animate-spin">⟳</span> Scraping…</>
            ) : (
              "▶ Lancer maintenant"
            )}
          </button>

          {/* Ajouter une config */}
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 h-7 px-4 rounded-lg bg-violet-600 hover:bg-violet-500
                       text-white text-xs font-semibold transition-colors"
          >
            + Ajouter
          </button>
        </div>
      </header>

      {/* ── Contenu ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Bandeau info */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-violet-500/[0.06] border border-violet-500/20">
            <span className="text-lg shrink-0">⏰</span>
            <div className="text-sm text-slate-400 leading-relaxed">
              <span className="text-slate-200 font-medium">Chaque matin à 8h</span>
              {" "}— Prospeo scrape automatiquement les leads correspondant à tes configs et les ajoute à ton CRM.
              Les doublons sont automatiquement ignorés.
              Tu peux aussi lancer le scraping manuellement à tout moment.
            </div>
          </div>

          {/* Résultats du dernier run manuel */}
          {lastResults && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-emerald-500/15">
                <span className="text-emerald-400 text-sm">✓</span>
                <span className="text-xs font-semibold text-emerald-300">
                  Scraping terminé — {lastResults.reduce((s, r) => s + r.added, 0)} leads ajoutés
                </span>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {lastResults.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-slate-300">{r.metier} · {r.ville}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-emerald-400">+{r.added} ajoutés</span>
                      {r.skipped > 0 && (
                        <span className="text-xs text-slate-600">{r.skipped} doublons ignorés</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulaire d'ajout */}
          {showForm && (
            <form
              onSubmit={handleAdd}
              className="rounded-xl border border-violet-500/25 bg-violet-500/[0.04] p-4 space-y-3"
            >
              <div className="text-xs font-bold tracking-widest text-violet-400/70 mb-1">NOUVELLE CONFIG</div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-slate-600 font-medium uppercase tracking-wider block mb-1">Métier</label>
                  <input
                    value={metier}
                    onChange={e => setMetier(e.target.value)}
                    placeholder="ex: plombier"
                    required
                    className="w-full h-9 px-3 rounded-lg bg-[#13151e] border border-white/[0.08] text-sm text-slate-200
                               placeholder-slate-700 focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-slate-600 font-medium uppercase tracking-wider block mb-1">Ville</label>
                  <input
                    value={ville}
                    onChange={e => setVille(e.target.value)}
                    placeholder="ex: Lyon"
                    required
                    className="w-full h-9 px-3 rounded-lg bg-[#13151e] border border-white/[0.08] text-sm text-slate-200
                               placeholder-slate-700 focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div className="w-28">
                  <label className="text-[10px] text-slate-600 font-medium uppercase tracking-wider block mb-1">
                    Leads / run
                  </label>
                  <select
                    value={nbPerRun}
                    onChange={e => setNbPerRun(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-lg bg-[#13151e] border border-white/[0.08] text-sm text-slate-200
                               focus:outline-none focus:border-violet-500/50 [color-scheme:dark] cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={40}>40</option>
                    <option value={60}>60</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
              {formError && (
                <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  ⚠ {formError}
                </div>
              )}
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormError(null); }}
                  className="h-8 px-4 rounded-lg bg-white/[0.05] text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={adding || !metier.trim() || !ville.trim()}
                  className="h-8 px-5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold
                             transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {adding ? "Ajout…" : "Ajouter"}
                </button>
              </div>
            </form>
          )}

          {/* Liste des configs */}
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-700 text-sm">
              Chargement…
            </div>
          ) : configs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-2xl">
                🔍
              </div>
              <div className="text-center max-w-xs">
                <h2 className="text-base font-bold text-slate-200 mb-1.5">Aucune config</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Ajoute un métier + une ville et Prospeo scrape automatiquement des leads chaque matin à 8h.
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500
                           text-white text-sm font-semibold transition-colors"
              >
                + Ajouter une config
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold tracking-widest text-slate-600 uppercase">
                  {configs.length} config{configs.length > 1 ? "s" : ""}
                </span>
              </div>

              {configs.map((cfg) => (
                <div
                  key={cfg.id}
                  className={[
                    "flex items-center gap-4 px-4 py-4 rounded-xl border transition-all",
                    cfg.enabled
                      ? "border-white/[0.08] bg-white/[0.025]"
                      : "border-white/[0.04] bg-white/[0.01] opacity-50",
                  ].join(" ")}
                >
                  {/* Toggle */}
                  <button
                    onClick={() => toggleEnabled(cfg.id, cfg.enabled)}
                    title={cfg.enabled ? "Désactiver" : "Activer"}
                    className={[
                      "w-10 h-6 rounded-full relative transition-colors shrink-0",
                      cfg.enabled ? "bg-emerald-500/80" : "bg-slate-700",
                    ].join(" ")}
                  >
                    <span className={[
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                      cfg.enabled ? "left-5" : "left-1",
                    ].join(" ")} />
                  </button>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-200 capitalize">{cfg.metier}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-sm text-slate-300">{cfg.ville}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-slate-500 mono">
                        {cfg.nb_per_run} leads/run
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      {cfg.last_run_at ? (
                        <>
                          Dernier run : <span className="text-slate-500">{fmtDate(cfg.last_run_at)}</span>
                          {cfg.last_run_added !== null && (
                            <> · <span className="text-emerald-500/80">+{cfg.last_run_added} ajoutés</span></>
                          )}
                        </>
                      ) : (
                        "Pas encore exécuté"
                      )}
                    </div>
                  </div>

                  {/* Supprimer */}
                  <button
                    onClick={() => handleDelete(cfg.id)}
                    className="h-7 w-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20
                               text-red-400 text-xs transition-all shrink-0"
                    title="Supprimer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Note technique */}
          <div className="text-xs text-slate-700 text-center pt-2">
            Cron déclenché quotidiennement à 8h UTC (9h heure française en hiver, 10h en été)
          </div>

        </div>
      </div>
    </div>
  );
}
