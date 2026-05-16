"use client";

import { useState, useRef, useEffect } from "react";
import { Lead, TAG_COLORS, TAG_OPTIONS, TAG_LABEL, RDV_STATUT_COLORS, isRappelDue } from "./types";
import { toWhatsAppUrl } from "@/lib/phone";
import { useToast } from "@/components/ui/Toast";

type SortKey = "nom" | "metier" | "emplacement" | "rappel" | "tag";
type SortDir = "asc" | "desc";

const RDV_LABEL: Record<string, string> = {
  en_attente: "En attente",
  confirme:   "Confirmé",
  annule:     "Annulé",
  effectue:   "Effectué",
};

interface Props {
  leads: Lead[];
  onOpen: (lead: Lead) => void;
  onTagChange: (lead: Lead, tag: string) => void;
  // Sélection multiple
  selected?: Set<string>;
  onToggleSelect?: (key: string) => void;
  onSelectAll?: () => void;
  selectionMode?: boolean;
}

// ── Popover tag inline ────────────────────────────────────────────────────────

function TagPopover({
  lead,
  anchor,
  onSelect,
  onClose,
}: {
  lead: Lead;
  anchor: DOMRect;
  onSelect: (tag: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{ position: "fixed", top: anchor.bottom + 6, left: anchor.left, zIndex: 100 }}
      className="bg-[#181b26] border border-white/12 rounded-xl shadow-2xl p-1.5 min-w-[172px]"
    >
      <p className="text-[10px] text-slate-600 px-2 pb-1 font-semibold tracking-wider uppercase">Changer le statut</p>
      {TAG_OPTIONS.map(o => {
        const cls = TAG_COLORS[o.value] || "";
        return (
          <button
            key={o.value}
            onClick={(e) => { e.stopPropagation(); onSelect(o.value); }}
            className={[
              "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors hover:bg-white/[0.06]",
              lead.tag === o.value ? "opacity-40 cursor-default" : "",
            ].join(" ")}
          >
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{o.label}</span>
            {lead.tag === o.value && <span className="ml-auto text-slate-600 text-[10px]">✓ actuel</span>}
          </button>
        );
      })}
    </div>
  );
}

// ── Icône tri ─────────────────────────────────────────────────────────────────

function SortChip({
  label, sortKey, active, dir, onToggle,
}: {
  label: string;
  sortKey: SortKey;
  active: boolean;
  dir: SortDir;
  onToggle: (k: SortKey) => void;
}) {
  return (
    <button
      onClick={() => onToggle(sortKey)}
      className={[
        "flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-all font-medium",
        active
          ? "bg-violet-500/15 text-violet-300 border border-violet-500/25"
          : "text-slate-600 hover:text-slate-300 hover:bg-white/[0.05] border border-transparent",
      ].join(" ")}
    >
      {label}
      {active && <span className="text-violet-400">{dir === "asc" ? "↑" : "↓"}</span>}
    </button>
  );
}

// ── Boutons log appel rapide ──────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { tag: "ne_repond_pas", label: "📵", title: "Ne répond pas",  cls: "hover:bg-orange-500/20 hover:text-orange-400" },
  { tag: "interesse",     label: "⭐", title: "Intéressé",       cls: "hover:bg-cyan-500/20 hover:text-cyan-400"    },
  { tag: "pas_interesse", label: "✗",  title: "Pas intéressé",  cls: "hover:bg-red-500/20 hover:text-red-400"      },
];

// ── Table principale ──────────────────────────────────────────────────────────

export default function LeadsTable({ leads, onOpen, onTagChange, selected, onToggleSelect, selectionMode }: Props) {
  const { error: toastError } = useToast();
  const [sortKey, setSortKey] = useState<SortKey>("nom");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [tagPopover, setTagPopover] = useState<{ lead: Lead; rect: DOMRect } | null>(null);
  const [quickLogging, setQuickLogging] = useState<string | null>(null); // clé du lead en cours de log

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  const sorted = [...leads].sort((a, b) => {
    const va = String(a[sortKey] ?? "").toLowerCase();
    const vb = String(b[sortKey] ?? "").toLowerCase();
    return sortDir === "asc" ? va.localeCompare(vb, "fr") : vb.localeCompare(va, "fr");
  });

  function openTagPopover(e: React.MouseEvent, lead: Lead) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTagPopover({ lead, rect });
  }

  async function handleTagSelect(lead: Lead, tag: string) {
    setTagPopover(null);
    if (lead.tag === tag) return;
    const previousTag = lead.tag;
    onTagChange(lead, tag); // mise à jour optimiste
    try {
      const res = await fetch("/api/leads/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lead, tag }),
      });
      if (!res.ok) throw new Error("Échec de la mise à jour du statut");
    } catch (err) {
      onTagChange(lead, previousTag); // rollback
      toastError((err as Error).message);
    }
  }

  // Log appel rapide — change le tag (l'activité est loggée côté serveur)
  async function handleQuickLog(e: React.MouseEvent, lead: Lead, tag: string) {
    e.stopPropagation();
    const key = `${lead.nom}|${lead.telephone}`;
    if (quickLogging === key) return;
    const previousTag = lead.tag;
    setQuickLogging(key);
    onTagChange(lead, tag); // mise à jour optimiste
    try {
      const res = await fetch("/api/leads/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lead, tag }),
      });
      if (!res.ok) throw new Error("Échec de l'enregistrement de l'appel");
    } catch (err) {
      onTagChange(lead, previousTag); // rollback
      toastError((err as Error).message);
    } finally {
      setQuickLogging(null);
    }
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-700 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-700">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <p className="text-sm text-slate-600">Aucun lead pour ce filtre</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Barre de tri ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.01]">
        <span className="text-[10px] text-slate-700 font-semibold tracking-wider uppercase mr-1">Trier par</span>
        {(["nom", "metier", "emplacement", "tag", "rappel"] as SortKey[]).map(k => (
          <SortChip
            key={k}
            sortKey={k}
            label={k === "nom" ? "Entreprise" : k === "metier" ? "Métier" : k === "emplacement" ? "Lieu" : k === "tag" ? "Statut" : "Rappel"}
            active={sortKey === k}
            dir={sortDir}
            onToggle={toggleSort}
          />
        ))}
        <span className="ml-auto text-[10px] text-slate-700 mono">{leads.length} lead{leads.length > 1 ? "s" : ""}</span>
      </div>

      {/* ── Liste de leads (card-rows) ────────────────────────────────────── */}
      <div className="divide-y divide-white/[0.04]">
        {sorted.map((lead, i) => {
          const tagCls  = TAG_COLORS[lead.tag] || "bg-slate-800/60 text-slate-400";
          const rdvCls  = lead.rdv_statut ? RDV_STATUT_COLORS[lead.rdv_statut] || "" : "";
          const due     = isRappelDue(lead);
          const leadKey = `${lead.nom}|${lead.telephone}`;
          const isLogging = quickLogging === leadKey;
          const isSelected = selected?.has(leadKey) ?? false;

          return (
            <div
              key={`${lead.nom}-${lead.telephone}-${i}`}
              onClick={() => selectionMode && onToggleSelect ? onToggleSelect(leadKey) : onOpen(lead)}
              className={[
                "group flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-all duration-100",
                due       ? "bg-amber-500/[0.03] hover:bg-amber-500/[0.07]" : "hover:bg-white/[0.03]",
                isSelected ? "bg-violet-500/[0.06] border-l-2 border-violet-500" : "",
              ].join(" ")}
            >
              {/* ── Checkbox de sélection (visible si selectionMode ou hover) ──── */}
              {(selectionMode || selected) && (
                <div
                  onClick={e => { e.stopPropagation(); onToggleSelect?.(leadKey); }}
                  className={[
                    "w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all",
                    isSelected
                      ? "bg-violet-500 border-violet-500"
                      : "border-white/20 group-hover:border-white/40",
                    selectionMode ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                  ].join(" ")}
                >
                  {isSelected && <span className="text-white text-[9px] font-bold">✓</span>}
                </div>
              )}

              {/* ── Indicateur + Nom ─────────────────────────────── */}
              <div className="flex items-center gap-3 min-w-0 w-[220px] shrink-0">
                {lead.site ? (
                  <a href={lead.site} target="_blank" rel="noopener noreferrer"
                     onClick={e => e.stopPropagation()}
                     title={lead.site}
                     className="w-2 h-2 rounded-full bg-cyan-500 shrink-0 hover:bg-cyan-300 transition-colors" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-white/10 shrink-0" />
                )}
                <span className="text-sm font-semibold text-slate-200 group-hover:text-white truncate transition-colors">
                  {lead.nom || "—"}
                </span>
              </div>

              {/* ── Métier ───────────────────────────────────────── */}
              <span className="text-xs text-slate-500 w-[140px] shrink-0 truncate">
                {lead.metier || "—"}
              </span>

              {/* ── Téléphone ────────────────────────────────────── */}
              <div className="w-[140px] shrink-0">
                {lead.telephone ? (
                  <a href={toWhatsAppUrl(lead.telephone)} target="_blank" rel="noopener noreferrer"
                     onClick={e => e.stopPropagation()}
                     className="inline-flex items-center gap-1.5 text-xs mono text-slate-400 hover:text-green-400 transition-colors">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-green-600/60">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                    </svg>
                    {lead.telephone}
                  </a>
                ) : (
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(`${lead.nom} ${lead.emplacement} téléphone`)}`}
                    target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    title="Rechercher sur Google"
                    className="inline-flex items-center gap-1 text-xs text-slate-700 hover:text-cyan-400 transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                    </svg>
                    Trouver
                  </a>
                )}
              </div>

              {/* ── Emplacement ──────────────────────────────────── */}
              <span className="text-xs text-slate-600 flex-1 min-w-0 truncate hidden xl:block">
                {lead.emplacement || "—"}
              </span>

              {/* ── Statut (tag) ─────────────────────────────────── */}
              <div className="shrink-0">
                <button
                  onClick={e => openTagPopover(e, lead)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${tagCls} hover:ring-1 hover:ring-white/20 transition-all`}
                  title="Modifier le statut"
                >
                  {TAG_LABEL[lead.tag] || lead.tag}
                </button>
              </div>

              {/* ── RDV ──────────────────────────────────────────── */}
              <div className="w-[100px] shrink-0 text-right hidden lg:block">
                {lead.rdv_statut ? (
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${rdvCls}`}>
                    {RDV_LABEL[lead.rdv_statut] || lead.rdv_statut}
                  </span>
                ) : null}
              </div>

              {/* ── Rappel ───────────────────────────────────────── */}
              <div className="w-[90px] shrink-0 text-right hidden sm:block">
                {lead.rappel ? (
                  <span className={`text-[11px] mono ${due ? "text-amber-400 font-semibold" : "text-slate-700"}`}>
                    {due && "⏰ "}{lead.rappel}
                  </span>
                ) : null}
              </div>

              {/* ── Actions rapides (hover) ────────────────────────── */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {isLogging ? (
                  <div className="w-3 h-3 rounded-full border border-violet-500/50 border-t-violet-400 animate-spin" />
                ) : (
                  QUICK_ACTIONS.map(action => (
                    <button
                      key={action.tag}
                      onClick={e => handleQuickLog(e, lead, action.tag)}
                      title={action.title}
                      className={`w-6 h-6 rounded-md text-slate-600 text-xs transition-all ${action.cls} flex items-center justify-center`}
                    >
                      {action.label}
                    </button>
                  ))
                )}
              </div>

              {/* ── Flèche hover ─────────────────────────────────── */}
              <span className="text-slate-700 group-hover:text-slate-400 transition-colors text-xs shrink-0 ml-1">→</span>
            </div>
          );
        })}
      </div>

      {tagPopover && (
        <TagPopover
          lead={tagPopover.lead}
          anchor={tagPopover.rect}
          onSelect={tag => handleTagSelect(tagPopover.lead, tag)}
          onClose={() => setTagPopover(null)}
        />
      )}
    </>
  );
}
