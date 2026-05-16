import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { fromPrisma } from "@/lib/db";

// GET /api/leads — retourne tous les leads de l'utilisateur connecté
export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  try {
    const rows = await prisma.lead.findMany({
      where:   { user_id: userId },
      orderBy: { db_created_at: "desc" },
    });
    return NextResponse.json({ artisans: rows.map(fromPrisma) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
