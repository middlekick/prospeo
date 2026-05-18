/**
 * /api/admin/codes — gestion des codes d'invitation (trial Pro).
 * Réservé aux admins (ADMIN_USER_IDS).
 *   GET    → liste tous les codes
 *   POST   → crée un code { code, days, max_uses?, expires_at?, note? }
 *   PATCH  → met à jour { id, active?, days?, max_uses?, expires_at?, note? }
 *   DELETE → supprime { id }
 */

import { auth }         from "@clerk/nextjs/server";
import { prisma }       from "@/lib/prisma";
import { NextResponse } from "next/server";

function isAdmin(userId: string): boolean {
  return (process.env.ADMIN_USER_IDS || "")
    .split(",").map(s => s.trim()).filter(Boolean)
    .includes(userId);
}

async function guard() {
  const { userId } = await auth();
  if (!userId)          return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  if (!isAdmin(userId)) return { error: NextResponse.json({ error: "Accès refusé" },   { status: 403 }) };
  return { userId };
}

export async function GET() {
  const g = await guard();
  if (g.error) return g.error;
  const codes = await prisma.inviteCode.findMany({ orderBy: { db_created_at: "desc" } });
  return NextResponse.json({ codes });
}

export async function POST(req: Request) {
  const g = await guard();
  if (g.error) return g.error;

  const body = await req.json() as {
    code?: string; days?: number; max_uses?: number | null;
    expires_at?: string | null; note?: string;
  };
  const code = body.code?.trim().toUpperCase();
  if (!code || !/^[A-Z0-9_-]{3,32}$/.test(code)) {
    return NextResponse.json({ error: "Code invalide (3-32 car. : A-Z, 0-9, - et _)" }, { status: 400 });
  }
  const days = Math.max(1, Math.min(365, Math.floor(body.days ?? 14)));
  const max_uses = body.max_uses == null ? null : Math.max(1, Math.floor(body.max_uses));
  const expires_at = body.expires_at ? new Date(body.expires_at) : null;

  const exists = await prisma.inviteCode.findUnique({ where: { code } });
  if (exists) return NextResponse.json({ error: "Ce code existe déjà" }, { status: 400 });

  const created = await prisma.inviteCode.create({
    data: { code, days, max_uses, expires_at, note: body.note?.trim() || null },
  });
  return NextResponse.json({ success: true, code: created });
}

export async function PATCH(req: Request) {
  const g = await guard();
  if (g.error) return g.error;

  const body = await req.json() as {
    id?: string; active?: boolean; days?: number;
    max_uses?: number | null; expires_at?: string | null; note?: string;
  };
  if (!body.id) return NextResponse.json({ error: "id manquant" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.active === "boolean") data.active = body.active;
  if (body.days != null)      data.days = Math.max(1, Math.min(365, Math.floor(body.days)));
  if (body.max_uses !== undefined) data.max_uses = body.max_uses == null ? null : Math.max(1, Math.floor(body.max_uses));
  if (body.expires_at !== undefined) data.expires_at = body.expires_at ? new Date(body.expires_at) : null;
  if (body.note !== undefined) data.note = body.note?.trim() || null;

  const updated = await prisma.inviteCode.update({ where: { id: body.id }, data });
  return NextResponse.json({ success: true, code: updated });
}

export async function DELETE(req: Request) {
  const g = await guard();
  if (g.error) return g.error;

  const { id } = await req.json() as { id?: string };
  if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });
  await prisma.inviteCode.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
