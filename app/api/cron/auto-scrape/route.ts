import { NextRequest, NextResponse } from "next/server";
import { getJson }                    from "serpapi";
import { prisma }                     from "@/lib/prisma";
import { normalizeLead }              from "@/lib/db";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/cron/auto-scrape
//
// Appelé automatiquement par Vercel Cron à 8h UTC (= 9h-10h heure française).
// Aussi appelable manuellement depuis la page /auto-scrape ("Lancer maintenant").
//
// Sécurité : vérifie l'en-tête Authorization: Bearer {CRON_SECRET}
//   - Vercel Cron l'envoie automatiquement (variable CRON_SECRET injectée)
//   - L'UI l'envoie manuellement aussi
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

async function fetchPage(query: string, apiKey: string, start: number): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    getJson(
      { engine: "google_maps", q: query, hl: "fr", api_key: apiKey, start },
      (json: Record<string, unknown>) => {
        if (json.error) reject(new Error(String(json.error)));
        else resolve((json.local_results as Record<string, unknown>[]) || []);
      }
    );
  });
}

export async function POST(req: NextRequest) {
  // ── Auth cron ────────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") || "";
  const token      = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!cronSecret) {
    console.error("[CRON SCRAPE] CRON_SECRET non configurée — le cron ne peut pas s'exécuter. Ajoutez la variable sur Vercel.");
    return NextResponse.json({ error: "CRON_SECRET non configurée" }, { status: 500 });
  }
  if (token !== cronSecret) {
    console.warn("[CRON SCRAPE] Tentative d'accès non autorisée (token invalide)");
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const apiKey = process.env.SERPAPI_KEY || "";
  if (!apiKey) {
    console.error("[CRON SCRAPE] SERPAPI_KEY manquante");
    return NextResponse.json({ error: "SERPAPI_KEY manquante" }, { status: 500 });
  }

  // ── Récupérer toutes les configs activées ─────────────────────────────────
  const configs = await prisma.autoScrapeConfig.findMany({
    where: { enabled: true },
  });

  if (!configs.length) {
    console.warn("[CRON SCRAPE] Aucune config auto-scraping activée — rien à faire");
    return NextResponse.json({ ok: true, message: "Aucune config activée", results: [] });
  }

  console.log(`[CRON SCRAPE] Démarrage — ${configs.length} config(s) activée(s)`);

  const today  = new Date().toISOString().slice(0, 10);
  const results: { metier: string; ville: string; added: number; skipped: number }[] = [];

  for (const config of configs) {
    const { user_id, metier, ville, pays, nb_per_run, id } = config;

    // Charger les leads existants pour la déduplication
    const existing = await prisma.lead.findMany({
      where:  { user_id },
      select: { nom: true, telephone: true },
    });
    const existingKeys = new Set(
      existing.map(r => `${r.nom.toLowerCase()}|${r.telephone.toLowerCase()}`)
    );

    const query = `${metier} ${ville} ${pays}`;
    let collected: Record<string, unknown>[] = [];
    let start = 0;

    // Scraper jusqu'à nb_per_run résultats
    while (collected.length < nb_per_run) {
      let page: Record<string, unknown>[];
      try {
        page = await fetchPage(query, apiKey, start);
      } catch (e) {
        console.error(`[CRON SCRAPE] Erreur SerpAPI pour "${query}":`, (e as Error).message);
        break;
      }
      if (!page.length) break;
      collected = collected.concat(page);
      start += PAGE_SIZE;
      if (page.length < PAGE_SIZE) break;
      // Petite pause pour ne pas saturer l'API
      await new Promise(r => setTimeout(r, 300));
    }

    let added   = 0;
    let skipped = 0;

    for (const r of collected.slice(0, nb_per_run)) {
      const c = normalizeLead({
        nom:         String(r.title || ""),
        metier,
        telephone:   String(r.phone || ""),
        site:        String(r.website || ""),
        emplacement: String(r.address || ville),
        pays,
        created_at:  today,
      });

      const key = `${c.nom.toLowerCase()}|${c.telephone.toLowerCase()}`;

      if (!c.nom || existingKeys.has(key)) {
        skipped++;
        continue;
      }

      await prisma.lead.create({
        data: {
          user_id,
          nom:         c.nom,
          metier:      c.metier,
          telephone:   c.telephone,
          site:        c.site,
          emplacement: c.emplacement,
          pays:        c.pays,
          created_at:  c.created_at,
        },
      });

      existingKeys.add(key);
      added++;
    }

    // Mettre à jour les stats de la config
    await prisma.autoScrapeConfig.update({
      where: { id },
      data: {
        last_run_at:    new Date(),
        last_run_added: added,
      },
    });

    results.push({ metier, ville, added, skipped });
    console.log(`[CRON SCRAPE] "${metier} ${ville}" → ${added} ajoutés, ${skipped} doublons`);
  }

  const totalAdded = results.reduce((s, r) => s + r.added, 0);
  console.log(`[CRON SCRAPE] Terminé — ${totalAdded} leads ajoutés au total`);

  return NextResponse.json({ ok: true, results, totalAdded });
}
