import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Activity } from "@/lib/db";

// POST /api/leads/activity — ajoute une entrée manuelle dans le journal d'un lead
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { nom, telephone, type, content } = await req.json();
  if (!nom || !content)
    return NextResponse.json({ error: "nom et content requis" }, { status: 400 });

  const lead = await prisma.lead.findFirst({
    where: {
      user_id:   userId,
      nom:       { equals: nom,             mode: "insensitive" },
      telephone: { equals: telephone || "", mode: "insensitive" },
    },
  });

  if (!lead)
    return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });

  const activity: Activity = {
    id:      Date.now().toString(),
    date:    new Date().toISOString().slice(0, 16),
    type:    type || "note",
    content: String(content).trim(),
  };

  const activities: Activity[] = Array.isArray(lead.activities)
    ? (lead.activities as unknown as Activity[]) : [];
  activities.unshift(activity);

  await prisma.lead.update({ where: { id: lead.id }, data: { activities: activities as unknown as never } });
  return NextResponse.json({ ok: true, activity });
}
