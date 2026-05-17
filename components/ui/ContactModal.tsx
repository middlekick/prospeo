"use client";

/**
 * components/ui/ContactModal.tsx
 * Modal de contact  formulaire → POST /api/contact → email à Téo.
 */

import { useState } from "react";

interface Props {
  onClose:  () => void;
  /** Sujet pré-rempli optionnel (ex: "Plan Agence", "Campagne Google Ads") */
  defaultSubject?: string;
}

export default function ContactModal({ onClose, defaultSubject = "" }: Props) {
  const [nom,     setNom]     = useState("");
  const [email,   setEmail]   = useState("");
  const [sujet,   setSujet]   = useState(defaultSubject);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim() || !email.trim() || !message.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ nom, email, sujet, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur envoi");
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md rounded-2xl bg-[#0f1117] border border-white/10 shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
            <div>
              <h2 className="text-base font-semibold text-slate-100">Nous contacter</h2>
              <p className="text-xs text-slate-500 mt-0.5">On vous répond sous 24h</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 flex items-center justify-center transition-colors"
            >✕</button>
          </div>

          {sent ? (
            /* ── Confirmation envoi ── */
            <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center text-2xl">✅</div>
              <div>
                <p className="text-slate-100 font-semibold">Message envoyé !</p>
                <p className="text-slate-500 text-sm mt-1">Téo vous répondra dans les plus brefs délais.</p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          ) : (
            /* ── Formulaire ── */
            <form onSubmit={submit} className="px-6 py-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-500">Nom *</label>
                  <input
                    value={nom}
                    onChange={e => setNom(e.target.value)}
                    placeholder="Jean Dupont"
                    required
                    className="h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-500">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="jean@exemple.fr"
                    required
                    className="h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500">Sujet</label>
                <input
                  value={sujet}
                  onChange={e => setSujet(e.target.value)}
                  placeholder="Plan Agence, question sur les fonctionnalités"
                  className="h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500">Message *</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Décrivez votre besoin"
                  rows={4}
                  required
                  className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors resize-none"
                />
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={sending || !nom.trim() || !email.trim() || !message.trim()}
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
              >
                {sending ? "Envoi" : "Envoyer le message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

