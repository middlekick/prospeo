import { NextRequest, NextResponse } from "next/server";
import { auth }                       from "@clerk/nextjs/server";
import { prisma }                     from "@/lib/prisma";
import { mailer, buildEmailHTML, buildRdvConfirmationEmail, buildRdvReminderEmail } from "@/lib/email";
import { Activity }                   from "@/lib/db";
import { getUserPlan, PLAN_LIMITS }   from "@/lib/plan";

const MON_PRENOM = process.env.CONTACT_PRENOM || "Téo";
const MON_NOM    = process.env.CONTACT_NOM    || "Mikulic";

// POST /api/email — envoie un email selon un template et log l'activité
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // ── Guard plan : email réservé Pro+ ───────────────────────────────────────
  const plan = await getUserPlan(userId);
  if (!PLAN_LIMITS[plan].email) {
    return NextResponse.json(
      { error: "upgrade_required", feature: "email", plan },
      { status: 403 }
    );
  }

  if (!process.env.GMAIL_USER)
    return NextResponse.json({ error: "Gmail non configuré" }, { status: 500 });

  const body = await req.json();
  const { template, to, nomEntreprise, leadNom, leadTelephone } = body;
  if (!to) return NextResponse.json({ error: "to requis" }, { status: 400 });

  let subject = "", html = "";

  try {
    if (template === "rdv_confirmation") {
      const { rdvDate, rdvHeure } = body;
      if (!rdvDate) return NextResponse.json({ error: "rdvDate requis" }, { status: 400 });
      subject = `Confirmation de notre échange — ${nomEntreprise || ""}`.trim();
      html    = buildRdvConfirmationEmail({ nomSociete: nomEntreprise || "", rdvDate, rdvHeure: rdvHeure || "" });
    } else if (template === "rdv_rappel") {
      const { rdvHeure } = body;
      subject = `Rappel — notre échange demain${rdvHeure ? ` à ${rdvHeure}` : ""}`;
      html    = buildRdvReminderEmail({ nomSociete: nomEntreprise || "", rdvHeure: rdvHeure || "" });
    } else {
      const { prenom, urlSite, screenshotUrl } = body;
      if (!urlSite) return NextResponse.json({ error: "urlSite requis" }, { status: 400 });
      subject = `${nomEntreprise || "Votre activité"} — opportunité clients 🚀`;
      html    = buildEmailHTML({ prenom: prenom || "là", nomEntreprise: nomEntreprise || "", urlSite, screenshotUrl });
    }

    await mailer.sendMail({
      from: `"${MON_PRENOM} ${MON_NOM}" <${process.env.GMAIL_USER}>`,
      to, subject, html,
    });

    // Log dans le journal du lead
    if (leadNom) {
      const lead = await prisma.lead.findFirst({
        where: {
          user_id:   userId,
          nom:       { equals: leadNom,         mode: "insensitive" },
          telephone: { equals: leadTelephone || "", mode: "insensitive" },
        },
      });
      if (lead) {
        const labels: Record<string, string> = {
          offre:            "Offre semaine gratuite envoyée",
          rdv_confirmation: "Confirmation RDV envoyée",
          rdv_rappel:       "Rappel J-1 envoyé",
        };
        const activity: Activity = {
          id: Date.now().toString(), date: new Date().toISOString().slice(0, 16),
          type: "email", content: labels[template] || "Email envoyé", meta: to,
        };
        const activities: Activity[] = Array.isArray(lead.activities)
          ? (lead.activities as unknown as Activity[]) : [];
        activities.unshift(activity);
        await prisma.lead.update({ where: { id: lead.id }, data: { activities: activities as unknown as never } });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
