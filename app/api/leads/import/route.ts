import { NextRequest, NextResponse } from "next/server";
import { auth }                       from "@clerk/nextjs/server";
import { prisma }                     from "@/lib/prisma";
import { normalizeLead }              from "@/lib/db";
import { getUserPlan, PLAN_LIMITS }   from "@/lib/plan";
import { normalizePhoneKey, normalizeNameKey } from "@/lib/phone";

// Clé de déduplication fuzzy : téléphone canonique en priorité (identifiant
// fort), sinon repli nom normalisé + ville (leads sans numéro).
function fuzzyKey(nom: string, telephone: string, emplacement: string): string {
  const phone = normalizePhoneKey(telephone);
  if (phone) return `tel:${phone}`;
  const name = normalizeNameKey(nom);
  if (!name) return "";
  const city = normalizeNameKey(emplacement).split(" ")[0] || "";
  return `nom:${name}|${city}`;
}

// POST /api/leads/import — importe un tableau de leads avec déduplication
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // ── Guard plan : import CSV réservé Pro+ ──────────────────────────────────
  const plan = await getUserPlan(userId);
  if (!PLAN_LIMITS[plan].csv) {
    return NextResponse.json(
      { error: "upgrade_required", feature: "csv", plan },
      { status: 403 }
    );
  }

  const { leads } = await req.json() as { leads: Record<string, unknown>[] };
  if (!Array.isArray(leads) || !leads.length)
    return NextResponse.json({ error: "Aucun lead fourni" }, { status: 400 });

  const today = new Date().toISOString().slice(0, 10);

  // Clés existantes pour déduplication fuzzy
  const existing = await prisma.lead.findMany({
    where:  { user_id: userId },
    select: { nom: true, telephone: true, emplacement: true },
  });
  const existingKeys = new Set(
    existing.map(r => fuzzyKey(r.nom, r.telephone, r.emplacement)).filter(Boolean)
  );

  let added = 0, skipped = 0;

  for (const raw of leads) {
    const c = normalizeLead({ ...raw, created_at: raw.created_at || today });
    if (!c.nom) continue;
    const key = fuzzyKey(c.nom, c.telephone, c.emplacement);
    if (key && existingKeys.has(key)) { skipped++; continue; }

    await prisma.lead.create({
      data: {
        user_id: userId, nom: c.nom, metier: c.metier, telephone: c.telephone,
        site: c.site, emplacement: c.emplacement, pays: c.pays, tag: c.tag,
        rappel: c.rappel, note: c.note, created_at: c.created_at,
        contacted_at: c.contacted_at, ads_prenom: c.ads_prenom,
        ads_nomclient: c.ads_nomclient, ads_entreprise: c.ads_entreprise,
        ads_tel: c.ads_tel, ads_email: c.ads_email, ads_zone: c.ads_zone,
        ads_rayon: c.ads_rayon, ads_statut: c.ads_statut, ads_budget: c.ads_budget,
        ads_type: c.ads_type, ads_services: c.ads_services, ads_notes: c.ads_notes,
        rdv_date: c.rdv_date, rdv_heure: c.rdv_heure, rdv_statut: c.rdv_statut,
        rdv_lieu: c.rdv_lieu, rdv_notes: c.rdv_notes, activities: c.activities as unknown as never,
      },
    });
    if (key) existingKeys.add(key);
    added++;
  }

  const total = await prisma.lead.count({ where: { user_id: userId } });
  return NextResponse.json({ added, skipped, total });
}
