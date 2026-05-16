/**
 * POST /api/admin/plan
 * Modifie le plan d'un utilisateur manuellement.
 * Body : { userId, plan, trialDays? }
 * Réservé aux admins.
 */

import { auth }    from "@clerk/nextjs/server";
import { prisma }  from "@/lib/prisma";
import { NextResponse } from "next/server";

function isAdmin(userId: string): boolean {
  const ids = (process.env.ADMIN_USER_IDS || "")
    .split(",").map(id => id.trim()).filter(Boolean);
  return ids.includes(userId);
}

export async function POST(req: Request) {
  const { userId: adminId } = await auth();
  if (!adminId)           return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!isAdmin(adminId))  return NextResponse.json({ error: "Accès refusé" },   { status: 403 });

  const { userId, plan, trialDays } = await req.json() as {
    userId:     string;
    plan:       string;
    trialDays?: number;
  };

  if (!userId || !plan) {
    return NextResponse.json({ error: "userId et plan requis" }, { status: 400 });
  }

  const validPlans = ["free", "pro", "agency"];
  if (!validPlans.includes(plan)) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
  }

  // Calcul de la date d'expiration du trial si demandé
  let trial_expires_at: Date | null = null;
  if (trialDays && trialDays > 0) {
    trial_expires_at = new Date();
    trial_expires_at.setDate(trial_expires_at.getDate() + trialDays);
  }

  await prisma.subscription.upsert({
    where:  { user_id: userId },
    create: {
      user_id:          userId,
      plan,
      stripe_status:    plan !== "free" ? "active" : null,
      trial_expires_at: trial_expires_at ?? undefined,
      trial_code_used:  trialDays ? "ADMIN" : undefined,
    },
    update: {
      plan,
      stripe_status:    plan !== "free" ? "active" : null,
      trial_expires_at: trial_expires_at,
      trial_code_used:  trialDays ? "ADMIN" : undefined,
    },
  });

  console.log(`[ADMIN] ${adminId} a mis le plan de ${userId} à "${plan}" ${trialDays ? `(trial ${trialDays}j)` : ""}`);

  return NextResponse.json({ success: true, plan, trial_expires_at });
}
