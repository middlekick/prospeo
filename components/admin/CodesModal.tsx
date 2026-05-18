"use client";

/**
 * components/admin/CodesModal.tsx
 * Gestion des codes d'invitation (trial Pro) — CRUD via /api/admin/codes.
 * Ouvert depuis la page admin.
 */

import { useState, useEffect, useCallback } from "react";
import { useToast }   from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmModal";

interface InviteCode {
  id:          string;
  code:        string;
  days:        number;
  max_uses:    number | null;
  used_count:  number;
  active:      boolean;
  expires_at:  string | null;
  note:        string | null;
  db_created_at: string;
}

export default function CodesModal({ onClose }: { onClose: () => void }) {
  const [codes,   setCodes]   = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy,    setBusy]    = useState(false);
  const { success, error: toastError, info } = useToast();
  const confirm = useConfirm();

  // Formulaire création
  const [code,    setCode]    = useState("");
  const [days,    setDays]    = useState(14);
  const [maxUses, setMaxUses] = useState("");
  const [expires, setExpires] = useState("");
  const [note,    setNote]    = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/codes")
      .then(r => r.ok ? r.json() : Promise.reject(new Error("Accès refusé")))
      .then((d: { codes: InviteCode[] }) => setCodes(d.codes))
      .catch(e => toastError((e as Error).message))
      .finally(() => setLoading(false));
  }, [toastError]);

  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!code.trim()) { toastError("Entrez un code"); return; }
    setBusy(true);
    try {
      const res  = await fetch("/api/admin/codes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code, days,
          max_uses:   maxUses ? parseInt(maxUses, 10) : null,
          expires_at: expires || null,
          note:       note || null,
        }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!data.success) throw new Error(data.error || "Erreur");
      success(`Code ${code.toUpperCase()} créé`);
      setCode(""); setMaxUses(""); setExpires(""); setNote(""); setDays(14);
      load();
    } catch (e) { toastError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function toggle(c: InviteCode) {
    try {
      const res  = await fetch("/api/admin/codes", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, active: !c.active }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!data.success) throw new Error(data.error || "Erreur");
      setCodes(prev => prev.map(x => x.id === c.id ? { ...x, active: !x.active } : x));
    } catch (e) { toastError((e as Error).message); }
  }

  async function remove(c: InviteCode) {
    const ok = await confirm({
      title: `Supprimer le code "${c.code}" ?`,
      message: `Utilisé ${c.used_count} fois. Cette action est définitive.`,
      confirmLabel: "Supprimer", danger: true,
    });
    if (!ok) return;
    try {
      const res  = await fetch("/api/admin/codes", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!data.success) throw new Error(data.error || "Erreur");
      setCodes(prev => prev.filter(x => x.id !== c.id));
      info("Code supprimé");
    } catch (e) { toastError((e as Error).message); }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-[#0d0f17] border border-white/10 shadow-2xl overflow-hidden"
             onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] shrink-0">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Codes d&apos;invitation</h2>
              <p className="text-[11px] text-slate-600 mt-0.5">Trial Pro offert · validés par /api/trial</p>
            </div>
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 flex items-center justify-center transition-colors">✕</button>
          </div>

          {/* Création */}
          <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.015] shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="CODE" maxLength={32}
                className="col-span-2 h-8 px-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500/40" />
              <input type="number" value={days} onChange={e => setDays(parseInt(e.target.value) || 1)}
                title="Jours offerts" placeholder="Jours"
                className="h-8 px-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-brand-500/40" />
              <input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)}
                title="Utilisations max (vide = illimité)" placeholder="Max"
                className="h-8 px-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500/40" />
              <input type="date" value={expires} onChange={e => setExpires(e.target.value)}
                title="Expiration du code (optionnel)"
                className="h-8 px-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-slate-400 focus:outline-none focus:border-brand-500/40" />
            </div>
            <div className="flex gap-2 mt-2">
              <input value={note} onChange={e => setNote(e.target.value)}
                placeholder="Note interne (campagne…)"
                className="flex-1 h-8 px-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-brand-500/40" />
              <button onClick={create} disabled={busy}
                className="h-8 px-4 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors disabled:opacity-40">
                {busy ? "…" : "Créer"}
              </button>
            </div>
          </div>

          {/* Liste */}
          <div className="flex-1 overflow-auto px-3 py-2">
            {loading ? (
              <p className="text-center text-slate-600 text-xs py-8">Chargement…</p>
            ) : codes.length === 0 ? (
              <p className="text-center text-slate-600 text-xs py-8">Aucun code. Créez-en un ci-dessus.</p>
            ) : codes.map(c => {
              const expired = c.expires_at && new Date(c.expires_at) < new Date();
              const full    = c.max_uses != null && c.used_count >= c.max_uses;
              return (
                <div key={c.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                  <code className={`text-xs mono font-bold w-32 shrink-0 ${c.active && !expired && !full ? "text-brand-300" : "text-slate-600 line-through"}`}>
                    {c.code}
                  </code>
                  <span className="text-[11px] text-slate-400 w-14 shrink-0">{c.days}j Pro</span>
                  <span className="text-[11px] mono text-slate-500 w-16 shrink-0">
                    {c.used_count}/{c.max_uses ?? "∞"}
                  </span>
                  <span className="text-[10px] text-slate-600 flex-1 truncate">
                    {expired ? "⚠ expiré" : full ? "⚠ épuisé" : c.note || (c.expires_at ? `→ ${new Date(c.expires_at).toLocaleDateString("fr-FR")}` : "")}
                  </span>
                  <button onClick={() => toggle(c)}
                    className={`h-6 px-2 rounded-md text-[10px] font-medium transition-all shrink-0 ${
                      c.active ? "bg-emerald-500/15 border border-emerald-500/25 text-emerald-400"
                               : "bg-white/[0.05] border border-white/[0.08] text-slate-500"}`}>
                    {c.active ? "Actif" : "Inactif"}
                  </button>
                  <button onClick={() => remove(c)}
                    className="h-6 px-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] hover:bg-red-500/20 transition-all shrink-0">
                    Suppr.
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
