"use client";

/**
 * components/ui/UpgradeGate.tsx
 * Masque un contenu si le plan ne l'autorise pas.
 * Affiche un overlay "ðŸ"’ Fonctionnalité Pro" avec CTA vers /#pricing.
 */

import Link from "next/link";
import type { PlanTier, PlanLimits } from "@/lib/plan";

type GatedFeature = keyof Omit<PlanLimits, "maxLeads" | "maxScrapePerMonth">;

const FEATURE_LABELS: Record<GatedFeature, string> = {
  email:     "Envoi d'emails",
  inpi:      "Recherche INPI",
  csv:       "Import / Export CSV",
  dashboard: "Dashboard analytics",
  scripts:   "Scripts téléprompter",
  ads:       "Suivi Google Ads",
};

interface UpgradeGateProps {
  feature:  GatedFeature;
  plan:     PlanTier;
  loading?: boolean;
  children: React.ReactNode;
  /** Si true, affiche les children quand même (juste désactivés) â€" sinon masqués */
  blur?:    boolean;
}

export default function UpgradeGate({ feature, plan, loading = false, children, blur = true }: UpgradeGateProps) {
  // Plan pro ou agence → accès libre
  if (!loading && (plan === "pro" || plan === "agency")) {
    return <>{children}</>;
  }

  // Chargement → afficher les children normalement pour éviter le flash
  if (loading) {
    return <>{children}</>;
  }

  // Plan free → overlay d'upgrade
  const label = FEATURE_LABELS[feature] ?? "Fonctionnalité";

  return (
    <div className="relative">
      {/* Contenu flou en dessous */}
      {blur && (
        <div className="pointer-events-none select-none" style={{ filter: "blur(3px)", opacity: 0.4 }}>
          {children}
        </div>
      )}

      {/* Overlay */}
      <div
        className={`${blur ? "absolute inset-0" : ""} flex flex-col items-center justify-center gap-3 rounded-xl bg-[#0b0d12]/80 backdrop-blur-sm border border-white/10 p-6 text-center`}
        style={blur ? {} : { minHeight: 160 }}
      >
        <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>
        <div>
          <p className="text-slate-200 font-semibold text-sm">{label}</p>
          <p className="text-slate-500 text-xs mt-0.5">Disponible à partir du plan Pro</p>
        </div>
        <Link
          href="/#pricing"
          className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition-colors"
        >
          Passer Pro →
        </Link>
      </div>
    </div>
  );
}

