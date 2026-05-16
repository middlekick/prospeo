/**
 * POST /api/admin/delete-user
 * Supprime un compte utilisateur : données DB (leads + subscription) + compte Clerk.
 * Body : { userId }
 */

import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma }             from "@/lib/prisma";
import { NextResponse }       from "next/server";

function isAdmin(userId: string): boolean {
  return (process.env.ADMIN_USER_IDS || "")
    .split(",").map(s => s.trim()).filter(Boolean)
    .includes(userId);
}

export async function POST(req: Request) {
  const { userId: adminId } = await auth();
  if (!adminId)           return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!isAdmin(adminId))  return NextResponse.json({ error: "Accès refusé" },   { status: 403 });

  const { userId } = await req.json() as { userId: string };
  if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 });

  // Sécurité : ne pas supprimer un autre admin
  const adminIds = (process.env.ADMIN_USER_IDS || "")
    .split(",").map(s => s.trim()).filter(Boolean);
  if (adminIds.includes(userId)) {
    return NextResponse.json({ error: "Impossible de supprimer un compte admin" }, { status: 400 });
  }

  // 1. Supprimer les leads
  const { count: leadsDeleted } = await prisma.lead.deleteMany({ where: { user_id: userId } });

  // 2. Supprimer la subscription
  await prisma.subscription.deleteMany({ where: { user_id: userId } });

  // 3. Supprimer le compte Clerk (en dernier — irréversible)
  const client = await clerkClient();
  await client.users.deleteUser(userId);

  console.log(`[ADMIN] Compte ${userId} supprimé — ${leadsDeleted} leads effacés`);

  return NextResponse.json({ success: true, leadsDeleted });
}
