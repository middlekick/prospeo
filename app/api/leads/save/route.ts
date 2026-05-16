import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Activity } from "@/lib/db";

const TAG_NAMES: Record<string, string> = {
  non_appele:    "Non appelé",
  ne_repond_pas: "Ne répond pas",
  interesse:     "Intéressé",
  rdv_pris:      "RDV pris",
  pas_interesse: "Pas intéressé",
};

// POST /api/leads/save — met à jour un lead (identifié par nom+telephone)
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const { nom, telephone, tag, rappel, note,
    ads_prenom, ads_nomclient, ads_entreprise, ads_tel, ads_email,
    ads_zone, ads_rayon, ads_statut, ads_budget, ads_type, ads_services, ads_notes,
    rdv_date, rdv_heure, rdv_statut, rdv_lieu, rdv_notes } = body;

  if (!nom) return NextResponse.json({ error: "nom requis" }, { status: 400 });

  const lead = await prisma.lead.findFirst({
    where: {
      user_id:   userId,
      nom:       { equals: nom,             mode: "insensitive" },
      telephone: { equals: telephone || "", mode: "insensitive" },
    },
  });

  if (!lead)
    return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });

  // ── Journal : changement de statut ────────────────────────────────────────
  const activities: Activity[] = Array.isArray(lead.activities)
    ? (lead.activities as unknown as Activity[]) : [];
  let contacted_at = lead.contacted_at;

  // Rappel automatique J+3 si passage en "Ne répond pas" et aucun rappel existant
  let autoRappel = rappel;

  if (tag !== undefined && tag !== lead.tag) {
    activities.unshift({
      id:      Date.now().toString(),
      date:    new Date().toISOString().slice(0, 16),
      type:    "statut",
      content: `Statut → ${TAG_NAMES[tag] || tag}`,
      meta:    lead.tag,
    });
    if (tag !== "non_appele" && lead.tag === "non_appele" && !lead.contacted_at) {
      contacted_at = new Date().toISOString().slice(0, 10);
    }
    if (tag === "ne_repond_pas" && !lead.rappel && rappel === undefined) {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      autoRappel = d.toISOString().slice(0, 10);
      activities.unshift({
        id:      (Date.now() + 1).toString(),
        date:    new Date().toISOString().slice(0, 16),
        type:    "note",
        content: "Rappel automatique créé — relance dans 3 jours",
      });
    }
  }

  const updated = await prisma.lead.update({
    where: { id: lead.id },
    data: {
      ...(tag         !== undefined && { tag }),
      ...(autoRappel  !== undefined && { rappel: autoRappel }),
      ...(note   !== undefined && { note }),
      ...(ads_prenom     !== undefined && { ads_prenom }),
      ...(ads_nomclient  !== undefined && { ads_nomclient }),
      ...(ads_entreprise !== undefined && { ads_entreprise }),
      ...(ads_tel        !== undefined && { ads_tel }),
      ...(ads_email      !== undefined && { ads_email }),
      ...(ads_zone       !== undefined && { ads_zone }),
      ...(ads_rayon      !== undefined && { ads_rayon }),
      ...(ads_statut     !== undefined && { ads_statut }),
      ...(ads_budget     !== undefined && { ads_budget }),
      ...(ads_type       !== undefined && { ads_type }),
      ...(ads_services   !== undefined && { ads_services: Array.isArray(ads_services) ? ads_services : [] }),
      ...(ads_notes      !== undefined && { ads_notes }),
      ...(rdv_date       !== undefined && { rdv_date }),
      ...(rdv_heure      !== undefined && { rdv_heure }),
      ...(rdv_statut     !== undefined && { rdv_statut }),
      ...(rdv_lieu       !== undefined && { rdv_lieu }),
      ...(rdv_notes      !== undefined && { rdv_notes }),
      activities: activities as unknown as never,
      contacted_at,
    },
  });

  // Retourner le lead mis à jour pour éviter un re-fetch côté client
  return NextResponse.json({ ok: true, lead: updated });
}
