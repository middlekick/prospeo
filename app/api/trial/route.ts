/**
 * POST /api/trial
 * Valide un code d'invitation et active un trial Pro sur le compte.
 * Body : { code: string }
 *
 * Priorité : codes en base (model InviteCode, gérés depuis l'admin) puis
 * fallback sur TRIAL_INVITE_CODES (.env) pour rétro-compatibilité.
 */

import { auth }   from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const rl = rateLimit("trial", req, 10, 10 * 60_000); // 10 essais / 10 min / IP
  if (rl) return rl;

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { code } = await req.json() as { code?: string };
  const norm = code?.trim().toUpperCase();
  if (!norm) {
    return NextResponse.json({ error: "Code manquant" }, { status: 400 });
  }

  // L'utilisateur a-t-il déjà activé un code ?
  const existing = await prisma.subscription.findUnique({ where: { user_id: userId } });
  if (existing?.trial_code_used) {
    return NextResponse.json({ error: "Vous avez déjà activé un code d'invitation" }, { status: 400 });
  }

  // 1) Code en base (géré depuis l'admin)
  const dbCode = await prisma.inviteCode.findUnique({ where: { code: norm } });
  let days: number | null = null;
  let usedDbCode = false;

  if (dbCode) {
    if (!dbCode.active) {
      return NextResponse.json({ error: "Code désactivé" }, { status: 400 });
    }
    if (dbCode.expires_at && dbCode.expires_at < new Date()) {
      return NextResponse.json({ error: "Code expiré" }, { status: 400 });
    }
    if (dbCode.max_uses !== null && dbCode.used_count >= dbCode.max_uses) {
      return NextResponse.json({ error: "Code épuisé (limite d'utilisations atteinte)" }, { status: 400 });
    }
    days = dbCode.days;
    usedDbCode = true;
  } else {
    // 2) Fallback env
    const envCodes = (process.env.TRIAL_INVITE_CODES || "")
      .split(",").map(c => c.trim().toUpperCase()).filter(Boolean);
    if (!envCodes.includes(norm)) {
      return NextResponse.json({ error: "Code invalide" }, { status: 400 });
    }
    days = parseInt(process.env.TRIAL_DURATION_DAYS || "7", 10);
  }

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + (days ?? 7));

  await prisma.subscription.upsert({
    where:  { user_id: userId },
    create: { user_id: userId, plan: "pro", trial_expires_at: expiry, trial_code_used: norm },
    update: { plan: "pro", trial_expires_at: expiry, trial_code_used: norm },
  });

  // Incrémenter le compteur du code en base
  if (usedDbCode) {
    await prisma.inviteCode.update({
      where: { code: norm },
      data:  { used_count: { increment: 1 } },
    });
  }

  console.log(`[TRIAL] User ${userId} a activé ${norm} (${days}j) — expire ${expiry.toISOString()}`);

  return NextResponse.json({
    success:   true,
    plan:      "pro",
    expiresAt: expiry.toISOString(),
    daysLeft:  days,
  });
}
