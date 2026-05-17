/**
 * POST /api/checkout
 * Crée une session Stripe Checkout pour un abonnement Pro ou Agence.
 * Body : { plan: "pro" | "agency", email?: string, successUrl?: string, cancelUrl?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth }                       from "@clerk/nextjs/server";
import { stripe }                     from "@/lib/stripe";

// Price IDs Stripe par plan (à configurer sur dashboard.stripe.com)
const PRICE_IDS: Record<string, string | undefined> = {
  pro:    process.env.STRIPE_PRICE_ID_PRO,
  agency: process.env.STRIPE_PRICE_ID_AGENCY,
};

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });
  }

  const { userId } = await auth();
  const origin     = req.headers.get("origin") || "";

  const { plan, email, successUrl, cancelUrl } = await req.json() as {
    plan?:       string;
    email?:      string;
    successUrl?: string;
    cancelUrl?:  string;
  };

  // Résolution du Price ID
  const priceId = plan ? PRICE_IDS[plan] : undefined;

  if (!priceId) {
    return NextResponse.json(
      { error: "Plan invalide ou Price ID manquant. Vérifiez STRIPE_PRICE_ID_PRO / STRIPE_PRICE_ID_AGENCY dans .env" },
      { status: 400 },
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode:                 "subscription",
      payment_method_types: ["card"],
      customer_email:       email,
      line_items:           [{ price: priceId, quantity: 1 }],
      success_url:          successUrl || `${origin}/app?checkout=success&plan=${plan}`,
      cancel_url:           cancelUrl  || `${origin}/?checkout=cancel`,
      // Métadonnées pour le webhook → mise à jour du plan en base
      metadata: {
        userId: userId ?? "",
        plan:   plan   ?? "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[CHECKOUT]", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
