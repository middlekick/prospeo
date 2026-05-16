"use client";

import { Lead, isRappelDue } from "./types";

interface Props { leads: Lead[] }

export default function StatsBar({ leads }: Props) {
  const today      = new Date().toISOString().slice(0, 10);
  const total      = leads.length;
  const rappels    = leads.filter(isRappelDue).length;
  const interesses = leads.filter(l => l.tag === "interesse").length;
  const rdvPris    = leads.filter(l => l.tag === "rdv_pris").length;
  const rdvAujourd = leads.filter(l => l.rdv_date === today).length;
  const taux       = total > 0 ? Math.round(((interesses + rdvPris) / total) * 100) : 0;

  const stats = [
    {
      label: "Leads",
      value: total,
      icon: "◈",
      numCls: "text-slate-200",
      iconCls: "bg-white/[0.08] text-slate-400",
      cardCls: "border-white/[0.08] bg-white/[0.03]",
    },
    {
      label: "Rappels dus",
      value: rappels,
      icon: "⏰",
      numCls: rappels > 0 ? "text-amber-300" : "text-slate-600",
      iconCls: rappels > 0 ? "bg-amber-500/15 text-amber-400" : "bg-white/[0.05] text-slate-600",
      cardCls: rappels > 0 ? "border-amber-500/20 bg-amber-500/[0.05]" : "border-white/[0.06] bg-white/[0.02]",
    },
    {
      label: "Intéressés",
      value: interesses,
      icon: "★",
      numCls: interesses > 0 ? "text-cyan-300" : "text-slate-600",
      iconCls: interesses > 0 ? "bg-cyan-500/15 text-cyan-400" : "bg-white/[0.05] text-slate-600",
      cardCls: interesses > 0 ? "border-cyan-500/20 bg-cyan-500/[0.04]" : "border-white/[0.06] bg-white/[0.02]",
    },
    {
      label: "RDV pris",
      value: rdvPris,
      icon: "✓",
      numCls: rdvPris > 0 ? "text-emerald-300" : "text-slate-600",
      iconCls: rdvPris > 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-white/[0.05] text-slate-600",
      cardCls: rdvPris > 0 ? "border-emerald-500/20 bg-emerald-500/[0.04]" : "border-white/[0.06] bg-white/[0.02]",
    },
    {
      label: "RDV aujourd'hui",
      value: rdvAujourd,
      icon: "📌",
      numCls: rdvAujourd > 0 ? "text-violet-300" : "text-slate-600",
      iconCls: rdvAujourd > 0 ? "bg-violet-500/15 text-violet-400" : "bg-white/[0.05] text-slate-600",
      cardCls: rdvAujourd > 0 ? "border-violet-500/20 bg-violet-500/[0.05]" : "border-white/[0.06] bg-white/[0.02]",
    },
    {
      label: "Taux contact",
      value: `${taux}%`,
      icon: "◎",
      numCls: taux >= 30 ? "text-emerald-300" : taux >= 10 ? "text-slate-300" : "text-slate-600",
      iconCls: "bg-white/[0.05] text-slate-500",
      cardCls: "border-white/[0.06] bg-white/[0.02]",
    },
  ];

  return (
    <div className="flex gap-2.5 px-5 py-3.5 border-b border-white/[0.06] overflow-x-auto shrink-0">
      {stats.map(s => (
        <div
          key={s.label}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border shrink-0 transition-all ${s.cardCls}`}
        >
          {/* Icône dans halo */}
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${s.iconCls}`}>
            {s.icon}
          </div>
          {/* Valeur + label */}
          <div>
            <div className={`text-[15px] font-bold mono leading-none ${s.numCls}`}>{s.value}</div>
            <div className="text-[10px] text-slate-600 mt-0.5 whitespace-nowrap">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
