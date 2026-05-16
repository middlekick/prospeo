/**
 * POST /api/webhook
 * Webhook Stripe — met à jour le plan utilisateur en base selon les événements.
 *
 * Événements gérés :
 * - checkout.session.completed   → active le plan
 * - customer.subscription.updated → met à jour statut/période
 * - customer.subscription.deleted → retour au plan free
 */

import { NextRequest, NextResponse } from "next/server";
import { stripe }                     from "@/lib/stripe";
import { prisma }                     from "@/lib/prisma";
import type Stripe                    from "stripe";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Webhook non configuré" }, { status: 400 });
  }

  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") || "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (e) {
    console.error("[WEBHOOK] Signature invalide :", (e as Error).message);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  try {
    switch (event.type) {

      // ── Checkout terminé → activer le plan ─────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId  = session.metadata?.userId;
        const plan    = session.metadata?.plan;

        if (!userId || !plan) {
          console.warn("[WEBHOOK] checkout.session.completed sans userId/plan dans metadata");
          break;
        }

        // Récupérer la subscription Stripe pour avoir les détails
        let periodEnd: Date | undefined;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          // current_period_end est un timestamp Unix (number) dans l'objet Stripe
          const ts = (sub as unknown as Record<string, unknown>).current_period_end;
          if (typeof ts === "number" && !isNaN(ts)) {
            periodEnd = new Date(ts * 1000);
          }
        }

        await prisma.subscription.upsert({
          where:  { user_id: userId },
          create: {
            user_id:            userId,
            plan,
            stripe_customer_id: session.customer as string ?? undefined,
            stripe_sub_id:      session.subscription as string ?? undefined,
            stripe_status:      "active",
            current_period_end: periodEnd,
          },
          update: {
            plan,
            stripe_customer_id: session.customer as string ?? undefined,
            stripe_sub_id:      session.subscription as string ?? undefined,
            stripe_status:      "active",
            current_period_end: periodEnd,
          },
        });

        console.log(`[WEBHOOK] Plan "${plan}" activé pour user ${userId}`);
        break;
      }

      // ── Abonnement mis à jour (renouvellement, changement de plan…) ────
      case "customer.subscription.updated": {
        const sub    = event.data.object as Stripe.Subscription;
        const status = sub.status;

        // Chercher le user via stripe_sub_id
        const existing = await prisma.subscription.findFirst({
          where: { stripe_sub_id: sub.id },
        });

        if (!existing) {
          console.warn("[WEBHOOK] subscription.updated — sub introuvable en DB :", sub.id);
          break;
        }

        const ts2 = (sub as unknown as Record<string, unknown>).current_period_end;
        await prisma.subscription.update({
          where: { id: existing.id },
          data:  {
            stripe_status:      status,
            current_period_end: typeof ts2 === "number" && !isNaN(ts2) ? new Date(ts2 * 1000) : undefined,
          },
        });

        console.log(`[WEBHOOK] Subscription ${sub.id} mise à jour → ${status}`);
        break;
      }

      // ── Abonnement annulé → retour au plan free ─────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        const existing = await prisma.subscription.findFirst({
          where: { stripe_sub_id: sub.id },
        });

        if (!existing) {
          console.warn("[WEBHOOK] subscription.deleted — sub introuvable en DB :", sub.id);
          break;
        }

        await prisma.subscription.update({
          where: { id: existing.id },
          data:  {
            plan:               "free",
            stripe_status:      "canceled",
            current_period_end: null,
          },
        });

        console.log(`[WEBHOOK] Subscription ${sub.id} annulée → plan free`);
        break;
      }

      default:
        // Événement non géré — ignorer silencieusement
        break;
    }
  } catch (e) {
    console.error("[WEBHOOK] Erreur traitement :", (e as Error).message);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
