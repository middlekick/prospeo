/**
 * Script de migration : data/artisans.json → PostgreSQL (Prisma)
 *
 * Usage :
 *   npx tsx scripts/migrate-json-to-db.ts <CLERK_USER_ID>
 *
 * Récupère ton userId Clerk sur : https://dashboard.clerk.com
 * (Onglet Users → clique sur ton compte → copie l'User ID commençant par "user_")
 *
 * Exemple :
 *   npx tsx scripts/migrate-json-to-db.ts user_2abc123xyz
 */

import fs   from "fs";
import path from "path";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma  = new PrismaClient({ adapter } as never);

interface RawLead {
  nom?:            string;
  metier?:         string;
  telephone?:      string;
  site?:           string;
  emplacement?:    string;
  pays?:           string;
  tag?:            string;
  rappel?:         string;
  note?:           string;
  created_at?:     string;
  contacted_at?:   string;
  ads_prenom?:     string;
  ads_nomclient?:  string;
  ads_entreprise?: string;
  ads_tel?:        string;
  ads_email?:      string;
  ads_zone?:       string;
  ads_rayon?:      string;
  ads_statut?:     string;
  ads_budget?:     string;
  ads_type?:       string;
  ads_services?:   string[];
  ads_notes?:      string;
  rdv_date?:       string;
  rdv_heure?:      string;
  rdv_statut?:     string;
  rdv_lieu?:       string;
  rdv_notes?:      string;
  activities?:     unknown[];
}

async function main() {
  const userId = process.argv[2];
  if (!userId || !userId.startsWith("user_")) {
    console.error("❌  Usage : npx tsx scripts/migrate-json-to-db.ts user_XXXX");
    console.error("   Récupère ton userId sur https://dashboard.clerk.com");
    process.exit(1);
  }

  const dataFile = path.join(process.cwd(), "data", "artisans.json");
  if (!fs.existsSync(dataFile)) {
    console.error(`❌  Fichier introuvable : ${dataFile}`);
    process.exit(1);
  }

  const db   = JSON.parse(fs.readFileSync(dataFile, "utf-8")) as { artisans: RawLead[] };
  const rows = db.artisans ?? [];

  console.log(`📦  ${rows.length} leads trouvés dans artisans.json`);
  console.log(`👤  userId Clerk : ${userId}`);

  let inserted = 0;
  let skipped  = 0;

  for (const r of rows) {
    if (!r.nom) { skipped++; continue; }

    // Vérifie si ce lead existe déjà (dédup par nom+telephone+user_id)
    const existing = await prisma.lead.findFirst({
      where: {
        user_id:   userId,
        nom:       { equals: r.nom || "",             mode: "insensitive" },
        telephone: { equals: r.telephone || "",       mode: "insensitive" },
      },
    });

    if (existing) { skipped++; continue; }

    await prisma.lead.create({
      data: {
        user_id:        userId,
        nom:            r.nom            ?? "",
        metier:         r.metier         ?? "",
        telephone:      r.telephone      ?? "",
        site:           r.site           ?? "",
        emplacement:    r.emplacement    ?? "",
        pays:           r.pays           ?? "France",
        tag:            r.tag            ?? "non_appele",
        rappel:         r.rappel         ?? "",
        note:           r.note           ?? "",
        created_at:     r.created_at     ?? "",
        contacted_at:   r.contacted_at   ?? "",
        ads_prenom:     r.ads_prenom     ?? "",
        ads_nomclient:  r.ads_nomclient  ?? "",
        ads_entreprise: r.ads_entreprise ?? "",
        ads_tel:        r.ads_tel        ?? "",
        ads_email:      r.ads_email      ?? "",
        ads_zone:       r.ads_zone       ?? "",
        ads_rayon:      r.ads_rayon      ?? "",
        ads_statut:     r.ads_statut     ?? "",
        ads_budget:     r.ads_budget     ?? "",
        ads_type:       r.ads_type       ?? "",
        ads_services:   Array.isArray(r.ads_services) ? r.ads_services : [],
        ads_notes:      r.ads_notes      ?? "",
        rdv_date:       r.rdv_date       ?? "",
        rdv_heure:      r.rdv_heure      ?? "",
        rdv_statut:     r.rdv_statut     ?? "",
        rdv_lieu:       r.rdv_lieu       ?? "",
        rdv_notes:      r.rdv_notes      ?? "",
        activities:     Array.isArray(r.activities) ? r.activities : [],
      },
    });
    inserted++;
    if (inserted % 20 === 0) process.stdout.write(`  ✓ ${inserted} insérés...\r`);
  }

  console.log(`\n✅  Migration terminée : ${inserted} insérés, ${skipped} ignorés (doublons ou sans nom)`);
  const total = await prisma.lead.count({ where: { user_id: userId } });
  console.log(`📊  Total en base pour ${userId} : ${total} leads`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
