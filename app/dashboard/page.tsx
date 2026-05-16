"use client";

import { useState, useEffect, useMemo } from "react";
import Link                               from "next/link";
import { Lead, TAG_COLORS }              from "@/components/leads/types";
import { usePlan }                        from "@/hooks/usePlan";

// ── Helpers ───────────────────────────────────────────────────────────────────

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function last30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => isoNDaysAgo(29 - i));
}

function formatDayLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatDayShort(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return ["Di","Lu","Ma","Me","Je","Ve","Sa"][d.getDay()];
}

function isWeekend(iso: string): boolean {
  const d = new Date(iso + "T00:00:00").getDay();
  return d === 0 || d === 6;
}

// ── Graphique 30 jours (SVG pur) ──────────────────────────────────────────────

interface ChartPoint { date: string; contacted: number; added: number; }

function ActivityChart({ data }: { data: ChartPoint[] }) {
  const [hovered, setHovered] = useState<ChartPoint & { x: number } | null>(null);

  const maxVal = Math.max(...data.map(d => Math.max(d.contacted, d.added)), 1);
  const W = 560; const H = 80; const BAR_W = Math.floor(W / data.length) - 2;

  return (
    <div className="relative select-none">
      <svg
        viewBox={`0 0 ${W} ${H + 24}`}
        className="w-full"
        onMouseLeave={() => setHovered(null)}
      >
        {data.map((d, i) => {
          const x      = i * (W / data.length);
          const hAdded = d.added     > 0 ? Math.max(3, Math.round((d.added     / maxVal) * H)) : 0;
          const hCont  = d.contacted > 0 ? Math.max(3, Math.round((d.contacted / maxVal) * H)) : 0;
          const weekend = isWeekend(d.date);

          return (
            <g key={d.date}
              onMouseEnter={() => setHovered({ ...d, x })}
              style={{ cursor: "default" }}
            >
              {/* Fond weekend discret */}
              {weekend && (
                <rect x={x} y={0} width={BAR_W + 2} height={H} fill="rgba(255,255,255,0.015)" rx={1} />
              )}
              {/* Barre ajoutés (cyan, derrière) */}
              {hAdded > 0 && (
                <rect
                  x={x + 1} y={H - hAdded} width={BAR_W} height={hAdded} rx={2}
                  fill={hovered?.date === d.date ? "#22d3ee" : "rgba(34,211,238,0.25)"}
                  className="transition-colors duration-100"
                />
              )}
              {/* Barre contactés (violet, devant) */}
              {hCont > 0 && (
                <rect
                  x={x + 1} y={H - hCont} width={BAR_W} height={hCont} rx={2}
                  fill={hovered?.date === d.date ? "#a78bfa" : "rgba(139,92,246,0.6)"}
                  className="transition-colors duration-100"
                />
              )}
              {/* Label jour (tous les 5) */}
              {i % 5 === 0 && (
                <text x={x + BAR_W / 2} y={H + 16} textAnchor="middle" fontSize={8}
                  fill={weekend ? "#475569" : "#334155"}>
                  {formatDayShort(d.date)}
                </text>
              )}
            </g>
          );
        })}

        {/* Ligne de base */}
        <line x1={0} y1={H} x2={W} y2={H} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      </svg>

      {/* Tooltip au survol */}
      {hovered && (
        <div
          className="absolute bottom-8 pointer-events-none z-10 bg-[#1a1d27] border border-white/15 rounded-lg px-3 py-2 text-xs shadow-xl"
          style={{ left: Math.min(hovered.x, W - 130), transform: "translateX(-20%)" }}
        >
          <div className="font-medium text-slate-200 mb-1.5">{formatDayLabel(hovered.date)}</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
            <span className="text-slate-400">{hovered.contacted} contacté{hovered.contacted > 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
            <span className="text-slate-400">{hovered.added} ajouté{hovered.added > 1 ? "s" : ""}</span>
          </div>
        </div>
      )}

      {/* Légende */}
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="w-2.5 h-2.5 rounded-sm bg-violet-500/60 inline-block" />
          Contactés
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/30 inline-block" />
          Ajoutés
        </div>
      </div>
    </div>
  );
}

// ── Entonnoir de conversion ───────────────────────────────────────────────────

function FunnelBar({
  label, count, total, color, bg, sub,
}: {
  label: string; count: number; total: number;
  color: string; bg: string; sub?: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <span className="text-xs text-slate-400">{label}</span>
          {sub && <span className="text-xs text-slate-700 ml-1.5">{sub}</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-sm font-bold mono ${color}`}>{count}</span>
          <span className="text-xs text-slate-700 w-8 text-right">{pct}%</span>
        </div>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${bg}`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Carte stat ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, color, iconBg, icon, glow,
}: {
  label: string; value: number | string; sub?: string;
  color: string; iconBg: string; icon: string; glow?: string;
}) {
  return (
    <div className={`rounded-2xl border border-white/[0.10] bg-white/[0.06] p-5 flex flex-col gap-3 transition-all hover:bg-white/[0.09] ${glow || ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <span className="text-xs text-slate-500 text-right leading-snug">{label}</span>
      </div>
      <div className={`text-4xl font-bold mono leading-none ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-600 leading-snug">{sub}</div>}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

type Period = "day" | "week" | "month";

const PERIOD_LABELS: Record<Period, string> = {
  day:   "Aujourd'hui",
  week:  "7 derniers jours",
  month: "30 derniers jours",
};

const TAG_LABEL: Record<string, string> = {
  non_appele:    "Non appelé",
  ne_repond_pas: "Ne répond pas",
  interesse:     "Intéressé",
  rdv_pris:      "RDV pris",
  pas_interesse: "Pas intéressé",
};

export default function DashboardPage() {
  const [leads,   setLeads]   = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState<Period>("week");
  const { plan, loading: planLoading } = usePlan();

  useEffect(() => {
    fetch("/api/leads")
      .then(r => r.json())
      .then(d => { setLeads(d.artisans || []); setLoading(false); });
  }, []);

  const today   = isoToday();
  const days30  = useMemo(() => last30Days(), []);

  const stats = useMemo(() => {
    // Borne de la période sélectionnée
    const cutoff = period === "day"   ? today
                 : period === "week"  ? isoNDaysAgo(6)
                 :                     isoNDaysAgo(29);

    // ── Métriques de la période ──────────────────────────────────────────
    const contactedPeriod = leads.filter(l => l.contacted_at && l.contacted_at >= cutoff && l.contacted_at <= today).length;
    const addedPeriod     = leads.filter(l => l.created_at   && l.created_at   >= cutoff && l.created_at   <= today).length;
    const rdvPeriod       = leads.filter(l => l.rdv_date     && l.rdv_date     >= today).length;
    const rappelsDus      = leads.filter(l => l.rappel       && l.rappel       <= today).length;

    // ── Entonnoir (toujours sur l'ensemble des leads) ────────────────────
    const total         = leads.length;
    const nonContactes  = leads.filter(l => l.tag === "non_appele").length;
    const contactes     = total - nonContactes;
    const neRepond      = leads.filter(l => l.tag === "ne_repond_pas").length;
    const interesses    = leads.filter(l => l.tag === "interesse").length;
    const rdvPris       = leads.filter(l => l.tag === "rdv_pris").length;
    const pasInteresse  = leads.filter(l => l.tag === "pas_interesse").length;

    // "Vrais conversations" = ceux qui ont décroché et répondu (intéressé + RDV pris + pas intéressé)
    // Ne répond pas n'est PAS compté dans le closing — ils n'ont pas eu de vraie conversation
    const vraisConversations = interesses + rdvPris + pasInteresse;

    const tauxContact   = total               > 0 ? Math.round((contactes          / total)               * 100) : 0;
    const tauxInteret   = vraisConversations  > 0 ? Math.round(((interesses + rdvPris) / vraisConversations) * 100) : 0;
    const tauxRdv       = vraisConversations  > 0 ? Math.round((rdvPris             / vraisConversations)   * 100) : 0;

    // ── Graphique 30 jours ───────────────────────────────────────────────
    const chart: ChartPoint[] = days30.map(d => ({
      date:       d,
      contacted:  leads.filter(l => l.contacted_at === d).length,
      added:      leads.filter(l => l.created_at   === d).length,
    }));

    // Total activité sur 30 jours
    const totalContacted30 = chart.reduce((s, d) => s + d.contacted, 0);
    const bestDay = [...chart].sort((a, b) => b.contacted - a.contacted)[0];

    // ── Prochains RDV ────────────────────────────────────────────────────
    const upcomingRdv = leads
      .filter(l => l.rdv_date && l.rdv_date >= today)
      .sort((a, b) => a.rdv_date.localeCompare(b.rdv_date))
      .slice(0, 6);

    // ── Derniers leads contactés ─────────────────────────────────────────
    const recentlyContacted = leads
      .filter(l => l.contacted_at)
      .sort((a, b) => b.contacted_at.localeCompare(a.contacted_at))
      .slice(0, 8);

    return {
      contactedPeriod, addedPeriod, rdvPeriod, rappelsDus,
      total, nonContactes, contactes, neRepond, interesses, rdvPris, pasInteresse,
      vraisConversations,
      tauxContact, tauxInteret, tauxRdv,
      chart, totalContacted30, bestDay,
      upcomingRdv, recentlyContacted,
    };
  }, [leads, period, today, days30]);

  // Export CSV du bilan
  function exportDashboardCSV() {
    const rows = [
      ["Métrique", "Valeur"],
      ["Total leads", stats.total],
      ["Non contactés", stats.nonContactes],
      ["Contactés", stats.contactes],
      ["Ne répond pas", stats.neRepond],
      ["Intéressés", stats.interesses],
      ["RDV pris", stats.rdvPris],
      ["Pas intéressés", stats.pasInteresse],
      ["Taux de contact", `${stats.tauxContact}%`],
      ["Taux d'intérêt", `${stats.tauxInteret}%`],
      ["Taux RDV", `${stats.tauxRdv}%`],
    ];
    const csv  = rows.map(r => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `prospeo_bilan_${today}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading || planLoading) {
    return (
      <div className="flex flex-col h-screen">
        <div className="h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent shrink-0" />
        <div className="h-[52px] border-b border-white/[0.06] shrink-0 bg-[#0c0e15]/60" />
        <div className="flex-1 px-6 py-6 max-w-[1200px] w-full mx-auto space-y-4 animate-pulse">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-white/[0.04] border border-white/[0.06]" />
            ))}
          </div>
          <div className="grid grid-cols-[1fr_320px] gap-4">
            <div className="h-52 rounded-2xl bg-white/[0.04] border border-white/[0.06]" />
            <div className="h-52 rounded-2xl bg-white/[0.04] border border-white/[0.06]" />
          </div>
        </div>
      </div>
    );
  }

  // ── Plan free : page de verrouillage ───────────────────────────────────────
  if (plan === "free") {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-5 px-6">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-3xl z-10 relative">📊</div>
          <div className="absolute inset-0 rounded-2xl bg-violet-500/10 blur-xl" />
        </div>
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-slate-100 mb-2">Dashboard analytics</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Les métriques de prospection, graphiques 30 jours et funnel de conversion
            sont réservés au plan <span className="text-violet-300 font-medium">Pro</span>.
          </p>
        </div>
        <Link
          href="/landing#pricing"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shadow-[0_0_20px_rgba(124,58,237,0.3)]"
        >
          Passer Pro — 19 €/mois →
        </Link>
        <p className="text-xs text-slate-700">14 jours gratuits · annulable à tout moment</p>
      </div>
    );
  }

  const periodLabel = PERIOD_LABELS[period];

  return (
    <div className="flex flex-col h-screen overflow-auto">
      {/* Ligne gradient haut */}
      <div className="h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent shrink-0" />

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] shrink-0 bg-[#0c0e15]/60 backdrop-blur-sm">
        <div>
          <h1 className="text-sm font-semibold text-slate-100 tracking-tight">Tableau de bord</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            {stats.totalContacted30} leads contactés sur 30 jours
            {stats.bestDay?.contacted > 0 && (
              <span className="ml-2 text-violet-400">
                · record : {stats.bestDay.contacted} le {formatDayLabel(stats.bestDay.date)}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export CSV bilan */}
          <button
            onClick={exportDashboardCSV}
            className="h-7 px-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-xs text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1.5"
            title="Exporter le bilan en CSV"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
          {/* Sélecteur de période */}
          <div className="flex gap-1 bg-white/[0.05] border border-white/[0.08] rounded-xl p-1">
            {(["day", "week", "month"] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={[
                  "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                  period === p
                    ? "bg-violet-500/25 text-violet-200 shadow-[0_0_12px_rgba(124,58,237,0.15)]"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]",
                ].join(" ")}
              >
                {p === "day" ? "Auj." : p === "week" ? "7 jours" : "30 jours"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 px-6 py-6 space-y-6 max-w-[1200px] w-full mx-auto">

        {/* ── Cartes stat ── */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            icon="📞"
            label={`Contactés — ${periodLabel}`}
            value={stats.contactedPeriod}
            sub={stats.contactedPeriod === 0 ? "Aucun appel enregistré" : `leads démarchés`}
            color={stats.contactedPeriod > 0 ? "text-violet-300" : "text-slate-600"}
            iconBg="bg-violet-500/15"
            glow={stats.contactedPeriod > 0 ? "shadow-[0_0_30px_rgba(124,58,237,0.08)]" : ""}
          />
          <StatCard
            icon="➕"
            label={`Ajoutés — ${periodLabel}`}
            value={stats.addedPeriod}
            sub="nouveaux leads dans le CRM"
            color={stats.addedPeriod > 0 ? "text-cyan-300" : "text-slate-600"}
            iconBg="bg-cyan-500/15"
          />
          <StatCard
            icon="📅"
            label="RDV à venir"
            value={stats.rdvPeriod}
            sub={stats.rdvPeriod === 0 ? "Aucun RDV programmé" : "à partir d'aujourd'hui"}
            color={stats.rdvPeriod > 0 ? "text-emerald-300" : "text-slate-600"}
            iconBg={stats.rdvPeriod > 0 ? "bg-emerald-500/15" : "bg-white/[0.06]"}
            glow={stats.rdvPeriod > 0 ? "shadow-[0_0_30px_rgba(52,211,153,0.07)]" : ""}
          />
          <StatCard
            icon="⏰"
            label="Rappels en retard"
            value={stats.rappelsDus}
            sub={stats.rappelsDus === 0 ? "Tout est à jour" : "à traiter dès maintenant"}
            color={stats.rappelsDus > 0 ? "text-amber-300" : "text-slate-600"}
            iconBg={stats.rappelsDus > 0 ? "bg-amber-500/15" : "bg-white/[0.06]"}
            glow={stats.rappelsDus > 0 ? "shadow-[0_0_30px_rgba(251,191,36,0.08)]" : ""}
          />
        </div>

        {/* ── Graphique + Entonnoir ── */}
        <div className="grid grid-cols-[1fr_320px] gap-4">

          {/* Graphique activité 30 jours */}
          <div className="rounded-2xl border border-white/[0.10] bg-white/[0.06] p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">Activité — 30 derniers jours</h2>
                <p className="text-xs text-slate-600 mt-0.5">Uniquement les leads réellement démarché</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span>
                  Moy. <span className="text-slate-400 font-medium mono">
                    {(stats.totalContacted30 / 30).toFixed(1)}
                  </span>/jour
                </span>
              </div>
            </div>
            {stats.totalContacted30 === 0 ? (
              <div className="flex flex-col items-center justify-center h-28 text-slate-700 gap-2">
                <span className="text-2xl">📊</span>
                <p className="text-xs">Les données apparaîtront au fil de tes appels</p>
              </div>
            ) : (
              <ActivityChart data={stats.chart} />
            )}
          </div>

          {/* Entonnoir */}
          <div className="rounded-2xl border border-white/[0.10] bg-white/[0.06] p-5">
            <h2 className="text-sm font-semibold text-slate-100 mb-1">Entonnoir de conversion</h2>
            <p className="text-xs text-slate-600 mb-4">Sur {stats.total} leads au total</p>

            <div className="space-y-3">
              {/* Niveau 1 — Tous les leads */}
              <FunnelBar label="Non contactés" count={stats.nonContactes}
                total={stats.total} color="text-slate-500" bg="bg-slate-600/40" />
              <FunnelBar label="Contactés (appelés)" count={stats.contactes}
                total={stats.total} color="text-slate-300" bg="bg-slate-500/50" />

              {/* Niveau 2 — Parmi les contactés */}
              <div className="border-t border-white/5 pt-3 space-y-2 pl-3">
                <p className="text-[10px] text-slate-700 uppercase tracking-wider font-semibold mb-2">
                  Parmi les contactés
                </p>
                <FunnelBar label="Ne répond pas" count={stats.neRepond}
                  total={stats.contactes || 1} color="text-orange-400" bg="bg-orange-500/40"
                  sub="des appelés" />

                {/* Séparation : vrais conversations */}
                <div className="border-t border-white/[0.04] pt-2">
                  <p className="text-[10px] text-slate-700 uppercase tracking-wider font-semibold mb-2">
                    Vrais échanges ({stats.vraisConversations})
                    <span className="ml-1 normal-case font-normal text-slate-700">— excl. sans réponse</span>
                  </p>
                  <FunnelBar label="Intéressés (à rappeler)" count={stats.interesses}
                    total={stats.vraisConversations || 1} color="text-cyan-400" bg="bg-cyan-500/50"
                    sub="des échanges réels" />
                  <div className="mt-2">
                    <FunnelBar label="RDV pris ✓" count={stats.rdvPris}
                      total={stats.vraisConversations || 1} color="text-green-400" bg="bg-green-500/60"
                      sub="des échanges réels" />
                  </div>
                  <div className="mt-2">
                    <FunnelBar label="Pas intéressé" count={stats.pasInteresse}
                      total={stats.vraisConversations || 1} color="text-red-400" bg="bg-red-500/30"
                      sub="des échanges réels" />
                  </div>
                </div>
              </div>
            </div>

            {/* Taux clés — recalculés sur les vrais échanges */}
            {stats.vraisConversations > 0 && (
              <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-lg font-bold mono text-slate-300">{stats.tauxContact}%</div>
                  <div className="text-[10px] text-slate-700 leading-tight mt-0.5">ont décroché<br/>(sur total)</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold mono text-cyan-400">{stats.tauxInteret}%</div>
                  <div className="text-[10px] text-slate-700 leading-tight mt-0.5">ont montré<br/>de l&apos;intérêt</div>
                </div>
                <div className="text-center relative">
                  <div className="text-lg font-bold mono text-green-400">{stats.tauxRdv}%</div>
                  <div className="text-[10px] text-slate-700 leading-tight mt-0.5">closing RDV<br/>(vrais échanges)</div>
                  {stats.tauxRdv > 0 && (
                    <div className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Prochains RDV + Derniers contactés ── */}
        <div className="grid grid-cols-2 gap-4">

          {/* Prochains RDV */}
          <div className="rounded-2xl border border-white/[0.10] bg-white/[0.06] p-5">
            <h2 className="text-sm font-semibold text-slate-100 mb-4">Prochains RDV</h2>
            {stats.upcomingRdv.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-700 gap-2">
                <span className="text-xl">📅</span>
                <p className="text-xs">Aucun RDV programmé</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.upcomingRdv.map((lead, i) => {
                  const isToday = lead.rdv_date === today;
                  return (
                    <div key={i}
                      className={[
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg border",
                        isToday
                          ? "bg-green-500/8 border-green-500/20"
                          : "bg-white/2 border-white/5",
                      ].join(" ")}
                    >
                      <div className="shrink-0 text-center min-w-[40px]">
                        <div className={`text-sm font-bold mono leading-none ${isToday ? "text-green-400" : "text-slate-400"}`}>
                          {lead.rdv_date.slice(8)}
                        </div>
                        <div className="text-xs text-slate-600 mono">
                          {new Date(lead.rdv_date + "T00:00:00").toLocaleDateString("fr-FR", { month: "short" })}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-200 truncate">{lead.nom}</div>
                        <div className="text-xs text-slate-600 truncate">
                          {lead.metier}{lead.emplacement ? ` · ${lead.emplacement}` : ""}
                        </div>
                      </div>
                      {lead.rdv_heure && (
                        <div className="mono text-xs text-slate-500 shrink-0">{lead.rdv_heure}</div>
                      )}
                      {isToday && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded text-xs bg-green-900/40 text-green-400 font-medium">Auj.</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Derniers leads contactés */}
          <div className="rounded-2xl border border-white/[0.10] bg-white/[0.06] p-5">
            <h2 className="text-sm font-semibold text-slate-100 mb-4">Derniers leads contactés</h2>
            {stats.recentlyContacted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-700 gap-2">
                <span className="text-xl">📞</span>
                <p className="text-xs">Aucun appel enregistré pour l&apos;instant</p>
                <p className="text-xs">Change le statut d&apos;un lead pour commencer</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {stats.recentlyContacted.map((lead, i) => {
                  const tagCls = TAG_COLORS[lead.tag] || "bg-slate-700 text-slate-300";
                  const isToday = lead.contacted_at === today;
                  return (
                    <Link key={i} href="/"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/2 border border-white/5 hover:bg-white/[0.06] hover:border-white/[0.08] transition-all group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-200 font-medium truncate">{lead.nom}</span>
                          {isToday && (
                            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                          )}
                        </div>
                        <div className="text-xs text-slate-600 truncate">{lead.metier}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tagCls}`}>
                          {TAG_LABEL[lead.tag] || lead.tag}
                        </span>
                        <div className="text-xs text-slate-700 mono mt-0.5">
                          {isToday ? "aujourd'hui" : lead.contacted_at}
                        </div>
                      </div>
                      <span className="text-slate-700 group-hover:text-slate-500 transition-colors text-xs">→</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Bilan global ── */}
        <div className="rounded-2xl border border-white/[0.10] bg-white/[0.06] p-5">
          <h2 className="text-sm font-semibold text-slate-100 mb-4">Bilan global</h2>
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: "Total leads",    value: stats.total,          color: "text-slate-200",  bg: "border-white/[0.09] bg-white/[0.05]"      },
              { label: "Non contactés",  value: stats.nonContactes,   color: "text-slate-500",  bg: "border-white/[0.06] bg-white/[0.02]"      },
              { label: "Ne répond pas",  value: stats.neRepond,        color: "text-orange-300", bg: "border-orange-500/15 bg-orange-500/[0.06]" },
              { label: "Intéressés",     value: stats.interesses,     color: "text-cyan-300",   bg: "border-cyan-500/15 bg-cyan-500/[0.06]"    },
              { label: "RDV pris",       value: stats.rdvPris,         color: "text-emerald-300", bg: "border-emerald-500/15 bg-emerald-500/[0.06]" },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border ${s.bg} px-4 py-3`}>
                <div className={`text-2xl font-bold mono ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-600 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
