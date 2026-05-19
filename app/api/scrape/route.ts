import { NextRequest, NextResponse } from "next/server";
import { getJson }                    from "serpapi";
import { auth }                       from "@clerk/nextjs/server";
import { prisma }                     from "@/lib/prisma";
import { normalizeLead }              from "@/lib/db";
import { checkAndIncrementScrape, getUserPlan, PLAN_LIMITS } from "@/lib/plan";
import { rateLimit }                from "@/lib/rate-limit";

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

// POST /api/scrape — scrape Google Maps et ajoute les leads trouvés
export async function POST(req: NextRequest) {
  const rl = rateLimit("scrape", req, 12, 5 * 60_000); // 12 / 5 min / IP
  if (rl) return rl;

  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // ── Guard plan : vérifier le quota de scraping mensuel ────────────────────
  const scrapeCheck = await checkAndIncrementScrape(userId);
  if (!scrapeCheck.allowed) {
    return NextResponse.json(
      {
        error:   "upgrade_required",
        feature: "scraping",
        message: `Limite de ${scrapeCheck.max} scrapings/mois atteinte. Passez en Pro pour un accès illimité.`,
      },
      { status: 403 }
    );
  }

  const { metier, ville, pays = "France", nb = 20 } = await req.json();
  if (!metier || !ville)
    return NextResponse.json({ error: "metier et ville requis" }, { status: 400 });

  const apiKey = process.env.SERPAPI_KEY || "";
  if (!apiKey)
    return NextResponse.json({ error: "SERPAPI_KEY manquante" }, { status: 500 });

  const query = `${metier} ${ville} ${pays}`;

  try {
    const existing = await prisma.lead.findMany({
      where:  { user_id: userId },
      select: { nom: true, telephone: true },
    });
    const existingKeys = new Set(
      existing.map(r => `${r.nom.toLowerCase()}|${r.telephone.toLowerCase()}`)
    );

    // ── Limite 100 leads pour le plan free ────────────────────────────────────
    const planTier   = await getUserPlan(userId);
    const maxLeads   = PLAN_LIMITS[planTier].maxLeads;
    const currentCount = existing.length;

    if (maxLeads !== null && currentCount >= maxLeads) {
      return NextResponse.json(
        {
          error:   "upgrade_required",
          feature: "leads_limit",
          message: `Limite de ${maxLeads} leads atteinte sur le plan Free. Passez en Pro pour des leads illimités.`,
        },
        { status: 403 }
      );
    }

    let collected: Record<string, unknown>[] = [];
    let start = 0;

    while (collected.length < nb) {
      let page: Record<string, unknown>[];
      try { page = await fetchPage(query, apiKey, start); }
      catch (e) { console.error("[SCRAPE]", (e as Error).message); break; }
      if (!page.length) break;
      collected = collected.concat(page);
      start    += PAGE_SIZE;
      if (page.length < PAGE_SIZE) break;
    }

    let added = 0;
    const today = new Date().toISOString().slice(0, 10);

    for (const r of collected) {
      // Arrêter si on atteint la limite de leads du plan
      if (maxLeads !== null && currentCount + added >= maxLeads) break;
      if (added >= nb) break;
      const c = normalizeLead({
        nom: String(r.title || ""), metier,
        telephone: String(r.phone || ""), site: String(r.website || ""),
        emplacement: String(r.address || ville), pays, created_at: today,
      });
      const key = `${c.nom.toLowerCase()}|${c.telephone.toLowerCase()}`;
      if (!c.nom || existingKeys.has(key)) continue;

      await prisma.lead.create({
        data: { user_id: userId, nom: c.nom, metier: c.metier, telephone: c.telephone,
          site: c.site, emplacement: c.emplacement, pays: c.pays, created_at: c.created_at },
      });
      existingKeys.add(key);
      added++;
    }

    const total = await prisma.lead.count({ where: { user_id: userId } });
    return NextResponse.json({ added, total, scrapeUsed: scrapeCheck.used, scrapeMax: scrapeCheck.max });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
