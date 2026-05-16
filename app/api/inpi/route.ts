import { NextRequest, NextResponse } from "next/server";
import { auth }                       from "@clerk/nextjs/server";
import { getUserPlan, PLAN_LIMITS }   from "@/lib/plan";

const BASE = "https://recherche-entreprises.api.gouv.fr/search";

interface RawEntreprise {
  etat_administratif?: string;
  date_creation?:      string | null;
  siege?: {
    etat_administratif?: string;
    date_fermeture?:     string | null;
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
  const page        = Number(searchParams.get("page")   || "1");

  const dateMin = new Date();
  dateMin.setFullYear(dateMin.getFullYear() - annees);
  const dateMinStr = dateMin.toISOString().slice(0, 10);

  // Paramètres valides de l'API (pas de etat_administratif ni date_creation_min — filtrés côté serveur)
  const params = new URLSearchParams({
    q:        q || "*",
    per_page: "25",
    page:     String(page),
  });
  if (departement) params.set("departement", departement);
  if (naf)         params.set("activite_principale", naf);

  try {
    const res = await fetch(`${BASE}?${params}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`API ${res.status}${txt ? ` — ${txt.slice(0, 200)}` : ""}`);
    }

    const data = await res.json() as {
      results?:      RawEntreprise[];
      total_results?: number;
    };

    // Filtre strict côté serveur
    if (Array.isArray(data.results)) {
      data.results = data.results.filter(r => {
        if (r.etat_administratif !== "A")        return false;
        if (r.siege?.etat_administratif === "F") return false;
        if (r.siege?.date_fermeture)             return false;
        if (!r.date_creation)                    return false;
        if (r.date_creation < dateMinStr)        return false;
        return true;
      });
    }

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
