import { NextRequest, NextResponse } from "next/server";
import { auth }                       from "@clerk/nextjs/server";
import { prisma }                     from "@/lib/prisma";

// ─── GET — liste les configs de l'utilisateur connecté ───────────────────────
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const configs = await prisma.autoScrapeConfig.findMany({
    where:   { user_id: userId },
    orderBy: { created_at: "asc" },
  });

  return NextResponse.json({ configs });
}

// ─── POST — crée une nouvelle config ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { metier, ville, pays = "France", nb_per_run = 20 } = await req.json();

  if (!metier?.trim() || !ville?.trim()) {
    return NextResponse.json({ error: "metier et ville requis" }, { status: 400 });
  }

  const config = await prisma.autoScrapeConfig.create({
    data: {
      user_id:    userId,
      metier:     metier.trim(),
      ville:      ville.trim(),
      pays,
      nb_per_run: Math.min(100, Math.max(5, Number(nb_per_run))),
      enabled:    true,
    },
  });

  return NextResponse.json({ config });
}

// ─── PATCH — active/désactive ou modifie une config ──────────────────────────
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id, enabled, nb_per_run } = await req.json();
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  // Vérifier que la config appartient bien à l'user
  const existing = await prisma.autoScrapeConfig.findFirst({ where: { id, user_id: userId } });
  if (!existing) return NextResponse.json({ error: "Config introuvable" }, { status: 404 });

  const updated = await prisma.autoScrapeConfig.update({
    where: { id },
    data: {
      ...(enabled   !== undefined && { enabled }),
      ...(nb_per_run !== undefined && { nb_per_run: Math.min(100, Math.max(5, Number(nb_per_run))) }),
    },
  });

  return NextResponse.json({ config: updated });
}

// ─── DELETE — supprime une config ────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const existing = await prisma.autoScrapeConfig.findFirst({ where: { id, user_id: userId } });
  if (!existing) return NextResponse.json({ error: "Config introuvable" }, { status: 404 });

  await prisma.autoScrapeConfig.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
