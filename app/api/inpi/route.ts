import { NextRequest, NextResponse } from "next/server";
import { auth }                       from "@clerk/nextjs/server";
import { getUserPlan, PLAN_LIMITS }   from "@/lib/plan";

const BASE = "https://recherche-entreprises.api.gouv.fr/search";

// Nombre de pages API à parcourir au max pour remplir une page filtrée de 25 résultats
// Plus la date est récente, plus on filtre, plus on a besoin de rounds
const MAX_API_ROUNDS = 6;
const PAGE_SIZE      = 25;

interface RawEntreprise {
  etat_administratif?: string;
  date_creation?:      string | null;
  siege?: {
    etat_administratif?:                  string;
    date_fermeture?:                      string | null;
    activite_principale_registre_metier?: string | null;
  };
  [key: string]: unknown;
}

export async function GET(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // ── Guard plan : INPI réservé Pro+ ───────────────────────────────────────
  const plan = await getUserPlan(userId);
  if (!PLAN_LIMITS[plan].inpi) {
    return NextResponse.json(
      { error: "upgrade_required", feature: "inpi", plan },
      { status: 403 }
    );
  }

  const { searchParams } = req.nextUrl;
  const q           = searchParams.get("q")           || "";
  const departement = searchParams.get("departement") || "";
  const naf         = searchParams.get("naf")         || "";
  const annees      = Number(searchParams.get("annees") || "5");
  const rmOnly      = searchParams.get("rmOnly")      === "1";
  const page        = Number(searchParams.get("page") || "1");

  const dateMin = new Date();
  dateMin.setFullYear(dateMin.getFullYear() - annees);
  const dateMinStr = dateMin.toISOString().slice(0, 10);

  // ── Fetch en boucle jusqu'à avoir PAGE_SIZE résultats filtrés ────────────
  // Pour la page utilisateur N, on commence à l'API page (N-1)*MAX_API_ROUNDS+1
  // afin que la pagination reste stateless et cohérente entre requêtes.
  const apiStartPage = (page - 1) * MAX_API_ROUNDS + 1;
  const collected: RawEntreprise[] = [];
  let totalFromApi = 0;
  let exhausted    = false; // plus de pages côté API

  try {
    for (let round = 0; round < MAX_API_ROUNDS; round++) {
      if (collected.length >= PAGE_SIZE) break;

      const apiPage = apiStartPage + round;
      const params  = new URLSearchParams({
        q:        q || "*",
        per_page: "25",
        page:     String(apiPage),
      });
      if (departement) params.set("departement", departement);
      if (naf)         params.set("activite_principale", naf);

      const res = await fetch(`${BASE}?${params}`, {
        headers: { Accept: "application/json" },
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`API ${res.status}${txt ? ` — ${txt.slice(0, 200)}` : ""}`);
      }

      const data = await res.json() as {
        results?:       RawEntreprise[];
        total_results?: number;
      };

      // On récupère le total brut uniquement sur le 1er round
      if (round === 0) totalFromApi = data.total_results || 0;

      const rawResults = data.results || [];

      // Filtre côté serveur (etat_administratif + date_creation + rmOnly)
      const filtered = rawResults.filter(r => {
        if (r.etat_administratif !== "A")        return false;
        if (r.siege?.etat_administratif === "F") return false;
        if (r.siege?.date_fermeture)             return false;
        if (!r.date_creation)                    return false;
        if (r.date_creation < dateMinStr)        return false;
        if (rmOnly && !r.siege?.activite_principale_registre_metier) return false;
        return true;
      });

      collected.push(...filtered);

      // L'API n'a plus de pages si elle en a retourné moins de 25
      if (rawResults.length < PAGE_SIZE) {
        exhausted = true;
        break;
      }
    }

    const results = collected.slice(0, PAGE_SIZE);
    // Il y a une page suivante si on a rempli PAGE_SIZE ET que l'API n'est pas épuisée
    const hasMore = !exhausted && collected.length >= PAGE_SIZE;

    return NextResponse.json({
      results,
      total_results: totalFromApi, // compte brut pour l'affichage indicatif
      has_more:      hasMore,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
