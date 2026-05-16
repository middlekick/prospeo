"use client";

import { Lead, TAG_COLORS, TAG_LABEL, TAG_OPTIONS, isRappelDue } from "./types";
import { toWhatsAppUrl } from "@/lib/phone";

interface Props {
  leads: Lead[];
  onOpen: (lead: Lead) => void;
  onTagChange: (lead: Lead, tag: string) => void;
}

// Colonnes kanban dans l'ordre souhaité
const COLUMNS = [
  { value: "non_appele",    label: "Non appelé",     icon: "○" },
  { value: "ne_repond_pas", label: "Ne répond pas",  icon: "📵" },
  { value: "interesse",     label: "Intéressé",       icon: "⭐" },
  { value: "rdv_pris",      label: "RDV pris",        icon: "📅" },
  { value: "pas_interesse", label: "Pas intéressé",  icon: "✗"  },
] as const;

// Couleurs d'accent par colonne
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

// ── Carte lead dans le kanban ─────────────────────────────────────────────────

function KanbanCard({ lead, onOpen, onTagChange }: { lead: Lead; onOpen: (l: Lead) => void; onTagChange: (l: Lead, t: string) => void }) {
  const due = isRappelDue(lead);

  async function quickMove(e: React.MouseEvent, tag: string) {
    e.stopPropagation();
    onTagChange(lead, tag);
    await fetch("/api/leads/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...lead, tag }),
    });
  }

  return (
    <div
      onClick={() => onOpen(lead)}
      className={[
        "group relative bg-[#181b26] border rounded-xl p-3 cursor-pointer transition-all hover:bg-[#1e2130] hover:border-white/15",
        due ? "border-amber-500/30 bg-amber-500/[0.03]" : "border-white/[0.07]",
      ].join(" ")}
    >
      {/* Nom */}
      <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate transition-colors mb-1">
        {lead.nom || "—"}
      </p>

      {/* Métier */}
      <p className="text-[11px] text-slate-600 truncate mb-2">{lead.metier || "—"}</p>

      {/* Téléphone */}
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

      {/* Rappel */}
      {lead.rappel && (
        <div className={`mt-1.5 text-[10px] mono ${due ? "text-amber-400 font-semibold" : "text-slate-700"}`}>
          {due ? "⏰ " : "📅 "}{lead.rappel}
        </div>
      )}

      {/* Flèche vers colonne suivante (apparaît au hover) */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
        {/* Bouton → colonne suivante */}
        {(() => {
          const idx     = COLUMNS.findIndex(c => c.value === lead.tag);
          const nextCol = idx >= 0 && idx < COLUMNS.length - 1 ? COLUMNS[idx + 1] : null;
          if (!nextCol) return null;
          return (
            <button
              onClick={e => quickMove(e, nextCol.value)}
              title={`→ ${nextCol.label}`}
              className="w-5 h-5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-slate-500 hover:text-white text-[10px] transition-all flex items-center justify-center"
            >
              →
            </button>
          );
        })()}
      </div>
    </div>
  );
}

// ── Vue kanban complète ───────────────────────────────────────────────────────

export default function KanbanView({ leads, onOpen, onTagChange }: Props) {
  return (
    <div className="flex gap-3 p-4 overflow-x-auto h-full">
      {COLUMNS.map(col => {
        const colLeads = leads.filter(l => l.tag === col.value);
        const accentCls = COLUMN_ACCENT[col.value];
        const countCls  = COLUMN_COUNT_BG[col.value];

        return (
          <div
            key={col.value}
            className={`flex flex-col gap-2 min-w-[220px] w-[220px] shrink-0`}
          >
            {/* En-tête colonne */}
            <div className={`flex items-center gap-2 px-2 py-2 rounded-lg border-l-2 ${accentCls} bg-white/[0.02]`}>
              <span className="text-sm">{col.icon}</span>
              <span className="text-xs font-semibold text-slate-400 flex-1">{col.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${countCls}`}>
                {colLeads.length}
              </span>
            </div>

            {/* Cartes */}
            <div className="flex flex-col gap-2 flex-1 overflow-y-auto pb-4">
              {colLeads.length === 0 ? (
                <div className="flex items-center justify-center h-16 border border-dashed border-white/[0.06] rounded-xl">
                  <p className="text-[10px] text-slate-700">Aucun lead</p>
                </div>
              ) : (
                colLeads.map((lead, i) => (
                  <KanbanCard
                    key={`${lead.nom}|${lead.telephone}|${i}`}
                    lead={lead}
                    onOpen={onOpen}
                    onTagChange={onTagChange}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
