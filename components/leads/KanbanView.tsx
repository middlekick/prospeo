"use client";

import { useState } from "react";
import { Lead, isRappelDue } from "./types";
import { toWhatsAppUrl } from "@/lib/phone";

interface Props {
  leads: Lead[];
  onOpen: (lead: Lead) => void;
  onTagChange: (lead: Lead, tag: string) => void;
}

// Colonnes kanban dans l'ordre du pipeline
const COLUMNS = [
  { value: "non_appele",    label: "Non appelÃ©",     icon: "â—‹"  },
  { value: "ne_repond_pas", label: "Ne rÃ©pond pas",  icon: "ðŸ“µ" },
  { value: "interesse",     label: "IntÃ©ressÃ©",       icon: "â­" },
  { value: "rdv_pris",      label: "RDV pris",        icon: "ðŸ“…" },
  { value: "pas_interesse", label: "Pas intÃ©ressÃ©",  icon: "âœ—"  },
] as const;

const COLUMN_ACCENT: Record<string, string> = {
  non_appele:    "border-slate-600",
  ne_repond_pas: "border-orange-500/50",
  interesse:     "border-cyan-500/50",
  rdv_pris:      "border-green-500/50",
  pas_interesse: "border-red-500/30",
};

const COLUMN_COUNT_BG: Record<string, string> = {
  non_appele:    "bg-slate-700 text-slate-300",
  ne_repond_pas: "bg-orange-900/40 text-orange-400",
  interesse:     "bg-cyan-900/40 text-cyan-400",
  rdv_pris:      "bg-green-900/40 text-green-400",
  pas_interesse: "bg-red-900/40 text-red-400",
};

// Surbrillance de la colonne survolÃ©e pendant le drag
const COLUMN_DROP_BG: Record<string, string> = {
  non_appele:    "bg-slate-500/[0.08] border-slate-500/40",
  ne_repond_pas: "bg-orange-500/[0.08] border-orange-500/40",
  interesse:     "bg-cyan-500/[0.08] border-cyan-500/40",
  rdv_pris:      "bg-green-500/[0.08] border-green-500/40",
  pas_interesse: "bg-red-500/[0.08] border-red-500/40",
};

// â”€â”€ Carte lead â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function KanbanCard({
  lead, onOpen, dragging, onDragStart, onDragEnd,
}: {
  lead: Lead;
  onOpen: (l: Lead) => void;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const due = isRappelDue(lead);

  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.effectAllowed = "move"; onDragStart(); }}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(lead)}
      className={[
        "group relative bg-[#181b26] border rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all hover:bg-[#1e2130] hover:border-white/15",
        due ? "border-amber-500/30 bg-amber-500/[0.03]" : "border-white/[0.07]",
        dragging ? "opacity-40 scale-95 ring-2 ring-brand-500/50" : "",
      ].join(" ")}
    >
      {/* PoignÃ©e de drag (indicateur visuel) */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-700 text-xs select-none">
        â ¿
      </div>

      <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate transition-colors mb-1 pr-4">
        {lead.nom || "â€”"}
      </p>
      <p className="text-[11px] text-slate-600 truncate mb-2">{lead.metier || "â€”"}</p>

      {lead.telephone ? (
        <a
          href={toWhatsAppUrl(lead.telephone)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-[11px] mono text-slate-500 hover:text-green-400 transition-colors"
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" className="text-green-600/50">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
          </svg>
          {lead.telephone}
        </a>
      ) : (
        <span className="text-[11px] text-slate-700">Pas de tel</span>
      )}

      {lead.rappel && (
        <div className={`mt-1.5 text-[10px] mono ${due ? "text-amber-400 font-semibold" : "text-slate-700"}`}>
          {due ? "â° " : "ðŸ“… "}{lead.rappel}
        </div>
      )}
    </div>
  );
}

// â”€â”€ Vue kanban avec drag & drop natif â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function KanbanView({ leads, onOpen, onTagChange }: Props) {
  // Lead en cours de dÃ©placement
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  // Colonne survolÃ©e pendant le drag
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const draggedLead = draggedKey
    ? leads.find(l => `${l.nom}|${l.telephone}` === draggedKey) ?? null
    : null;

  async function handleDrop(targetTag: string) {
    setDragOverCol(null);
    const lead = draggedLead;
    setDraggedKey(null);
    if (!lead || lead.tag === targetTag) return;

    // Mise Ã  jour optimiste
    onTagChange(lead, targetTag);
    try {
      await fetch("/api/leads/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lead, tag: targetTag }),
      });
    } catch {
      // En cas d'erreur, on remet l'ancien tag
      onTagChange(lead, lead.tag);
    }
  }

  return (
    <div className="flex gap-3 p-4 overflow-x-auto h-full">
      {COLUMNS.map(col => {
        const colLeads  = leads.filter(l => l.tag === col.value);
        const accentCls = COLUMN_ACCENT[col.value];
        const countCls  = COLUMN_COUNT_BG[col.value];
        const isDropTarget = dragOverCol === col.value && draggedLead && draggedLead.tag !== col.value;

        return (
          <div
            key={col.value}
            onDragOver={e => { e.preventDefault(); setDragOverCol(col.value); }}
            onDragLeave={e => {
              // Ne rÃ©initialiser que si on quitte vraiment la colonne (pas un enfant)
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null);
            }}
            onDrop={() => handleDrop(col.value)}
            className={[
              "flex flex-col gap-2 min-w-[230px] w-[230px] shrink-0 rounded-xl border transition-all",
              isDropTarget
                ? COLUMN_DROP_BG[col.value]
                : "border-transparent",
            ].join(" ")}
          >
            {/* En-tÃªte colonne */}
            <div className={`flex items-center gap-2 px-2 py-2 rounded-lg border-l-2 ${accentCls} bg-white/[0.02] m-1 mb-0`}>
              <span className="text-sm">{col.icon}</span>
              <span className="text-xs font-semibold text-slate-400 flex-1">{col.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${countCls}`}>
                {colLeads.length}
              </span>
            </div>

            {/* Cartes */}
            <div className="flex flex-col gap-2 flex-1 overflow-y-auto px-1 pb-4">
              {colLeads.length === 0 ? (
                <div
                  className={[
                    "flex items-center justify-center h-16 border border-dashed rounded-xl transition-all",
                    isDropTarget ? "border-brand-500/50 bg-brand-500/[0.05]" : "border-white/[0.06]",
                  ].join(" ")}
                >
                  <p className="text-[10px] text-slate-700">
                    {isDropTarget ? "DÃ©poser ici" : "Aucun lead"}
                  </p>
                </div>
              ) : (
                colLeads.map((lead, i) => {
                  const key = `${lead.nom}|${lead.telephone}`;
                  return (
                    <KanbanCard
                      key={`${key}|${i}`}
                      lead={lead}
                      onOpen={onOpen}
                      dragging={draggedKey === key}
                      onDragStart={() => setDraggedKey(key)}
                      onDragEnd={() => { setDraggedKey(null); setDragOverCol(null); }}
                    />
                  );
                })
              )}

              {/* Zone de dÃ©pÃ´t en bas si la colonne a dÃ©jÃ  des cartes */}
              {colLeads.length > 0 && isDropTarget && (
                <div className="flex items-center justify-center h-10 border border-dashed border-brand-500/50 bg-brand-500/[0.05] rounded-xl">
                  <p className="text-[10px] text-brand-400">DÃ©poser ici</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

