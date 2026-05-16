"use client";

import { useState, useMemo } from "react";
import { Lead } from "@/components/leads/types";

interface Props {
  leads: Lead[];
}

const RDV_DOT: Record<string, string> = {
  confirme:   "bg-green-400",
  en_attente: "bg-yellow-400",
  annule:     "bg-red-400",
  effectue:   "bg-slate-500",
};

const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS   = ["Lu","Ma","Me","Je","Ve","Sa","Di"];

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function RdvCalendar({ leads }: Props) {
  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // RDV groupés par date
  const rdvByDate = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const l of leads) {
      if (!l.rdv_date) continue;
      (map[l.rdv_date] ||= []).push(l);
    }
    return map;
  }, [leads]);

  // Construction de la grille du mois (semaines commençant lundi)
  const grid = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const startOffset = (first.getDay() + 6) % 7; // lundi = 0
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.y, cursor.m, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const todayStr = ymd(today);

  function prevMonth() {
    setCursor(c => c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 });
  }
  function nextMonth() {
    setCursor(c => c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 });
  }

  const selectedRdv = selectedDay ? rdvByDate[selectedDay] || [] : [];

  return (
    <div className="rounded-2xl border border-white/[0.10] bg-white/[0.06] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-100">Calendrier des RDV</h2>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth}
            className="w-6 h-6 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-500 hover:text-slate-300 text-xs transition-all">‹</button>
          <span className="text-xs font-medium text-slate-300 w-32 text-center">
            {MONTHS[cursor.m]} {cursor.y}
          </span>
          <button onClick={nextMonth}
            className="w-6 h-6 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-500 hover:text-slate-300 text-xs transition-all">›</button>
        </div>
      </div>

      {/* En-têtes jours */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] text-slate-700 font-semibold py-1">{d}</div>
        ))}
      </div>

      {/* Grille */}
      <div className="grid grid-cols-7 gap-1">
        {grid.map((date, i) => {
          if (!date) return <div key={i} />;
          const ds = ymd(date);
          const rdvs = rdvByDate[ds] || [];
          const isToday = ds === todayStr;
          const isSelected = ds === selectedDay;
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(rdvs.length > 0 ? (isSelected ? null : ds) : null)}
              className={[
                "aspect-square rounded-lg flex flex-col items-center justify-center gap-1 text-xs transition-all relative",
                isSelected   ? "bg-violet-500/25 ring-1 ring-violet-500/40"
                : isToday    ? "bg-white/[0.08] text-slate-100 font-bold"
                : rdvs.length ? "bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 cursor-pointer"
                :              "text-slate-700",
              ].join(" ")}
            >
              <span>{date.getDate()}</span>
              {rdvs.length > 0 && (
                <div className="flex gap-0.5">
                  {rdvs.slice(0, 3).map((r, j) => (
                    <span key={j} className={`w-1 h-1 rounded-full ${RDV_DOT[r.rdv_statut] || "bg-violet-400"}`} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Détail du jour sélectionné */}
      {selectedDay && selectedRdv.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
          <p className="text-xs font-semibold text-slate-400">
            {new Date(selectedDay + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          {selectedRdv
            .sort((a, b) => (a.rdv_heure || "").localeCompare(b.rdv_heure || ""))
            .map((l, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                {l.rdv_heure && (
                  <span className="text-xs mono text-violet-300 shrink-0 w-12">{l.rdv_heure}</span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-200 truncate">{l.nom}</div>
                  <div className="text-xs text-slate-600 truncate">{l.metier}{l.rdv_lieu ? ` · ${l.rdv_lieu}` : ""}</div>
                </div>
                <span className={`w-2 h-2 rounded-full shrink-0 ${RDV_DOT[l.rdv_statut] || "bg-violet-400"}`} />
              </div>
            ))}
        </div>
      )}

      {/* Légende */}
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/[0.06] text-[10px] text-slate-700">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />Confirmé</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />En attente</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-500" />Effectué</span>
      </div>
    </div>
  );
}
