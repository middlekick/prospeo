/**
 * GET /api/admin/users
 * Retourne tous les comptes avec données DB + Clerk enrichies.
 * Réservé aux admins définis dans ADMIN_USER_IDS.
 */

import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma }             from "@/lib/prisma";
import { NextResponse }       from "next/server";

function isAdmin(userId: string): boolean {
  return (process.env.ADMIN_USER_IDS || "")
    .split(",").map(s => s.trim()).filter(Boolean)
    .includes(userId);
}

export async function GET() {
  const { userId } = await auth();
  if (!userId)          return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!isAdmin(userId)) return NextResponse.json({ error: "Accès refusé" },   { status: 403 });

  // Abonnements
  const subs = await prisma.subscription.findMany({ orderBy: { db_created_at: "desc" } });

  // Nb de leads + nb total d'activités par user
  const leadsData = await prisma.lead.findMany({
    select: { user_id: true, tag: true, activities: true, db_created_at: true },
  });

  // Agréger par user_id
  const statsMap: Record<string, {
    leadCount:      number;
    activityCount:  number;
    tags:           Record<string, number>;
    lastLeadAt:     string | null;
  }> = {};

  for (const lead of leadsData) {
    const uid = lead.user_id;
    if (!statsMap[uid]) {
      statsMap[uid] = { leadCount: 0, activityCount: 0, tags: {}, lastLeadAt: null };
    }
    statsMap[uid].leadCount++;
    const acts = (lead.activities as unknown as { id: string }[]) || [];
    statsMap[uid].activityCount += acts.length;
    statsMap[uid].tags[lead.tag] = (statsMap[uid].tags[lead.tag] || 0) + 1;
    const dateStr = lead.db_created_at.toISOString();
    if (!statsMap[uid].lastLeadAt || dateStr > statsMap[uid].lastLeadAt!) {
      statsMap[uid].lastLeadAt = dateStr;
    }
  }

  // Infos Clerk enrichies
  const client     = await clerkClient();
  const clerkUsers = subs.length > 0
    ? await client.users.getUserList({ userId: subs.map(s => s.user_id), limit: 200 })
    : { data: [] };

  const clerkMap = Object.fromEntries(
    clerkUsers.data.map(u => [u.id, {
      email:        u.emailAddresses[0]?.emailAddress || "",
      firstName:    u.firstName  || "",
      lastName:     u.lastName   || "",
      imageUrl:     u.imageUrl   || "",
      lastSignInAt: u.lastSignInAt  ? new Date(u.lastSignInAt).toISOString()  : null,
      clerkCreatedAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
      twoFactor:    u.twoFactorEnabled || false,
    }])
  );

  const users = subs.map(sub => ({
    ...sub,
    clerk:         clerkMap[sub.user_id] || null,
    leadCount:     statsMap[sub.user_id]?.leadCount     || 0,
    activityCount: statsMap[sub.user_id]?.activityCount || 0,
    tags:          statsMap[sub.user_id]?.tags          || {},
    lastLeadAt:    statsMap[sub.user_id]?.lastLeadAt    || null,
  }));

  // ── Stats globales ──────────────────────────────────────────────────────────
  const now = new Date();
  const isTrial = (s: typeof subs[number]) =>
    s.trial_expires_at != null && s.trial_expires_at > now;
  const isPaid = (s: typeof subs[number]) =>
    !isTrial(s) && (s.plan === "pro" || s.plan === "agency") &&
    (s.stripe_status === "active" || s.stripe_status === "trialing");

  const proPaid    = subs.filter(s => isPaid(s) && s.plan === "pro").length;
  const agencyPaid = subs.filter(s => isPaid(s) && s.plan === "agency").length;

  const stats = {
    total:        subs.length,
    free:         subs.filter(s => !isTrial(s) && !isPaid(s)).length,
    trial:        subs.filter(isTrial).length,
    pro:          proPaid,
    agency:       agencyPaid,
    mrr:          proPaid * 19 + agencyPaid * 49,
    totalLeads:   leadsData.length,
  };

  return NextResponse.json({ users, stats });
}
