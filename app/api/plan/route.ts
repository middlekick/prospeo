/**
 * GET /api/plan
 * Retourne le plan actif de l'utilisateur connecté + ses limites + usage scraping.
 */

import { NextResponse }                         from "next/server";
import { auth }                                  from "@clerk/nextjs/server";
import { getUserPlan, PLAN_LIMITS, getScrapeUsage, getTrialInfo } from "@/lib/plan";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const plan   = await getUserPlan(userId);
    const limits = PLAN_LIMITS[plan];
    const { used: scrapeUsed, max: scrapeMax } = await getScrapeUsage(userId);
    const trial = await getTrialInfo(userId);

    return NextResponse.json({ plan, limits, scrapeUsed, scrapeMax, trial });
  } catch (e) {
    console.error("[PLAN]", (e as Error).message);
    // Fallback plan free en cas d'erreur DB — l'app reste fonctionnelle
    return NextResponse.json({
      plan:       "free",
      limits:     PLAN_LIMITS["free"],
      scrapeUsed: 0,
      scrapeMax:  3,
    });
  }
}
