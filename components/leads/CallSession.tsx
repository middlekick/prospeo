"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Lead } from "./types";
import { toWhatsAppUrl } from "@/lib/phone";
import { useToast } from "@/components/ui/Toast";

// ── Types script (miroir de app/scripts/page.tsx) ─────────────────────────────

interface Block { t: string; label: string; text: string }
interface UserScript {
  id: string;
  type: "cold_call" | "closing";
  title: string;
  blocks?: Block[];
}

function loadColdCallScript(): UserScript | null {
  if (typeof window === "undefined") return null;
  try {
    const arr = JSON.parse(localStorage.getItem("prospeo_scripts") || "[]") as UserScript[];
    return arr.find(s => s.type === "cold_call" && s.blocks?.length) ?? null;
  } catch {
    return null;
  }
}

// ── Résultats possibles d'un appel ────────────────────────────────────────────

const OUTCOMES = [
  { tag: "ne_repond_pas", label: "Pas répondu",   key: "1", cls: "bg-orange-500/15 hover:bg-orange-500/25 border-orange-500/30 text-orange-300", picked: false },
  { tag: "interesse",     label: "Intéressé",      key: "2", cls: "bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/30 text-cyan-300",        picked: true  },
  { tag: "rdv_pris",      label: "RDV pris ✓",     key: "3", cls: "bg-green-500/15 hover:bg-green-500/25 border-green-500/30 text-green-300",     picked: true  },
  { tag: "pas_interesse", label: "Pas intéressé",  key: "4", cls: "bg-red-500/15 hover:bg-red-500/25 border-red-500/30 text-red-300",            picked: true  },
] as const;

interface SessionStats {
  calls:    number;  // appels traités
  answered: number;  // décrochés (intéressé + rdv + pas intéressé)
  rdv:      number;  // RDV pris
  interested: number;
}

interface Props {
  leads: Lead[];                       // leads à appeler (déjà filtrés non_appelé)
  onClose: () => void;
  onLeadUpdated: (lead: Lead, tag: string) => void;
}

function fmtDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}min ${sec.toString().padStart(2, "0")}s`;
}

// ── Bloc script (téléprompter compact) ────────────────────────────────────────

function ScriptBlocks({ blocks, lead }: { blocks: Block[]; lead: Lead }) {
  // Remplacement variables simples dans le script
  function fill(text: string): string {
    return text
      .replace(/\[PRENOM\]/gi, lead.ads_prenom || lead.nom?.split(" ")[0] || "")
      .replace(/\[METIER\]/gi, lead.metier || "votre métier")
      .replace(/\[ENTREPRISE\]/gi, lead.nom || "");
  }
  return (
    <div className="space-y-4">
      {blocks.filter(b => b.t !== "mindset").map((b, i) => (
        <div key={i}>
          <div className="text-[10px] font-bold tracking-widest text-violet-400/60 uppercase mb-1.5">
            {b.label}
          </div>
          <p className="text-[15px] leading-relaxed text-slate-300 whitespace-pre-line">
            {fill(b.text)}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function CallSession({ leads, onClose, onLeadUpdated }: Props) {
  const { success } = useToast();
  const [queue]      = useState<Lead[]>(() => [...leads]); // figé au lancement
  const [idx,  setIdx]  = useState(0);
  const [stats, setStats] = useState<SessionStats>({ calls: 0, answered: 0, rdv: 0, interested: 0 });
  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(Date.now());
  const script = useRef<UserScript | null>(null);

  if (script.current === null) script.current = loadColdCallScript();

  const current = queue[idx];

  // Timer de session
  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - startRef.current), 1000);
    return () => clearInterval(t);
  }, []);

  const advance = useCallback(() => {
    if (idx + 1 >= queue.length) setFinished(true);
    else setIdx(i => i + 1);
  }, [idx, queue.length]);

  const handleOutcome = useCallback(async (tag: string, picked: boolean) => {
    if (saving || !current) return;
    setSaving(true);
    try {
      await fetch("/api/leads/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...current, tag }),
      });
      onLeadUpdated(current, tag);
      setStats(s => ({
        calls:      s.calls + 1,
        answered:   s.answered + (picked ? 1 : 0),
        rdv:        s.rdv + (tag === "rdv_pris" ? 1 : 0),
        interested: s.interested + (tag === "interesse" ? 1 : 0),
      }));
      advance();
    } finally {
      setSaving(false);
    }
  }, [saving, current, onLeadUpdated, advance]);

  function skip() {
    advance();
  }

  // Raccourcis clavier 1-4 + S (skip) + Échap
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (finished) return;
      if (e.key === "Escape") { onClose(); return; }
      if (e.key.toLowerCase() === "s") { skip(); return; }
      const o = OUTCOMES.find(o => o.key === e.key);
      if (o) handleOutcome(o.tag, o.picked);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, handleOutcome, idx]);

  // ── Écran de fin ────────────────────────────────────────────────────────────
  if (finished || !current) {
    const rate = stats.calls > 0 ? Math.round((stats.answered / stats.calls) * 100) : 0;
    const avgMs = stats.calls > 0 ? elapsed / stats.calls : 0;
    return (
      <div className="fixed inset-0 z-[60] bg-[#0b0d12] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-3xl">
            🎯
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100 mb-1">Session terminée</h2>
            <p className="text-sm text-slate-500">
              {stats.calls} appel{stats.calls > 1 ? "s" : ""} en {fmtDuration(elapsed)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Appels traités",  value: stats.calls,       color: "text-slate-200" },
              { label: "Décrochés",       value: stats.answered,    color: "text-cyan-300"  },
              { label: "RDV pris",        value: stats.rdv,         color: "text-green-300" },
              { label: "Taux décrochage", value: `${rate}%`,        color: "text-violet-300" },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
                <div className={`text-3xl font-bold mono ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-600 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {stats.calls > 0 && (
            <p className="text-xs text-slate-600">
              Rythme : 1 appel toutes les {fmtDuration(avgMs)} ·{" "}
              {stats.interested} à rappeler
            </p>
          )}

          <button
            onClick={() => { success(`Session : ${stats.calls} appels, ${stats.rdv} RDV`); onClose(); }}
            className="w-full h-11 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
          >
            Terminer
          </button>
        </div>
      </div>
    );
  }

  // ── Écran d'appel actif ─────────────────────────────────────────────────────
  const progress = Math.round((idx / queue.length) * 100);

  return (
    <div className="fixed inset-0 z-[60] bg-[#0b0d12] flex flex-col">
      {/* Barre de progression + stats live */}
      <div className="shrink-0 border-b border-white/[0.06]">
        <div className="h-1 bg-white/[0.04]">
          <div className="h-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500">
              Lead <span className="text-slate-200 font-semibold">{idx + 1}</span> / {queue.length}
            </span>
            <span className="text-xs mono text-slate-600">⏱ {fmtDuration(elapsed)}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-500">📞 <span className="text-slate-200 font-semibold">{stats.calls}</span></span>
            <span className="text-cyan-400">✓ {stats.answered} décrochés</span>
            <span className="text-green-400">📅 {stats.rdv} RDV</span>
            <button
              onClick={onClose}
              className="ml-2 h-7 px-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-slate-200 text-xs transition-all"
            >
              Quitter (Échap)
            </button>
          </div>
        </div>
      </div>

      {/* Contenu : lead + script */}
      <div className="flex-1 overflow-hidden grid grid-cols-[400px_1fr]">

        {/* Colonne gauche — fiche lead + numéro */}
        <div className="border-r border-white/[0.06] p-8 flex flex-col overflow-y-auto bg-white/[0.01]">
          <div className="text-[10px] font-bold tracking-widest text-slate-700 uppercase mb-2">
            {current.metier || "Lead"} · {current.emplacement || "—"}
          </div>
          <h1 className="text-2xl font-bold text-slate-100 leading-tight mb-6">
            {current.nom || "—"}
          </h1>

          {/* Numéro géant cliquable */}
          {current.telephone ? (
            <div className="space-y-3">
              <a
                href={`tel:${current.telephone.replace(/\s/g, "")}`}
                className="block text-center py-5 rounded-2xl bg-violet-600 hover:bg-violet-500 transition-colors group"
              >
                <div className="text-[10px] text-violet-200/70 uppercase tracking-widest mb-1">Appeler maintenant</div>
                <div className="text-3xl font-bold text-white mono group-hover:scale-105 transition-transform">
                  {current.telephone}
                </div>
              </a>
              <a
                href={toWhatsAppUrl(current.telephone)}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center py-2.5 rounded-xl bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-400 text-sm font-medium transition-colors"
              >
                💬 WhatsApp
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="py-5 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-center text-slate-600 text-sm">
                Aucun numéro
              </div>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(`${current.nom} ${current.emplacement} téléphone`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-slate-400 text-sm transition-colors"
              >
                🔍 Chercher le numéro
              </a>
            </div>
          )}

          {current.site && (
            <a href={current.site} target="_blank" rel="noopener noreferrer"
              className="mt-3 text-xs text-cyan-500/70 hover:text-cyan-400 truncate transition-colors">
              🌐 {current.site}
            </a>
          )}

          {current.note && (
            <div className="mt-5 p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/15 text-xs text-amber-200/70 leading-relaxed">
              📝 {current.note}
            </div>
          )}

          <div className="flex-1" />

          <button
            onClick={skip}
            className="mt-6 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-500 hover:text-slate-300 text-xs transition-all"
          >
            Passer ce lead (S) →
          </button>
        </div>

        {/* Colonne droite — script */}
        <div className="p-8 overflow-y-auto">
          {script.current?.blocks?.length ? (
            <ScriptBlocks blocks={script.current.blocks} lead={current} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-700 gap-3">
              <span className="text-2xl">📞</span>
              <p className="text-sm text-center max-w-xs">
                Aucun script Cold Call enregistré.<br/>
                Crée-en un dans l&apos;onglet <span className="text-violet-400">Scripts</span> pour l&apos;afficher ici.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Barre d'actions — résultat de l'appel */}
      <div className="shrink-0 border-t border-white/[0.06] px-6 py-4 bg-white/[0.01]">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <span className="text-xs text-slate-600 mr-1 shrink-0">Résultat :</span>
          {OUTCOMES.map(o => (
            <button
              key={o.tag}
              onClick={() => handleOutcome(o.tag, o.picked)}
              disabled={saving}
              className={`flex-1 h-12 rounded-xl border text-sm font-semibold transition-all disabled:opacity-40 ${o.cls}`}
            >
              <span className="opacity-50 text-xs mr-1.5">{o.key}</span>
              {o.label}
            </button>
          ))}
        </div>
        <p className="text-center text-[10px] text-slate-700 mt-2">
          Raccourcis : 1-4 pour le résultat · S pour passer · Échap pour quitter
        </p>
      </div>
    </div>
  );
}
