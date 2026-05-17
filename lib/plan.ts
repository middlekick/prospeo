/**
 * lib/plan.ts  Gestion des plans d'abonnement Prospeo
 *
 * Plans : free | pro | agency
 * Limites définies ici, utilisées côté API et côté UI.
 */

import { prisma } from "./prisma";

// ─── Types ──────────────────────────────────────────────────────────────────

export type PlanTier = "free" | "pro" | "agency";

export interface PlanLimits {
  maxLeads:           number | null;  // null = illimité
  maxScrapePerMonth:  number | null;  // null = illimité
  email:              boolean;
  inpi:               boolean;
  csv:                boolean;
  dashboard:          boolean;
  scripts:            boolean;
  ads:                boolean;
}

// ─── Constantes ──────────────────────────────────────────────────────────────

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    maxLeads:          100,
    maxScrapePerMonth: 3,
    email:             false,
    inpi:              false,
    csv:               false,
    dashboard:         false,
    scripts:           false,
    ads:               false,
  },
  pro: {
    maxLeads:          null,
    maxScrapePerMonth: null,
    email:             true,
    inpi:              true,
    csv:               true,
    dashboard:         true,
    scripts:           true,
    ads:               true,
  },
  agency: {
    maxLeads:          null,
    maxScrapePerMonth: null,
    email:             true,
    inpi:              true,
    csv:               true,
    dashboard:         true,
    scripts:           true,
    ads:               true,
  },
};

export const PLAN_LABELS: Record<PlanTier, string> = {
  free:   "Gratuit",
  pro:    "Pro",
  agency: "Agence",
};

// ─── Helpers serveur ─────────────────────────────────────────────────────────

/**
 * Retourne le plan actif d'un utilisateur.
 * Priorité : trial par code > Stripe actif > free.
 */
export async function getUserPlan(userId: string): Promise<PlanTier> {
  const sub = await prisma.subscription.findUnique({ where: { user_id: userId } });
  if (!sub) return "free";

  // Trial par code d'invitation encore valide ?
  if (sub.trial_expires_at && sub.trial_expires_at > new Date()) {
    return sub.plan as PlanTier;   // généralement "pro"
  }

  // Stripe actif ?
  const isActive = sub.stripe_status === "active" || sub.stripe_status === "trialing";
  if (!isActive) return "free";
  return sub.plan as PlanTier;
}

/**
 * Retourne les infos trial de l'utilisateur (pour l'UI).
 */
export async function getTrialInfo(userId: string): Promise<{
  hasTrial:  boolean;
  expiresAt: Date | null;
  daysLeft:  number;
}> {
  const sub = await prisma.subscription.findUnique({ where: { user_id: userId } });
  if (!sub?.trial_expires_at) return { hasTrial: false, expiresAt: null, daysLeft: 0 };
  const now  = new Date();
  const diff = sub.trial_expires_at.getTime() - now.getTime();
  if (diff <= 0) return { hasTrial: false, expiresAt: sub.trial_expires_at, daysLeft: 0 };
  return {
    hasTrial:  true,
    expiresAt: sub.trial_expires_at,
    daysLeft:  Math.ceil(diff / (1000 * 60 * 60 * 24)),
  };
}

/**
 * Retourne l'objet Subscription complet (ou null si inexistant).
 */
export async function getSubscription(userId: string) {
  return prisma.subscription.findUnique({ where: { user_id: userId } });
}

/**
 * Vérifie + incrémente le compteur de scraping mensuel.
 * Reset automatique si on est dans un nouveau mois.
 * Retourne { allowed, used, max }.
 */
export async function checkAndIncrementScrape(userId: string): Promise<{
  allowed: boolean;
  used:    number;
  max:     number | null;
}> {
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];

  // Plan illimité
  if (limits.maxScrapePerMonth === null) {
    return { allowed: true, used: 0, max: null };
  }

  // Récupérer ou créer l'abonnement (même pour le plan free)
  let sub = await prisma.subscription.findUnique({ where: { user_id: userId } });
  const now = new Date();

  if (!sub) {
    sub = await prisma.subscription.create({
      data: {
        user_id:        userId,
        plan:           "free",
        scrape_count:   0,
        scrape_reset_at: now,
      },
    });
  }

  // Reset mensuel si on a changé de mois
  const resetAt = sub.scrape_reset_at ?? now;
  const monthChanged =
    resetAt.getFullYear() !== now.getFullYear() ||
    resetAt.getMonth()    !== now.getMonth();

  if (monthChanged) {
    sub = await prisma.subscription.update({
      where: { user_id: userId },
      data:  { scrape_count: 0, scrape_reset_at: now },
    });
  }

  const used = sub.scrape_count;
  const max  = limits.maxScrapePerMonth;

  if (used >= max) {
    return { allowed: false, used, max };
  }

  // Incrémenter
  await prisma.subscription.update({
    where: { user_id: userId },
    data:  { scrape_count: { increment: 1 } },
  });

  return { allowed: true, used: used + 1, max };
}

/**
 * Retourne le nombre de scrapings restants ce mois-ci.
 */
export async function getScrapeUsage(userId: string): Promise<{ used: number; max: number | null }> {
  const plan = await getUserPlan(userId);
  const max  = PLAN_LIMITS[plan].maxScrapePerMonth;

  if (max === null) return { used: 0, max: null };

  const sub = await prisma.subscription.findUnique({ where: { user_id: userId } });
  if (!sub) return { used: 0, max };

  // Reset mensuel ?
  const now = new Date();
  const resetAt = sub.scrape_reset_at ?? now;
  const monthChanged =
    resetAt.getFullYear() !== now.getFullYear() ||
    resetAt.getMonth()    !== now.getMonth();

  return { used: monthChanged ? 0 : sub.scrape_count, max };
}
