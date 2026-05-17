"use client";

/**
 * components/ui/OnboardingModal.tsx
 * Modal d'onboarding au 1er login  4 étapes illustrées.
 * Déclenché depuis app/page.tsx si "onboarding_done" absent du localStorage.
 */

import { useState } from "react";

const STEPS = [
  {
    emoji: "🗺️",
    title: "Scrapez vos premiers leads",
    desc:  "Entrez un métier et une ville dans le formulaire en haut de page. Prospeo va chercher automatiquement les entreprises sur Google Maps et remplir votre liste en quelques secondes.",
    tip:   "Essayez : « plombier » + « Lyon »",
  },
  {
    emoji: "📞",
    title: "Appelez avec le script",
    desc:  "Ouvrez la page Scripts pour avoir votre téléprompter en plein écran. Chaque étape du cold call est guidée  de l'accroche aux objections.",
    tip:   "Le script s'adapte à chaque réponse du prospect.",
  },
  {
    emoji: "🏷️",
    title: "Taguez et planifiez",
    desc:  "Après chaque appel, changez le statut du lead directement dans la table (clic sur le badge). Planifiez un rappel si le prospect n'était pas disponible.",
    tip:   "Les rappels en retard s'affichent en surbrillance.",
  },
  {
    emoji: "📧",
    title: "Envoyez une offre par email",
    desc:  "Ouvrez le drawer d'un lead intéressé → cliquez « Email » → choisissez le template « Offre semaine gratuite ». L'envoi et la date sont logués automatiquement dans le journal.",
    tip:   "Disponible sur le plan Pro.",
  },
];

interface Props {
  onClose: () => void;
}

export default function OnboardingModal({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  function finish() {
    try { localStorage.setItem("onboarding_done", "1"); } catch { /* ignore */ }
    onClose();
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={finish} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md rounded-2xl bg-[#0f1117] border border-white/10 shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Barre de progression */}
          <div className="flex gap-1 p-4 pb-0">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{
                  background: i <= step
                    ? "linear-gradient(90deg,#00E5FF,#00E5FF)"
                    : "rgba(255,255,255,0.08)",
                }}
              />
            ))}
          </div>

          {/* Contenu */}
          <div className="p-8 text-center">
            {/* Emoji illustratif */}
            <div className="w-20 h-20 mx-auto rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-4xl mb-6">
              {current.emoji}
            </div>

            {/* Compteur étape */}
            <p className="text-xs text-brand-400/70 font-medium mb-2 mono">
              Étape {step + 1} sur {STEPS.length}
            </p>

            {/* Titre */}
            <h2 className="text-lg font-bold text-slate-100 mb-3">
              {current.title}
            </h2>

            {/* Description */}
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              {current.desc}
            </p>

            {/* Tip */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-xs text-slate-500">
              💡 {current.tip}
            </div>
          </div>

          {/* Footer navigation */}
          <div className="flex items-center justify-between px-6 pb-6 gap-3">
            {/* Bouton précédent */}
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="px-4 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-300 disabled:opacity-0 transition-colors"
            >
              ← Précédent
            </button>

            {/* Dots */}
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={[
                    "w-1.5 h-1.5 rounded-full transition-all",
                    i === step ? "bg-brand-400 w-4" : "bg-white/20 hover:bg-white/40",
                  ].join(" ")}
                />
              ))}
            </div>

            {/* Bouton suivant / terminer */}
            {isLast ? (
              <button
                onClick={finish}
                className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
              >
                Commencer →
              </button>
            ) : (
              <button
                onClick={() => setStep(s => s + 1)}
                className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
              >
                Suivant →
              </button>
            )}
          </div>

          {/* Skip */}
          <div className="text-center pb-4">
            <button onClick={finish} className="text-xs text-slate-700 hover:text-slate-500 transition-colors">
              Passer l&apos;introduction
            </button>
          </div>
        </div>
      </div>
    </>
  );
}


