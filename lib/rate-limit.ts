/**
 * lib/rate-limit.ts
 * Rate limiter en mémoire (fenêtre glissante), sans dépendance.
 *
 * Note : en serverless le store est par-instance et se réinitialise au
 * cold start — ça ne remplace pas un store distribué (Upstash/Redis) mais
 * ça bloque efficacement les bursts d'abus depuis une même IP sur une
 * instance chaude. Suffisant comme garde anti-spam/anti-abus de base.
 */

import { NextResponse } from "next/server";

type Hit = { count: number; reset: number };
const store = new Map<string, Hit>();

// Nettoyage paresseux des entrées expirées (évite la fuite mémoire)
function sweep(now: number) {
  if (store.size < 5000) return;
  for (const [k, v] of store) if (v.reset < now) store.delete(k);
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * Renvoie une NextResponse 429 si la limite est dépassée, sinon null.
 * @param key   identifiant logique (ex: "scrape")
 * @param req   la requête (pour extraire l'IP)
 * @param limit nb de requêtes autorisées dans la fenêtre
 * @param windowMs durée de la fenêtre en ms
 */
export function rateLimit(
  key: string,
  req: Request,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const now = Date.now();
  sweep(now);
  const id = `${key}:${clientIp(req)}`;
  const hit = store.get(id);

  if (!hit || hit.reset < now) {
    store.set(id, { count: 1, reset: now + windowMs });
    return null;
  }

  if (hit.count >= limit) {
    const retry = Math.ceil((hit.reset - now) / 1000);
    return NextResponse.json(
      { error: "Trop de requêtes — réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(retry) } },
    );
  }

  hit.count++;
  return null;
}
