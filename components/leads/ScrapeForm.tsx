"use client";

import { useState } from "react";
import Link         from "next/link";
import { usePlan }  from "@/hooks/usePlan";

interface Props {
  onDone: () => void;
}

export default function ScrapeForm({ onDone }: Props) {
  const [metier,  setMetier]  = useState("");
  const [ville,   setVille]   = useState("");
  const [pays,    setPays]    = useState("France");
  const [nb,      setNb]      = useState(20);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const { plan, scrapeUsed, scrapeMax, loading: planLoading, refresh } = usePlan();
  const isFree       = !planLoading && plan === "free";
  const scrapeLeft   = scrapeMax !== null ? Math.max(0, scrapeMax - scrapeUsed) : null;
  const quotaReached = isFree && scrapeLeft !== null && scrapeLeft <= 0;

  async function handleScrape(e: React.FormEvent) {
    e.preventDefault();
    if (!metier.trim() || !ville.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const res  = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metier, ville, pays, nb }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Message plus clair si quota dÃ©passÃ©
        if (data.error === "upgrade_required") {
          throw new Error(data.message || "Quota scraping atteint. Passez en Pro.");
        }
        throw new Error(data.error || "Erreur scraping");
      }
      setMsg({ text: `âœ“ ${data.added} lead(s) ajoutÃ©(s) â€” total ${data.total}`, ok: true });
      onDone();
      // RafraÃ®chir le quota plan (le badge "X scrapings restants" doit reflÃ©ter l'usage)
      refresh();
    } catch (e) {
      setMsg({ text: (e as Error).message, ok: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleScrape} className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-2">
      <div className="flex flex-col gap-1 flex-1 sm:flex-none">
        <label className="text-xs text-slate-500">MÃ©tier</label>
        <input
          value={metier}
          onChange={e => setMetier(e.target.value)}
          placeholder="plombier, Ã©lectricienâ€¦"
          className="h-9 sm:h-8 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 w-full sm:w-44"
        />
      </div>
      <div className="flex gap-2">
        <div className="flex flex-col gap-1 flex-1 sm:flex-none">
          <label className="text-xs text-slate-500">Ville</label>
          <input
            value={ville}
            onChange={e => setVille(e.target.value)}
            placeholder="Paris, Lyonâ€¦"
            className="h-9 sm:h-8 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 w-full sm:w-36"
          />
        </div>
        <div className="flex flex-col gap-1 w-24 sm:w-28">
          <label className="text-xs text-slate-500">Pays</label>
          <input
            value={pays}
            onChange={e => setPays(e.target.value)}
            className="h-9 sm:h-8 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-slate-200 focus:outline-none focus:border-brand-500/50 w-full"
          />
        </div>
        <div className="flex flex-col gap-1 w-20">
          <label className="text-xs text-slate-500">Nb</label>
          <input
            type="number"
            value={nb}
            min={1} max={200}
            onChange={e => setNb(Number(e.target.value))}
            className="h-9 sm:h-8 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-slate-200 focus:outline-none focus:border-brand-500/50 w-full mono"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading || quotaReached}
        className="h-9 sm:h-8 px-4 rounded-md bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-sm font-medium text-white transition-colors w-full sm:w-auto"
      >
        {loading ? "Scrapingâ€¦" : "Scraper"}
      </button>

      {/* Badge quota plan free */}
      {isFree && scrapeMax !== null && scrapeLeft !== null && (
        <span className={[
          "text-xs mono flex items-center gap-1",
          scrapeLeft === 0 ? "text-red-400" : scrapeLeft === 1 ? "text-amber-400" : "text-slate-500",
        ].join(" ")}>
          {scrapeLeft === 0
            ? <>Quota atteint &nbsp;Â·&nbsp; <Link href="/#pricing" className="underline hover:text-brand-400">Passer Pro</Link></>
            : `${scrapeLeft}/${scrapeMax} scraping${scrapeLeft > 1 ? "s" : ""} restant${scrapeLeft > 1 ? "s" : ""} ce mois`
          }
        </span>
      )}

      {msg && (
        <span className={["text-xs mono", msg.ok ? "text-green-400" : "text-red-400"].join(" ")}>
          {msg.text}
        </span>
      )}
    </form>
  );
}

