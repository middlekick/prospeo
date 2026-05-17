"use client";

import React from "react";
import { Lead, isRappelDue } from "./types";

interface Props { leads: Lead[] }

// Stat individuelle avec indicateur de tendance
interface StatItem {
  label:    string;
  value:    string | number;
  icon:     React.ReactNode;
  accent:   string;   // couleur Tailwind ex: "violet" | "amber" | "cyan" | "emerald" | "slate"
  active:   boolean;
  subtext?: string;
}

function StatCard({ item }: { item: StatItem }) {
  const accentMap: Record<string, { card: string; icon: string; num: string; dot: string }> = {
    violet:  {
      card: "bg-brand-500/[0.06] border-brand-500/[0.18]",
      icon: "bg-brand-500/15 text-brand-400",
      num:  "text-brand-200",
      dot:  "bg-brand-400",
    },
    amber: {
      card: "bg-amber-500/[0.06] border-amber-500/[0.18]",
      icon: "bg-amber-500/15 text-amber-400",
      num:  "text-amber-200",
      dot:  "bg-amber-400",
    },
    cyan: {
      card: "bg-cyan-500/[0.05] border-cyan-500/[0.15]",
      icon: "bg-cyan-500/12 text-cyan-400",
      num:  "text-cyan-200",
      dot:  "bg-cyan-400",
    },
    emerald: {
      card: "bg-emerald-500/[0.05] border-emerald-500/[0.15]",
      icon: "bg-emerald-500/12 text-emerald-400",
      num:  "text-emerald-200",
      dot:  "bg-emerald-400",
    },
    slate: {
      card: "bg-white/[0.03] border-white/[0.07]",
      icon: "bg-white/[0.06] text-slate-500",
      num:  "text-slate-300",
      dot:  "bg-slate-600",
    },
  };

  const styles = accentMap[item.active ? item.accent : "slate"];

  return (
    <div className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border shrink-0 transition-all ${styles.card}`}>
      {/* Icône */}
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${styles.icon}`}>
        {item.icon}
      </div>

      {/* Données */}
      <div className="flex flex-col leading-none">
        <div className={`text-[15px] font-bold font-mono leading-none ${item.active ? styles.num : "text-slate-500"}`}>
          {item.value}
        </div>
        <div className="text-[10px] text-slate-600 mt-[5px] whitespace-nowrap tracking-wide">
          {item.label}
        </div>
      </div>

      {/* Point pulsé si actif */}
      {item.active && item.accent !== "slate" && (
        <div className={`w-1.5 h-1.5 rounded-full ml-0.5 shrink-0 ${styles.dot} opacity-70`} />
      )}
    </div>
  );
}

export default function StatsBar({ leads }: Props) {
  const today      = new Date().toISOString().slice(0, 10);
  const total      = leads.length;
  const rappels    = leads.filter(isRappelDue).length;
  const interesses = leads.filter(l => l.tag === "interesse").length;
  const rdvPris    = leads.filter(l => l.tag === "rdv_pris").length;
  const rdvAujourd = leads.filter(l => l.rdv_date === today).length;
  const taux       = total > 0 ? Math.round(((interesses + rdvPris) / total) * 100) : 0;

  const stats: StatItem[] = [
    {
      label:  "Leads",
      value:  total,
      accent: "violet",
      active: total > 0,
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      label:  "Rappels dus",
      value:  rappels,
      accent: "amber",
      active: rappels > 0,
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      ),
    },
    {
      label:  "Intéressés",
      value:  interesses,
      accent: "cyan",
      active: interesses > 0,
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ),
    },
    {
      label:  "RDV pris",
      value:  rdvPris,
      accent: "emerald",
      active: rdvPris > 0,
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
    },
    {
      label:  "RDV aujourd'hui",
      value:  rdvAujourd,
      accent: "violet",
      active: rdvAujourd > 0,
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
    {
      label:  "Taux contact",
      value:  `${taux}%`,
      accent: taux >= 30 ? "emerald" : taux >= 10 ? "cyan" : "slate",
      active: taux > 0,
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="flex gap-2 px-5 py-3 border-b border-white/[0.05] overflow-x-auto shrink-0 bg-[#080b12]/40">
      {stats.map(s => <StatCard key={s.label} item={s} />)}
    </div>
  );
}

