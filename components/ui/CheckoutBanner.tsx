"use client";

/**
 * components/ui/CheckoutBanner.tsx
 * Détecte ?checkout=success|cancel après retour de Stripe Checkout.
 * - success → toast de bienvenue + refresh du plan (usePlan) + URL nettoyée
 * - cancel  → toast info discret
 * Monté dans LayoutShell (branche /app). useSearchParams → Suspense requis.
 */

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast }                   from "@/components/ui/Toast";
import { usePlan }                    from "@/hooks/usePlan";

// Labels plan — copie client-safe (pas d'import depuis lib/plan qui tire Prisma)
const PLAN_LABELS: Record<string, string> = {
  free:   "Free",
  pro:    "Pro",
  agency: "Agence",
};

function CheckoutBannerInner() {
  const params   = useSearchParams();
  const router   = useRouter();
  const toast    = useToast();
  const { refresh } = usePlan();
  const handled  = useRef(false);

  useEffect(() => {
    const status = params.get("checkout");
    if (!status || handled.current) return;
    handled.current = true;

    if (status === "success") {
      const planParam = params.get("plan");
      const label = (planParam && PLAN_LABELS[planParam]) || "Pro";
      toast.success(`Bienvenue en ${label} 🎉 Toutes les fonctionnalités sont débloquées.`);
      // Forcer le rechargement du plan (invalide le cache sessionStorage)
      refresh();
    } else if (status === "cancel") {
      toast.info("Paiement annulé — aucun montant n'a été débité.");
    }

    // Nettoyer l'URL (retire ?checkout=… sans recharger la page)
    router.replace("/app", { scroll: false });
  }, [params, router, toast, refresh]);

  return null;
}

export default function CheckoutBanner() {
  return (
    <Suspense fallback={null}>
      <CheckoutBannerInner />
    </Suspense>
  );
}
