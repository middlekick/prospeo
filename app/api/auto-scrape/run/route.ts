import { NextResponse }       from "next/server";
import { auth }               from "@clerk/nextjs/server";
import { getJson }            from "serpapi";
import { prisma }             from "@/lib/prisma";
import { normalizeLead }      from "@/lib/db";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auto-scrape/run
//
// Endpoint sécurisé par Clerk — déclenche le scraping pour les configs
// activées de l'utilisateur connecté (exécution manuelle depuis /auto-scrape).
//
// Avantage vs /api/cron/auto-scrape :
//  - Pas de secret exposé côté client (NEXT_PUBLIC_CRON_SECRET)
//  - Limité aux configs du user connecté seulement
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

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const apiKey = process.env.SERPAPI_KEY || "";
  if (!apiKey) return NextResponse.json({ error: "SERPAPI_KEY manquante" }, { status: 500 });

  // Récupérer uniquement les configs activées de l'utilisateur connecté
  const configs = await prisma.autoScrapeConfig.findMany({
    where: { user_id: userId, enabled: true },
  });

  if (!configs.length) {
    return NextResponse.json({ ok: true, message: "Aucune config activée", results: [], totalAdded: 0 });
  }

  const today   = new Date().toISOString().slice(0, 10);
  const results: { metier: string; ville: string; added: number; skipped: number }[] = [];

  for (const config of configs) {
    const { metier, ville, pays, nb_per_run, id } = config;

    const existing = await prisma.lead.findMany({
      where:  { user_id: userId },
      select: { nom: true, telephone: true },
    });
    const existingKeys = new Set(
      existing.map(r => `${r.nom.toLowerCase()}|${r.telephone.toLowerCase()}`)
    );

    const query = `${metier} ${ville} ${pays}`;
    let collected: Record<string, unknown>[] = [];
    let start = 0;

    while (collected.length < nb_per_run) {
      let page: Record<string, unknown>[];
      try {
        page = await fetchPage(query, apiKey, start);
      } catch (e) {
        console.error(`[RUN SCRAPE] Erreur SerpAPI pour "${query}":`, (e as Error).message);
        break;
      }
      if (!page.length) break;
      collected = collected.concat(page);
      start += PAGE_SIZE;
      if (page.length < PAGE_SIZE) break;
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
      if (!c.nom || existingKeys.has(key)) { skipped++; continue; }

      await prisma.lead.create({
        data: {
          user_id:     userId,
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

    await prisma.autoScrapeConfig.update({
      where: { id },
      data: { last_run_at: new Date(), last_run_added: added },
    });

    results.push({ metier, ville, added, skipped });
  }

  const totalAdded = results.reduce((s, r) => s + r.added, 0);
  return NextResponse.json({ ok: true, results, totalAdded });
}
