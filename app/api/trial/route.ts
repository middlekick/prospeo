/**
 * POST /api/trial
 * Valide un code d'invitation et active un trial Pro sur le compte.
 * Body : { code: string }
 */

import { auth }   from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { code } = await req.json() as { code?: string };
  if (!code?.trim()) {
    return NextResponse.json({ error: "Code manquant" }, { status: 400 });
  }

  // Vérification du code
  const validCodes = (process.env.TRIAL_INVITE_CODES || "")
    .split(",")
    .map(c => c.trim().toUpperCase())
    .filter(Boolean);

  if (!validCodes.includes(code.trim().toUpperCase())) {
    return NextResponse.json({ error: "Code invalide" }, { status: 400 });
  }

  // Vérifier si l'utilisateur a déjà utilisé un code
  const existing = await prisma.subscription.findUnique({ where: { user_id: userId } });
  if (existing?.trial_code_used) {
    return NextResponse.json({ error: "Vous avez déjà activé un code d'invitation" }, { status: 400 });
  }

  // Durée du trial
  const days   = parseInt(process.env.TRIAL_DURATION_DAYS || "7", 10);
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);

  // Upsert de l'abonnement avec trial actif
  await prisma.subscription.upsert({
    where:  { user_id: userId },
    create: {
      user_id:          userId,
      plan:             "pro",
      trial_expires_at: expiry,
      trial_code_used:  code.trim().toUpperCase(),
    },
    update: {
      plan:             "pro",
      trial_expires_at: expiry,
      trial_code_used:  code.trim().toUpperCase(),
    },
  });

  console.log(`[TRIAL] User ${userId} a activé le code ${code.trim().toUpperCase()} — expire le ${expiry.toISOString()}`);

  return NextResponse.json({
    success:   true,
    plan:      "pro",
    expiresAt: expiry.toISOString(),
    daysLeft:  days,
  });
}
