"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link                               from "next/link";
import { Lead, TAG_COLORS }              from "@/components/leads/types";
import { usePlan }                        from "@/hooks/usePlan";
import RdvCalendar                        from "@/components/dashboard/RdvCalendar";

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ Graphique 30 jours (SVG pur) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
              {/* Barre ajoutÃ©s (cyan, derriÃ¨re) */}
              {hAdded > 0 && (
                <rect
                  x={x + 1} y={H - hAdded} width={BAR_W} height={hAdded} rx={2}
                  fill={hovered?.date === d.date ? "#22d3ee" : "rgba(34,211,238,0.25)"}
                  className="transition-colors duration-100"
                />
              )}
              {/* Barre contactÃ©s (violet, devant) */}
              {hCont > 0 && (
                <rect
                  x={x + 1} y={H - hCont} width={BAR_W} height={hCont} rx={2}
                  fill={hovered?.date === d.date ? "#00E5FF" : "rgba(0,229,255,0.6)"}
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
            <span className="w-2 h-2 rounded-full bg-brand-400 inline-block" />
            <span className="text-slate-400">{hovered.contacted} contactÃ©{hovered.contacted > 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
            <span className="text-slate-400">{hovered.added} ajoutÃ©{hovered.added > 1 ? "s" : ""}</span>
          </div>
        </div>
      )}

      {/* LÃ©gende */}
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="w-2.5 h-2.5 rounded-sm bg-brand-500/60 inline-block" />
          ContactÃ©s
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/30 inline-block" />
          AjoutÃ©s
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Entonnoir de conversion â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
      <div className="h-[5px] bg-white/[0.05] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${bg}`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// â”€â”€ Carte stat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatCard({
  label, value, sub, color, borderColor, iconBg, iconSvg, active,
}: {
  label: string; value: number | string; sub?: string;
  color: string; borderColor: string; iconBg: string;
  iconSvg: React.ReactNode; active?: boolean;
}) {
  return (
    <div className={[
      "rounded-2xl border p-5 flex flex-col gap-3 transition-all group relative overflow-hidden",
      active
        ? `${borderColor} bg-white/[0.05] hover:bg-white/[0.08]`
        : "border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.05]",
    ].join(" ")}>
      {/* Halo de fond subtil */}
      {active && (
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none"
          style={{ background: "inherit" }} />
      )}

      <div className="flex items-start justify-between gap-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {iconSvg}
        </div>
        <span className="text-[11px] text-slate-500 text-right leading-snug font-medium tracking-wide">{label}</span>
      </div>

      <div className={`text-[38px] font-bold font-mono leading-none ${active ? color : "text-slate-700"}`}>
        {value}
      </div>

      {sub && (
        <div className="text-[11px] leading-snug flex items-center gap-1.5">
          {active && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${color.replace("text-", "bg-")} opacity-60`} />}
          <span className={active ? "text-slate-500" : "text-slate-700"}>{sub}</span>
        </div>
      )}
    </div>
  );
}

// â”€â”€ Page principale â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type Period = "day" | "week" | "month";

const PERIOD_LABELS: Record<Period, string> = {
  day:   "Aujourd'hui",
  week:  "7 derniers jours",
  month: "30 derniers jours",
};

const TAG_LABEL: Record<string, string> = {
  non_appele:    "Non appelÃ©",
  ne_repond_pas: "Ne rÃ©pond pas",
  interesse:     "IntÃ©ressÃ©",
  rdv_pris:      "RDV pris",
  pas_interesse: "Pas intÃ©ressÃ©",
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
    // Borne de la pÃ©riode sÃ©lectionnÃ©e
    const cutoff = period === "day"   ? today
                 : period === "week"  ? isoNDaysAgo(6)
                 :                     isoNDaysAgo(29);

    // â”€â”€ MÃ©triques de la pÃ©riode â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const contactedPeriod = leads.filter(l => l.contacted_at && l.contacted_at >= cutoff && l.contacted_at <= today).length;
    const addedPeriod     = leads.filter(l => l.created_at   && l.created_at   >= cutoff && l.created_at   <= today).length;
    const rdvPeriod       = leads.filter(l => l.rdv_date     && l.rdv_date     >= today).length;
    const rappelsDus      = leads.filter(l => l.rappel       && l.rappel       <= today).length;

    // â”€â”€ Entonnoir (toujours sur l'ensemble des leads) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const total         = leads.length;
    const nonContactes  = leads.filter(l => l.tag === "non_appele").length;
    const contactes     = total - nonContactes;
    const neRepond      = leads.filter(l => l.tag === "ne_repond_pas").length;
    const interesses    = leads.filter(l => l.tag === "interesse").length;
    const rdvPris       = leads.filter(l => l.tag === "rdv_pris").length;
    const pasInteresse  = leads.filter(l => l.tag === "pas_interesse").length;

    // "Vrais conversations" = ceux qui ont dÃ©crochÃ© et rÃ©pondu (intÃ©ressÃ© + RDV pris + pas intÃ©ressÃ©)
    // Ne rÃ©pond pas n'est PAS comptÃ© dans le closing â€” ils n'ont pas eu de vraie conversation
    const vraisConversations = interesses + rdvPris + pasInteresse;

    // Taux de dÃ©crochage = ceux qui ont vraiment parlÃ© / ceux qu'on a appelÃ©s
    // (contactes = tous les leads sortis de "non_appelÃ©" = appelÃ©s au moins une fois)
    const tauxDecrochage = contactes          > 0 ? Math.round((vraisConversations / contactes)          * 100) : 0;
    const tauxInteret    = vraisConversations > 0 ? Math.round(((interesses + rdvPris) / vraisConversations) * 100) : 0;
    const tauxRdv        = vraisConversations > 0 ? Math.round((rdvPris             / vraisConversations) * 100) : 0;

    // â”€â”€ Graphique 30 jours â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const chart: ChartPoint[] = days30.map(d => ({
      date:       d,
      contacted:  leads.filter(l => l.contacted_at === d).length,
      added:      leads.filter(l => l.created_at   === d).length,
    }));

    // Total activitÃ© sur 30 jours
    const totalContacted30 = chart.reduce((s, d) => s + d.contacted, 0);
    const bestDay = [...chart].sort((a, b) => b.contacted - a.contacted)[0];

    // â”€â”€ Prochains RDV â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const upcomingRdv = leads
      .filter(l => l.rdv_date && l.rdv_date >= today)
      .sort((a, b) => a.rdv_date.localeCompare(b.rdv_date))
      .slice(0, 6);

    // â”€â”€ Derniers leads contactÃ©s â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const recentlyContacted = leads
      .filter(l => l.contacted_at)
      .sort((a, b) => b.contacted_at.localeCompare(a.contacted_at))
      .slice(0, 8);

    return {
      contactedPeriod, addedPeriod, rdvPeriod, rappelsDus,
      total, nonContactes, contactes, neRepond, interesses, rdvPris, pasInteresse,
      vraisConversations,
      tauxDecrochage, tauxInteret, tauxRdv,
      chart, totalContacted30, bestDay,
      upcomingRdv, recentlyContacted,
    };
  }, [leads, period, today, days30]);

  // Export CSV du bilan
  function exportDashboardCSV() {
    const rows = [
      ["MÃ©trique", "Valeur"],
      ["Total leads", stats.total],
      ["Non contactÃ©s", stats.nonContactes],
      ["ContactÃ©s", stats.contactes],
      ["Ne rÃ©pond pas", stats.neRepond],
      ["IntÃ©ressÃ©s", stats.interesses],
      ["RDV pris", stats.rdvPris],
      ["Pas intÃ©ressÃ©s", stats.pasInteresse],
      ["Vrais Ã©changes (dÃ©crochÃ©s)", stats.vraisConversations],
      ["Taux de dÃ©crochage", `${stats.tauxDecrochage}%`],
      ["Taux d'intÃ©rÃªt", `${stats.tauxInteret}%`],
      ["Taux closing RDV", `${stats.tauxRdv}%`],
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
        <div className="h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent shrink-0" />
        <div className="h-[52px] border-b border-white/[0.06] shrink-0 bg-[#0c0e15]/60" />
        <div className="flex-1 px-6 py-6 max-w-[1200px] w-full mx-auto space-y-4 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-white/[0.04] border border-white/[0.06]" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
            <div className="h-52 rounded-2xl bg-white/[0.04] border border-white/[0.06]" />
            <div className="h-52 rounded-2xl bg-white/[0.04] border border-white/[0.06]" />
          </div>
        </div>
      </div>
    );
  }

  // â”€â”€ Plan free : page de verrouillage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (plan === "free") {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-5 px-6">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center text-3xl z-10 relative">ðŸ“Š</div>
          <div className="absolute inset-0 rounded-2xl bg-brand-500/10 blur-xl" />
        </div>
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-slate-100 mb-2">Dashboard analytics</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Les mÃ©triques de prospection, graphiques 30 jours et funnel de conversion
            sont rÃ©servÃ©s au plan <span className="text-brand-300 font-medium">Pro</span>.
          </p>
        </div>
        <Link
          href="/#pricing"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-colors shadow-[0_0_20px_rgba(0,229,255,0.3)]"
        >
          Passer Pro â€” 19 â‚¬/mois â†’
        </Link>
        <p className="text-xs text-slate-700">14 jours gratuits Â· annulable Ã  tout moment</p>
      </div>
    );
  }

  const periodLabel = PERIOD_LABELS[period];

  return (
    <div className="flex flex-col h-screen overflow-auto">
      {/* Trait de lumiÃ¨re haut */}
      <div className="h-px bg-gradient-to-r from-transparent via-brand-500/25 to-transparent shrink-0" />

      {/* Header */}
      <header className="flex items-center justify-between gap-2 pl-14 md:pl-5 pr-3 md:pr-5 py-3 border-b border-white/[0.05] shrink-0 bg-[#080b12]/70 backdrop-blur-md">
        <div>
          <h1 className="text-[13px] font-semibold text-slate-200 tracking-tight">Tableau de bord</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            {stats.totalContacted30} leads contactÃ©s sur 30 jours
            {stats.bestDay?.contacted > 0 && (
              <span className="ml-2 text-brand-400">
                Â· record : {stats.bestDay.contacted} le {formatDayLabel(stats.bestDay.date)}
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
          {/* SÃ©lecteur de pÃ©riode */}
          <div className="flex gap-[3px] bg-white/[0.04] border border-white/[0.07] rounded-xl p-[3px]">
            {(["day", "week", "month"] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={[
                  "px-3 py-1 rounded-lg text-[12px] font-medium transition-all",
                  period === p
                    ? "bg-brand-500/[0.22] text-brand-200"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]",
                ].join(" ")}
              >
                {p === "day" ? "Auj." : p === "week" ? "7 jours" : "30 jours"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 px-6 py-6 space-y-6 max-w-[1200px] w-full mx-auto">

        {/* â”€â”€ Cartes stat â”€â”€ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label={`ContactÃ©s â€” ${periodLabel}`}
            value={stats.contactedPeriod}
            sub={stats.contactedPeriod === 0 ? "Aucun appel enregistrÃ©" : "leads dÃ©marchÃ©s"}
            color="text-brand-300"
            borderColor="border-brand-500/[0.22]"
            iconBg="bg-brand-500/15"
            active={stats.contactedPeriod > 0}
            iconSvg={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-400">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.08 6.08l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/>
              </svg>
            }
          />
          <StatCard
            label={`AjoutÃ©s â€” ${periodLabel}`}
            value={stats.addedPeriod}
            sub="nouveaux leads dans le CRM"
            color="text-cyan-300"
            borderColor="border-cyan-500/[0.20]"
            iconBg="bg-cyan-500/12"
            active={stats.addedPeriod > 0}
            iconSvg={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/>
                <line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
            }
          />
          <StatCard
            label="RDV Ã  venir"
            value={stats.rdvPeriod}
            sub={stats.rdvPeriod === 0 ? "Aucun RDV programmÃ©" : "Ã  partir d'aujourd'hui"}
            color="text-emerald-300"
            borderColor="border-emerald-500/[0.20]"
            iconBg="bg-emerald-500/12"
            active={stats.rdvPeriod > 0}
            iconSvg={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <polyline points="9 16 11 18 15 14"/>
              </svg>
            }
          />
          <StatCard
            label="Rappels en retard"
            value={stats.rappelsDus}
            sub={stats.rappelsDus === 0 ? "Tout est Ã  jour âœ“" : "Ã  traiter maintenant"}
            color="text-amber-300"
            borderColor="border-amber-500/[0.22]"
            iconBg="bg-amber-500/12"
            active={stats.rappelsDus > 0}
            iconSvg={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            }
          />
        </div>

        {/* â”€â”€ Graphique + Entonnoir â”€â”€ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">

          {/* Graphique activitÃ© 30 jours */}
          <div className="rounded-2xl border border-brand-500/[0.10] bg-gradient-to-br from-brand-500/[0.04] to-transparent p-5 relative overflow-hidden">
            {/* Glow coin haut-droit */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl bg-brand-500/10 pointer-events-none" />
            <div className="flex items-center justify-between mb-5 relative">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                  <span className="text-[10px] font-mono tracking-widest text-brand-400/70 uppercase">ActivitÃ©</span>
                </div>
                <h2 className="text-[13px] font-semibold text-slate-100">30 derniers jours</h2>
                <p className="text-[11px] text-slate-600 mt-0.5">Leads rÃ©ellement dÃ©marchÃ©s</p>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <div className="text-right">
                  <div className="font-mono font-bold text-brand-300 text-[15px]">
                    {(stats.totalContacted30 / 30).toFixed(1)}
                  </div>
                  <div className="text-slate-700">appels/jour</div>
                </div>
              </div>
            </div>
            {stats.totalContacted30 === 0 ? (
              <div className="flex flex-col items-center justify-center h-28 text-slate-700 gap-2">
                <span className="text-2xl">ðŸ“Š</span>
                <p className="text-xs">Les donnÃ©es apparaÃ®tront au fil de tes appels</p>
              </div>
            ) : (
              <ActivityChart data={stats.chart} />
            )}
          </div>

          {/* Entonnoir */}
          <div className="rounded-2xl border border-cyan-500/[0.10] bg-gradient-to-br from-cyan-500/[0.03] to-transparent p-5 relative overflow-hidden">
            <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-3xl bg-cyan-500/10 pointer-events-none" />
            <div className="flex items-center gap-2 mb-1 relative">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-[10px] font-mono tracking-widest text-cyan-400/70 uppercase">Conversion</span>
            </div>
            <h2 className="text-[13px] font-semibold text-slate-100 mb-0.5 relative">Entonnoir</h2>
            <p className="text-[11px] text-slate-600 mb-4 relative">Sur {stats.total} leads au total</p>

            <div className="space-y-3">
              {/* Niveau 1 â€” Tous les leads */}
              <FunnelBar label="Non contactÃ©s" count={stats.nonContactes}
                total={stats.total} color="text-slate-500" bg="bg-slate-600/40" />
              <FunnelBar label="ContactÃ©s (appelÃ©s)" count={stats.contactes}
                total={stats.total} color="text-slate-300" bg="bg-slate-500/50" />

              {/* Niveau 2 â€” Parmi les contactÃ©s */}
              <div className="border-t border-white/5 pt-3 space-y-2 pl-3">
                <p className="text-[10px] text-slate-700 uppercase tracking-wider font-semibold mb-2">
                  Parmi les contactÃ©s
                </p>
                <FunnelBar label="Ne rÃ©pond pas" count={stats.neRepond}
                  total={stats.contactes || 1} color="text-orange-400" bg="bg-orange-500/40"
                  sub="des appelÃ©s" />

                {/* SÃ©paration : vrais conversations */}
                <div className="border-t border-white/[0.04] pt-2">
                  <p className="text-[10px] text-slate-700 uppercase tracking-wider font-semibold mb-2">
                    Vrais Ã©changes ({stats.vraisConversations})
                    <span className="ml-1 normal-case font-normal text-slate-700">â€” excl. sans rÃ©ponse</span>
                  </p>
                  <FunnelBar label="IntÃ©ressÃ©s (Ã  rappeler)" count={stats.interesses}
                    total={stats.vraisConversations || 1} color="text-cyan-400" bg="bg-cyan-500/50"
                    sub="des Ã©changes rÃ©els" />
                  <div className="mt-2">
                    <FunnelBar label="RDV pris âœ“" count={stats.rdvPris}
                      total={stats.vraisConversations || 1} color="text-green-400" bg="bg-green-500/60"
                      sub="des Ã©changes rÃ©els" />
                  </div>
                  <div className="mt-2">
                    <FunnelBar label="Pas intÃ©ressÃ©" count={stats.pasInteresse}
                      total={stats.vraisConversations || 1} color="text-red-400" bg="bg-red-500/30"
                      sub="des Ã©changes rÃ©els" />
                  </div>
                </div>
              </div>
            </div>

            {/* Taux clÃ©s â€” recalculÃ©s sur les vrais Ã©changes */}
            {stats.vraisConversations > 0 && (
              <div className="mt-5 pt-4 border-t border-white/[0.06] grid grid-cols-3 gap-2 relative">
                <div className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-[22px] font-bold font-mono text-slate-300">{stats.tauxDecrochage}%</div>
                  <div className="text-[10px] text-slate-600 leading-tight text-center">ont dÃ©crochÃ©</div>
                </div>
                <div className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl bg-cyan-500/[0.06] border border-cyan-500/[0.15]">
                  <div className="text-[22px] font-bold font-mono text-cyan-300">{stats.tauxInteret}%</div>
                  <div className="text-[10px] text-cyan-600 leading-tight text-center">intÃ©ressÃ©s</div>
                </div>
                <div className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/[0.15] relative">
                  <div className="text-[22px] font-bold font-mono text-emerald-300">{stats.tauxRdv}%</div>
                  <div className="text-[10px] text-emerald-600 leading-tight text-center">closing RDV</div>
                  {stats.tauxRdv > 0 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* â”€â”€ Calendrier des RDV â”€â”€ */}
        <RdvCalendar leads={leads} />

        {/* â”€â”€ Prochains RDV + Derniers contactÃ©s â”€â”€ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Prochains RDV */}
          <div className="rounded-2xl border border-emerald-500/[0.10] bg-gradient-to-br from-emerald-500/[0.03] to-transparent p-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-mono tracking-widest text-emerald-400/70 uppercase">Planning</span>
            </div>
            <h2 className="text-[13px] font-semibold text-slate-100 mb-4">Prochains RDV</h2>
            {stats.upcomingRdv.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-700 gap-2">
                <span className="text-xl">ðŸ“…</span>
                <p className="text-xs">Aucun RDV programmÃ©</p>
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
                          {lead.metier}{lead.emplacement ? ` Â· ${lead.emplacement}` : ""}
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

          {/* Derniers leads contactÃ©s */}
          <div className="rounded-2xl border border-brand-500/[0.10] bg-gradient-to-br from-brand-500/[0.03] to-transparent p-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
              <span className="text-[10px] font-mono tracking-widest text-brand-400/70 uppercase">RÃ©cents</span>
            </div>
            <h2 className="text-[13px] font-semibold text-slate-100 mb-4">Derniers leads contactÃ©s</h2>
            {stats.recentlyContacted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-700 gap-2">
                <span className="text-xl">ðŸ“ž</span>
                <p className="text-xs">Aucun appel enregistrÃ© pour l&apos;instant</p>
                <p className="text-xs">Change le statut d&apos;un lead pour commencer</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {stats.recentlyContacted.map((lead, i) => {
                  const tagCls = TAG_COLORS[lead.tag] || "bg-slate-700 text-slate-300";
                  const isToday = lead.contacted_at === today;
                  return (
                    <Link key={i} href="/app"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/2 border border-white/5 hover:bg-white/[0.06] hover:border-white/[0.08] transition-all group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-200 font-medium truncate">{lead.nom}</span>
                          {isToday && (
                            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
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
                      <span className="text-slate-700 group-hover:text-slate-500 transition-colors text-xs">â†’</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* â”€â”€ Bilan global â”€â”€ */}
        <div className="rounded-2xl border border-white/[0.10] bg-white/[0.06] p-5">
          <h2 className="text-sm font-semibold text-slate-100 mb-4">Bilan global</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "Total leads",    value: stats.total,          color: "text-slate-200",  bg: "border-white/[0.09] bg-white/[0.05]"      },
              { label: "Non contactÃ©s",  value: stats.nonContactes,   color: "text-slate-500",  bg: "border-white/[0.06] bg-white/[0.02]"      },
              { label: "Ne rÃ©pond pas",  value: stats.neRepond,        color: "text-orange-300", bg: "border-orange-500/15 bg-orange-500/[0.06]" },
              { label: "IntÃ©ressÃ©s",     value: stats.interesses,     color: "text-cyan-300",   bg: "border-cyan-500/15 bg-cyan-500/[0.06]"    },
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


