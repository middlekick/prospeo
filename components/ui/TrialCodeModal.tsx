"use client";

/**
 * TrialCodeModal  Modal de saisie du code d'invitation.
 * S'affiche automatiquement sur le plan free si l'utilisateur
 * n'a pas encore activé de trial.
 * Peut aussi être ouvert manuellement via le bouton dans la sidebar.
 */

import { useState } from "react";

interface Props {
  onSuccess: () => void;  // appelé après activation → recharge le plan
  onClose:   () => void;
}

export default function TrialCodeModal({ onSuccess, onClose }: Props) {
  const [code,    setCode]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res  = await fetch("/api/trial", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json() as { success?: boolean; error?: string; daysLeft?: number };

      if (!res.ok || !data.success) {
        setError(data.error || "Code invalide");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1800);
    } catch {
      setError("Erreur réseau  réessayez");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm bg-[#13151e] border border-white/[0.10] rounded-2xl shadow-2xl p-6">
        {/* Icône */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center text-2xl">
              🎟️
            </div>
            <div className="absolute inset-0 rounded-2xl bg-brand-500/10 blur-xl -z-10" />
          </div>
        </div>

        {success ? (
          /* État succès */
          <div className="text-center">
            <div className="text-2xl mb-2">✅</div>
            <h2 className="text-base font-bold text-slate-100 mb-1">Accès Pro activé !</h2>
            <p className="text-xs text-slate-500">Toutes les fonctionnalités sont maintenant disponibles.</p>
          </div>
        ) : (
          <>
            <h2 className="text-base font-bold text-slate-100 text-center mb-1">Code d&apos;invitation</h2>
            <p className="text-xs text-slate-500 text-center mb-5">
              Entrez votre code pour activer l&apos;accès Pro pendant la formation.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setError(""); }}
                placeholder="FORMATION2025"
                autoFocus
                className="w-full h-10 px-3 rounded-xl bg-white/[0.06] border border-white/[0.10] text-sm
                           text-slate-100 placeholder-slate-600 font-mono tracking-widest text-center
                           focus:outline-none focus:border-brand-500/50 transition-colors uppercase"
              />

              {error && (
                <p className="text-xs text-red-400 text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="w-full h-10 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold
                           transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                           shadow-[0_0_20px_rgba(0,229,255,0.25)]"
              >
                {loading ? "Vérification" : "Activer l'accès"}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full text-xs text-slate-600 hover:text-slate-400 transition-colors py-1"
              >
                Je n&apos;ai pas de code
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}


