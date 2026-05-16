import type { Lead as PrismaLead } from "@prisma/client";

// ─── Journal d'activité ───────────────────────────────────────────────────────
export interface Activity {
  id:      string;
  date:    string;  // YYYY-MM-DDTHH:mm
  type:    "statut" | "email" | "note" | "appel";
  content: string;
  meta?:   string;
}

// ─── Lead (interface applicative) ────────────────────────────────────────────
export interface Lead {
  nom:          string;
  metier:       string;
  telephone:    string;
  site:         string;
  emplacement:  string;
  pays:         string;
  tag:          string;
  rappel:       string;
  note:         string;
  created_at:   string;
  contacted_at: string;
  ads_prenom:     string;
  ads_nomclient:  string;
  ads_entreprise: string;
  ads_tel:        string;
  ads_email:      string;
  ads_zone:       string;
  ads_rayon:      string;
  ads_statut:     string;
  ads_budget:     string;
  ads_type:       string;
  ads_services:   string[];
  ads_notes:      string;
  rdv_date:   string;
  rdv_heure:  string;
  rdv_statut: string;
  rdv_lieu:   string;
  rdv_notes:  string;
  activities: Activity[];
}

// ─── Convertit un résultat Prisma → Lead applicatif ──────────────────────────
export function fromPrisma(p: PrismaLead): Lead {
  return {
    nom:            p.nom,
    metier:         p.metier,
    telephone:      p.telephone,
    site:           p.site,
    emplacement:    p.emplacement,
    pays:           p.pays,
    tag:            p.tag,
    rappel:         p.rappel,
    note:           p.note,
    created_at:     p.created_at,
    contacted_at:   p.contacted_at,
    ads_prenom:     p.ads_prenom,
    ads_nomclient:  p.ads_nomclient,
    ads_entreprise: p.ads_entreprise,
    ads_tel:        p.ads_tel,
    ads_email:      p.ads_email,
    ads_zone:       p.ads_zone,
    ads_rayon:      p.ads_rayon,
    ads_statut:     p.ads_statut,
    ads_budget:     p.ads_budget,
    ads_type:       p.ads_type,
    ads_services:   Array.isArray(p.ads_services) ? (p.ads_services as string[]) : [],
    ads_notes:      p.ads_notes,
    rdv_date:       p.rdv_date,
    rdv_heure:      p.rdv_heure,
    rdv_statut:     p.rdv_statut,
    rdv_lieu:       p.rdv_lieu,
    rdv_notes:      p.rdv_notes,
    activities:     Array.isArray(p.activities) ? (p.activities as unknown as Activity[]) : [],
  };
}

// ─── Normalise des données brutes en entrée (import/scrape) ──────────────────
export function normalizeLead(a: Record<string, unknown>): Lead {
  return {
    nom:            String(a.nom            || a.entreprise    || ""),
    metier:         String(a.metier         || a.category      || ""),
    telephone:      String(a.telephone      || a.tel           || ""),
    site:           String(a.site           || a.website       || ""),
    emplacement:    String(a.emplacement    || a.ville         || ""),
    pays:           String(a.pays           || "France"),
    tag:            String(a.tag            || "non_appele"),
    rappel:         String(a.rappel         || ""),
    note:           String(a.note           || ""),
    created_at:     String(a.created_at     || ""),
    contacted_at:   String(a.contacted_at   || ""),
    ads_prenom:     String(a.ads_prenom     || ""),
    ads_nomclient:  String(a.ads_nomclient  || ""),
    ads_entreprise: String(a.ads_entreprise || ""),
    ads_tel:        String(a.ads_tel        || ""),
    ads_email:      String(a.ads_email      || ""),
    ads_zone:       String(a.ads_zone       || ""),
    ads_rayon:      String(a.ads_rayon      || ""),
    ads_statut:     String(a.ads_statut     || ""),
    ads_budget:     String(a.ads_budget     || ""),
    ads_type:       String(a.ads_type       || ""),
    ads_services:   Array.isArray(a.ads_services) ? a.ads_services as string[] : [],
    ads_notes:      String(a.ads_notes      || ""),
    rdv_date:       String(a.rdv_date       || ""),
    rdv_heure:      String(a.rdv_heure      || ""),
    rdv_statut:     String(a.rdv_statut     || ""),
    rdv_lieu:       String(a.rdv_lieu       || ""),
    rdv_notes:      String(a.rdv_notes      || ""),
    activities:     Array.isArray(a.activities) ? (a.activities as Activity[]) : [],
  };
}

// ─── Clé de déduplication ─────────────────────────────────────────────────────
export function leadKey(a: Pick<Lead, "nom" | "telephone">): string {
  return ((a.nom || "") + "|" + (a.telephone || "")).toLowerCase();
}
