import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// POST /api/leads/delete — supprime un lead par nom+telephone
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { nom, telephone } = await req.json();
  if (!nom) return NextResponse.json({ error: "nom requis" }, { status: 400 });

  const lead = await prisma.lead.findFirst({
    where: {
      user_id:   userId,
      nom:       { equals: nom,             mode: "insensitive" },
      telephone: { equals: telephone || "", mode: "insensitive" },
    },
  });

  if (!lead)
    return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });

  await prisma.lead.delete({ where: { id: lead.id } });

  const total = await prisma.lead.count({ where: { user_id: userId } });
  return NextResponse.json({ deleted: 1, total });
}
