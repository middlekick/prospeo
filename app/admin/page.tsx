"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/components/ui/Toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClerkInfo {
  email:          string;
  firstName:      string;
  lastName:       string;
  imageUrl:       string;
  lastSignInAt:   string | null;
  clerkCreatedAt: string | null;
  twoFactor:      boolean;
}

interface UserRow {
  id:               string;
  user_id:          string;
  plan:             string;
  stripe_status:    string | null;
  trial_expires_at: string | null;
  trial_code_used:  string | null;
  scrape_count:     number;
  db_created_at:    string;
  leadCount:        number;
  activityCount:    number;
  tags:             Record<string, number>;
  lastLeadAt:       string | null;
  clerk:            ClerkInfo | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function planBadge(plan: string, trialExpires: string | null) {
  const live = trialExpires && new Date(trialExpires) > new Date();
  if (live)              return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">⏱ Trial Pro</span>;
  if (plan === "pro")    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/15 text-violet-300 border border-violet-500/25">Pro</span>;
  if (plan === "agency") return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">Agence</span>;
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/[0.06] text-slate-500 border border-white/[0.08]">Free</span>;
}

function trialLabel(expiry: string | null): string {
  if (!expiry) return "—";
  const diff = new Date(expiry).getTime() - Date.now();
  if (diff <= 0) return "Expiré";
  const days = Math.ceil(diff / 86400000);
  return `${days}j`;
}

function relativeDate(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 2)  return "À l'instant";
  if (hours < 1)  return `Il y a ${mins} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days  < 7)  return `Il y a ${days}j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const TAG_COLORS: Record<string, string> = {
  non_appele:    "bg-slate-700/60 text-slate-400",
  ne_repond_pas: "bg-orange-500/20 text-orange-300",
  interesse:     "bg-cyan-500/20 text-cyan-300",
  rdv_pris:      "bg-green-500/20 text-green-300",
  pas_interesse: "bg-red-500/20 text-red-300",
};
const TAG_LABEL: Record<string, string> = {
  non_appele: "Non app.", ne_repond_pas: "NRP", interesse: "Intéressé", rdv_pris: "RDV", pas_interesse: "Non",
};

// ── Composant ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user: clerkUser }       = useUser();
  const [users,   setUsers]       = useState<UserRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error,   setError]       = useState("");
  const [search,  setSearch]      = useState("");
  const [filter,  setFilter]      = useState<"all"|"free"|"trial"|"pro"|"agency">("all");
  const [busy,    setBusy]        = useState<string | null>(null);  // user_id en cours d'action
  const { success, error: toastError, info } = useToast();
  const [expanded, setExpanded]   = useState<string | null>(null);  // user_id déplié

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/users")
      .then(async r => {
        if (r.status === 403) throw new Error("Accès refusé — votre user_id Clerk doit être dans ADMIN_USER_IDS.");
        if (!r.ok)            throw new Error("Erreur serveur");
        return r.json();
      })
      .then((d: { users: UserRow[] }) => setUsers(d.users))
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Actions ──────────────────────────────────────────────────────────────

  async function setPlan(userId: string, plan: string, trialDays?: number) {
    setBusy(userId);
    try {
      const res  = await fetch("/api/admin/plan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan, trialDays }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!data.success) throw new Error(data.error || "Erreur");
      setUsers(prev => prev.map(u => u.user_id !== userId ? u : {
        ...u,
        plan,
        stripe_status:    plan !== "free" ? "active" : null,
        trial_expires_at: trialDays
          ? new Date(Date.now() + trialDays * 86400000).toISOString()
          : (plan === "free" ? null : u.trial_expires_at),
      }));
    } catch (e) { toastError(`Erreur : ${(e as Error).message}`); }
    finally { setBusy(null); }
  }

  async function sendResetEmail(user: UserRow) {
    if (!user.clerk?.email) { toastError("Email introuvable pour cet utilisateur"); return; }
    setBusy(user.user_id + "_reset");
    try {
      const res  = await fetch("/api/admin/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.user_id, email: user.clerk.email, firstName: user.clerk.firstName }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!data.success) throw new Error(data.error || "Erreur");
      success(`Email de connexion envoyé à ${user.clerk.email}`);
    } catch (e) { toastError(`Erreur : ${(e as Error).message}`); }
    finally { setBusy(null); }
  }

  async function deleteUser(user: UserRow) {
    const name = user.clerk ? `${user.clerk.firstName} ${user.clerk.lastName}`.trim() || user.clerk.email : user.user_id;
    if (!confirm(`⚠️ Supprimer définitivement le compte de "${name}" ?\n\nCette action supprime :\n• Son compte Clerk (accès perdu)\n• Tous ses leads (${user.leadCount})\n• Son abonnement\n\nImpossible d'annuler.`)) return;
    setBusy(user.user_id + "_delete");
    try {
      const res  = await fetch("/api/admin/delete-user", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.user_id }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!data.success) throw new Error(data.error || "Erreur");
      setUsers(prev => prev.filter(u => u.user_id !== user.user_id));
      info("Compte supprimé");
    } catch (e) { toastError(`Erreur : ${(e as Error).message}`); }
    finally { setBusy(null); }
  }

  // ── Filtres ───────────────────────────────────────────────────────────────

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      u.clerk?.email.toLowerCase().includes(q) ||
      u.clerk?.firstName.toLowerCase().includes(q) ||
      u.clerk?.lastName.toLowerCase().includes(q);

    const isTrialActive = u.trial_expires_at && new Date(u.trial_expires_at) > new Date();
    const matchFilter =
      filter === "all"    ? true :
      filter === "trial"  ? !!isTrialActive :
      filter === "pro"    ? (u.plan === "pro" && !isTrialActive) :
      filter === "agency" ? u.plan === "agency" :
                            u.plan === "free" && !isTrialActive;

    return matchSearch && matchFilter;
  });

  // Compteurs
  const counts = {
    all:    users.length,
    free:   users.filter(u => u.plan === "free" && !(u.trial_expires_at && new Date(u.trial_expires_at) > new Date())).length,
    trial:  users.filter(u => u.trial_expires_at && new Date(u.trial_expires_at) > new Date()).length,
    pro:    users.filter(u => u.plan === "pro"    && !(u.trial_expires_at && new Date(u.trial_expires_at) > new Date())).length,
    agency: users.filter(u => u.plan === "agency").length,
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-screen text-slate-600 text-sm">Chargement…</div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 px-6">
      <div className="text-4xl">🔒</div>
      <p className="text-slate-400 text-sm font-medium">{error}</p>
      <div className="bg-[#13151e] border border-white/[0.08] rounded-xl p-5 max-w-md w-full space-y-3">
        <p className="text-xs text-slate-500 leading-relaxed">
          Pour activer l&apos;accès admin, copiez votre <strong className="text-slate-300">user_id Clerk</strong> ci-dessous
          et collez-le dans <code className="mono bg-white/[0.06] px-1 rounded text-violet-300">ADMIN_USER_IDS</code> dans le fichier <code className="mono bg-white/[0.06] px-1 rounded">.env</code>.
        </p>
        {clerkUser?.id && (
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs mono bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-violet-300 break-all">
              {clerkUser.id}
            </code>
            <button onClick={() => navigator.clipboard.writeText(clerkUser.id)}
              className="h-8 px-3 rounded-lg bg-violet-500/15 border border-violet-500/25 text-violet-400 text-xs hover:bg-violet-500/25 transition-all shrink-0">
              Copier
            </button>
          </div>
        )}
        <p className="text-[10px] text-slate-700">Puis redémarrez le serveur et rechargez cette page.</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen">
      <div className="h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent shrink-0" />

      {/* Header */}
      <header className="shrink-0 px-5 py-3 border-b border-white/[0.06] bg-[#0c0e15]/60 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-semibold text-slate-100">Administration</h1>
          <button onClick={load} className="text-xs text-slate-600 hover:text-slate-300 transition-colors">↻ Actualiser</button>

          {/* Filtres plan */}
          <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 ml-2">
            {(["all","free","trial","pro","agency"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={[
                  "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1",
                  filter === f ? "bg-violet-500/20 text-violet-200" : "text-slate-600 hover:text-slate-300",
                ].join(" ")}>
                {f === "all" ? "Tous" : f === "trial" ? "Trial" : f === "free" ? "Free" : f === "pro" ? "Pro" : "Agence"}
                <span className="text-[10px] mono opacity-60">{counts[f]}</span>
              </button>
            ))}
          </div>

          {/* Stats rapides */}
          <div className="hidden xl:flex items-center gap-4 ml-2 pl-4 border-l border-white/[0.06]">
            {[
              { label: "Leads total", value: users.reduce((s, u) => s + u.leadCount, 0),     color: "text-slate-300" },
              { label: "Activités",   value: users.reduce((s, u) => s + u.activityCount, 0), color: "text-violet-400" },
              { label: "Scrapes",     value: users.reduce((s, u) => s + u.scrape_count, 0),  color: "text-cyan-400" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={`text-sm font-bold mono ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-slate-700">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Recherche */}
          <div className="ml-auto relative">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Nom, email…"
              className="h-7 pl-7 pr-3 w-44 rounded-lg bg-white/[0.05] border border-white/[0.08]
                         text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-violet-500/40"/>
            <svg className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600" width="11" height="11"
                 viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
        </div>
      </header>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider
                           border-b border-white/[0.06] sticky top-0 bg-[#0b0d12]/95 backdrop-blur-sm">
              <th className="py-2.5 px-4 w-[240px]">Utilisateur</th>
              <th className="py-2.5 px-3">Plan</th>
              <th className="py-2.5 px-3">Trial</th>
              <th className="py-2.5 px-3">Leads</th>
              <th className="py-2.5 px-3">Activités</th>
              <th className="py-2.5 px-3">Scrapes</th>
              <th className="py-2.5 px-3">Dernière connexion</th>
              <th className="py-2.5 px-3">Inscrit</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => {
              const name      = user.clerk ? `${user.clerk.firstName} ${user.clerk.lastName}`.trim() || user.clerk.email : user.user_id;
              const isExpanded = expanded === user.user_id;
              const isBusy    = busy === user.user_id || busy === user.user_id + "_reset" || busy === user.user_id + "_delete";

              return (
                <>
                  <tr key={user.user_id}
                    onClick={() => setExpanded(isExpanded ? null : user.user_id)}
                    className="border-b border-white/[0.04] hover:bg-white/[0.025] transition-colors cursor-pointer">

                    {/* Utilisateur */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {user.clerk?.imageUrl
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={user.clerk.imageUrl} alt="" className="w-7 h-7 rounded-full shrink-0"/>
                          : <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center text-xs text-violet-300 shrink-0 font-semibold">
                              {user.clerk?.firstName?.[0]?.toUpperCase() || "?"}
                            </div>
                        }
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-200 truncate max-w-[160px]">{name}</div>
                          <div className="text-[10px] text-slate-600 truncate max-w-[160px]">{user.clerk?.email}</div>
                        </div>
                        <span className="text-slate-700 text-xs ml-auto">{isExpanded ? "▾" : "▸"}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">{planBadge(user.plan, user.trial_expires_at)}</td>

                    <td className="py-3 px-3">
                      <span className={`text-xs mono font-medium ${
                        user.trial_expires_at && new Date(user.trial_expires_at) > new Date()
                          ? "text-amber-400" : "text-slate-700"
                      }`}>{trialLabel(user.trial_expires_at)}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-sm mono text-slate-300 font-semibold">{user.leadCount}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-xs mono text-slate-500">{user.activityCount}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-xs mono text-slate-600">{user.scrape_count}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-xs text-slate-500">{relativeDate(user.clerk?.lastSignInAt ?? null)}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-xs mono text-slate-700">
                        {user.clerk?.clerkCreatedAt
                          ? new Date(user.clerk.clerkCreatedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" })
                          : "—"}
                      </span>
                    </td>

                    {/* Actions rapides */}
                    <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setPlan(user.user_id, "pro", 7)}
                          disabled={isBusy}
                          title="Trial Pro 7 jours"
                          className="h-6 px-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-medium hover:bg-amber-500/20 transition-all disabled:opacity-30">
                          {busy === user.user_id ? "…" : "+7j"}
                        </button>
                        <button onClick={() => setPlan(user.user_id, user.plan === "pro" ? "free" : "pro")}
                          disabled={isBusy}
                          title={user.plan === "pro" ? "Repasser en Free" : "Passer en Pro"}
                          className={`h-6 px-2 rounded-md text-[10px] font-medium transition-all disabled:opacity-30 ${
                            user.plan === "pro"
                              ? "bg-white/[0.05] border border-white/[0.08] text-slate-500 hover:bg-white/[0.09]"
                              : "bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20"
                          }`}>
                          {user.plan === "pro" ? "→ Free" : "→ Pro"}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Ligne dépliée */}
                  {isExpanded && (
                    <tr key={user.user_id + "_expanded"} className="border-b border-white/[0.04] bg-white/[0.015]">
                      <td colSpan={9} className="px-4 py-4">
                        <div className="flex gap-6 flex-wrap">

                          {/* Distribution des tags */}
                          <div className="min-w-[180px]">
                            <p className="text-[10px] font-bold tracking-widest text-slate-600 uppercase mb-2">Répartition leads</p>
                            <div className="space-y-1">
                              {Object.entries(user.tags).sort((a,b) => b[1]-a[1]).map(([tag, count]) => (
                                <div key={tag} className="flex items-center gap-2">
                                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${TAG_COLORS[tag] || "bg-slate-700 text-slate-400"}`}>
                                    {TAG_LABEL[tag] || tag}
                                  </span>
                                  <span className="text-xs mono text-slate-500">{count}</span>
                                  <div className="flex-1 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                                    <div className="h-full bg-violet-500/40 rounded-full"
                                      style={{ width: `${Math.round((count / user.leadCount) * 100)}%` }}/>
                                  </div>
                                  <span className="text-[10px] text-slate-700 w-7 text-right">
                                    {Math.round((count / user.leadCount) * 100)}%
                                  </span>
                                </div>
                              ))}
                              {Object.keys(user.tags).length === 0 && (
                                <p className="text-xs text-slate-700">Aucun lead</p>
                              )}
                            </div>
                          </div>

                          {/* Infos compte */}
                          <div className="min-w-[200px] space-y-1.5">
                            <p className="text-[10px] font-bold tracking-widest text-slate-600 uppercase mb-2">Compte</p>
                            {[
                              { label: "User ID",        value: user.user_id, mono: true },
                              { label: "Code trial",     value: user.trial_code_used || "—", mono: true },
                              { label: "Exp. trial",     value: user.trial_expires_at ? new Date(user.trial_expires_at).toLocaleDateString("fr-FR") : "—" },
                              { label: "2FA",            value: user.clerk?.twoFactor ? "✅ Activé" : "Non" },
                              { label: "Dernier lead",   value: relativeDate(user.lastLeadAt) },
                            ].map(row => (
                              <div key={row.label} className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-600 w-20 shrink-0">{row.label}</span>
                                <span className={`text-[11px] ${row.mono ? "mono text-slate-400 break-all" : "text-slate-400"}`}>
                                  {row.value}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Actions avancées */}
                          <div className="min-w-[220px]">
                            <p className="text-[10px] font-bold tracking-widest text-slate-600 uppercase mb-2">Actions</p>
                            <div className="space-y-2">

                              {/* Trial personnalisé */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-600 w-20 shrink-0">Trial custom</span>
                                {[3, 7, 14, 30].map(d => (
                                  <button key={d} onClick={() => setPlan(user.user_id, "pro", d)}
                                    disabled={isBusy}
                                    className="h-6 px-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] hover:bg-amber-500/20 transition-all disabled:opacity-30">
                                    {d}j
                                  </button>
                                ))}
                              </div>

                              {/* Pro / Agency permanent */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-600 w-20 shrink-0">Plan</span>
                                {["pro", "agency", "free"].map(p => (
                                  <button key={p} onClick={() => setPlan(user.user_id, p)}
                                    disabled={isBusy || user.plan === p}
                                    className={`h-6 px-2 rounded-md text-[10px] font-medium transition-all disabled:opacity-30 ${
                                      p === "pro"    ? "bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20" :
                                      p === "agency" ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20" :
                                                       "bg-white/[0.05] border border-white/[0.08] text-slate-500 hover:bg-white/[0.09]"
                                    } ${user.plan === p ? "opacity-30 cursor-default" : ""}`}>
                                    {p === "pro" ? "Pro ∞" : p === "agency" ? "Agence" : "Free"}
                                  </button>
                                ))}
                              </div>

                              {/* Reset accès + Supprimer */}
                              <div className="flex items-center gap-2 pt-1">
                                <button onClick={() => sendResetEmail(user)}
                                  disabled={busy === user.user_id + "_reset"}
                                  title="Envoyer un lien de connexion par email"
                                  className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-blue-500/10 border border-blue-500/20
                                             text-blue-400 text-[11px] font-medium hover:bg-blue-500/20 transition-all disabled:opacity-30">
                                  {busy === user.user_id + "_reset" ? "Envoi…" : "✉ Envoyer lien de connexion"}
                                </button>
                                <button onClick={() => deleteUser(user)}
                                  disabled={busy === user.user_id + "_delete"}
                                  title="Supprimer le compte définitivement"
                                  className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-red-500/10 border border-red-500/20
                                             text-red-400 text-[11px] font-medium hover:bg-red-500/20 transition-all disabled:opacity-30">
                                  {busy === user.user_id + "_delete" ? "Suppression…" : "🗑 Supprimer"}
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-16 text-slate-600 text-sm">
            {search || filter !== "all" ? "Aucun résultat pour ce filtre" : "Aucun utilisateur inscrit"}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-2 border-t border-white/[0.04] shrink-0 flex items-center justify-between">
        <p className="text-[10px] text-slate-700">
          {filtered.length} utilisateur{filtered.length > 1 ? "s" : ""} affichés
        </p>
        <p className="text-[10px] text-slate-700">
          Code actif : <code className="mono text-violet-600">{process.env.NEXT_PUBLIC_APP_URL ? "" : "FORMATION2025"}</code>
        </p>
      </div>
    </div>
  );
}
