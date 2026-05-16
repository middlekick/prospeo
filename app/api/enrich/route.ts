import { NextRequest, NextResponse } from "next/server";
import { getJson } from "serpapi";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getUserPlan, PLAN_LIMITS } from "@/lib/plan";

async function findOnGoogleMaps(query: string, apiKey: string): Promise<{ phone: string; website: string } | null> {
  return new Promise((resolve) => {
    getJson(
      { engine: "google_maps", q: query, hl: "fr", api_key: apiKey, start: 0 },
      (json: Record<string, unknown>) => {
        const results = (json.local_results as Record<string, unknown>[]) || [];
        if (!results.length) { resolve(null); return; }
        const r = results[0] as Record<string, unknown>;
        resolve({ phone: String(r.phone || ""), website: String(r.website || "") });
      }
    );
  });
}

// POST /api/enrich — enrichit les leads sans téléphone via Google Maps
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // ── Guard plan : enrichissement réservé Pro+ (utilise des crédits SerpAPI) ─
  const plan = await getUserPlan(userId);
  if (!PLAN_LIMITS[plan].csv) {  // réutilise la gate "csv" (Pro+)
    return NextResponse.json(
      { error: "upgrade_required", feature: "enrich", plan },
      { status: 403 }
    );
  }

  const apiKey = process.env.SERPAPI_KEY || "";
  if (!apiKey)
    return NextResponse.json({ error: "SERPAPI_KEY manquante" }, { status: 500 });

  const { keys } = await req.json() as { keys: string[] };
  if (!Array.isArray(keys) || !keys.length)
    return NextResponse.json({ error: "Aucun lead fourni" }, { status: 400 });

  let enriched = 0;

  for (const k of keys) {
    const [nom, telephone] = k.split("|");
    const lead = await prisma.lead.findFirst({
      where: {
        user_id:   userId,
        nom:       { equals: nom || "",       mode: "insensitive" },
        telephone: { equals: telephone || "", mode: "insensitive" },
      },
    });
    if (!lead) continue;

    const ville = lead.emplacement.split(",").pop()?.trim() || lead.emplacement;
    const query = `${lead.nom} ${ville}`.trim();

    try {
      const found = await findOnGoogleMaps(query, apiKey);
      if (found) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            ...(found.phone   && !lead.telephone && { telephone: found.phone }),
            ...(found.website && !lead.site      && { site:      found.website }),
          },
        });
        enriched++;
      }
    } catch (e) {
      console.error(`[ENRICH] ${query}:`, (e as Error).message);
    }

    await new Promise(r => setTimeout(r, 200));
  }

  return NextResponse.json({ enriched, total: keys.length });
}
