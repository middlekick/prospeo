"use client";

/**
 * hooks/usePlan.ts
 * Récupère le plan actif de l'utilisateur connecté depuis /api/plan.
 * Mise en cache 5 minutes dans sessionStorage.
 * Expose refresh() pour forcer un rechargement (ex: après activation d'un trial).
 */

import { useState, useEffect, useCallback } from "react";
import type { PlanTier, PlanLimits } from "@/lib/plan";

export interface TrialInfo {
  hasTrial:  boolean;
  daysLeft:  number;
  expiresAt: string | null;
}

export interface PlanData {
  plan:       PlanTier;
  limits:     PlanLimits;
  scrapeUsed: number;
  scrapeMax:  number | null;
  trial:      TrialInfo;
  loading:    boolean;
  refresh:    () => void;
}

const CACHE_KEY = "prospeo_plan_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedPlan {
  data:      Omit<PlanData, "loading" | "refresh">;
  timestamp: number;
}

const DEFAULT_FREE_LIMITS: PlanLimits = {
  maxLeads:          100,
  maxScrapePerMonth: 3,
  email:             false,
  inpi:              false,
  csv:               false,
  dashboard:         false,
  scripts:           false,
  ads:               false,
};

export function usePlan(): PlanData {
  const [data, setData] = useState<Omit<PlanData, "loading" | "refresh">>({
    plan:       "free",
    limits:     DEFAULT_FREE_LIMITS,
    scrapeUsed: 0,
    scrapeMax:  3,
    trial:      { hasTrial: false, daysLeft: 0, expiresAt: null },
  });
  const [loading, setLoading] = useState(true);
  const [tick,    setTick]    = useState(0);  // incrémenté par refresh()

  const fetchPlan = useCallback(async (forceRefresh = false) => {
    // Vérifier le cache sessionStorage (sauf si refresh forcé)
    if (!forceRefresh) {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data: cachedData, timestamp }: CachedPlan = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            setData(cachedData);
            setLoading(false);
            return;
          }
        }
      } catch { /* sessionStorage non disponible (SSR) */ }
    } else {
      // Invalider le cache
      try { sessionStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
    }

    try {
      const r    = await fetch("/api/plan");
      const json = r.ok ? await r.json() : null;
      if (!json) return;
      const result = {
        plan:       (json.plan       ?? "free")             as PlanTier,
        limits:     (json.limits     ?? DEFAULT_FREE_LIMITS) as PlanLimits,
        scrapeUsed: (json.scrapeUsed ?? 0)                   as number,
        scrapeMax:  (json.scrapeMax  ?? 3)                   as number | null,
        trial:      (json.trial ?? { hasTrial: false, daysLeft: 0, expiresAt: null }) as TrialInfo,
      };
      setData(result);
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: result, timestamp: Date.now() }));
      } catch { /* ignore */ }
    } catch { /* garder les valeurs par défaut */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchPlan(tick > 0);
  }, [tick, fetchPlan]);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  return { ...data, loading, refresh };
}

/** Invalide le cache plan (export utilitaire) */
export function invalidatePlanCache() {
  try { sessionStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
}
