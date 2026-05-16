// Source unique de vérité pour le type Lead — défini dans lib/db.ts
export type { Lead } from "@/lib/db";

export const TAGS = [
  { value: "tous",          label: "Tous",          color: "text-slate-400" },
  { value: "rappels",       label: "Rappels",        color: "text-yellow-400" },
  { value: "non_appele",    label: "Non appelé",     color: "text-slate-300" },
  { value: "ne_repond_pas", label: "Ne répond pas",  color: "text-orange-400" },
  { value: "interesse",     label: "Intéressé",      color: "text-cyan-400"   },
  { value: "rdv_pris",      label: "RDV pris",       color: "text-green-400"  },
  { value: "pas_interesse", label: "Pas intéressé",  color: "text-red-400"    },
] as const;

export type TagValue = (typeof TAGS)[number]["value"];

// Options de statut utilisées dans la table et le drawer
export const TAG_OPTIONS = [
  { value: "non_appele",    label: "Non appelé"    },
  { value: "ne_repond_pas", label: "Ne répond pas" },
  { value: "interesse",     label: "Intéressé"     },
  { value: "rdv_pris",      label: "RDV pris"      },
  { value: "pas_interesse", label: "Pas intéressé" },
] as const;

// Lookup rapide label ↔ value
export const TAG_LABEL: Record<string, string> = Object.fromEntries(
  TAG_OPTIONS.map(t => [t.value, t.label])
);

// Retourne true si le rappel est aujourd'hui ou dépassé
export function isRappelDue(lead: { rappel: string }): boolean {
  if (!lead.rappel) return false;
  return lead.rappel <= new Date().toISOString().slice(0, 10);
}

export const TAG_COLORS: Record<string, string> = {
  non_appele:    "bg-slate-700 text-slate-300",
  ne_repond_pas: "bg-orange-900/40 text-orange-400",
  interesse:     "bg-cyan-900/40 text-cyan-400",
  rdv_pris:      "bg-green-900/40 text-green-400",
  pas_interesse: "bg-red-900/40 text-red-400",
};

export const RDV_STATUT_COLORS: Record<string, string> = {
  en_attente: "bg-yellow-900/40 text-yellow-400",
  confirme:   "bg-green-900/40 text-green-400",
  annule:     "bg-red-900/40 text-red-400",
  effectue:   "bg-slate-700 text-slate-300",
};
