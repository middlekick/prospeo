"use client";

import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types internes
// ─────────────────────────────────────────────────────────────────────────────

interface Objection { q: string; a: string; }

interface Choice {
  label:   string;
  subId:   string;
  content: string;
}

type BlockType = "say" | "note" | "tip" | "warn" | "instructions" | "choices";

interface Block {
  type:     BlockType;
  content?: string;
  choices?: Choice[];
}

interface GadsStep {
  emoji:      string;
  name:       string;
  time?:      string;
  mindset?:   string;
  blocks:     Block[];
  objections?: Objection[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Données — Phase 1 : Prospection (Setting)
// ─────────────────────────────────────────────────────────────────────────────

const PHASE1_STEPS: GadsStep[] = [
  {
    emoji:   "🎣",
    name:    "Hook d'ouverture",
    time:    "~30s",
    mindset: "Ton décontracté, souriant. Tu n'es pas un vendeur qui supplie — tu proposes quelque chose de rare.",
    blocks: [
      {
        type:    "say",
        content: "Allo, je suis bien avec [prénom / entreprise] ? Je vais pas vous faire perdre de temps — c'est un appel de prospection. Vous me laissez 30 secondes ou vous raccrochez maintenant ?",
      },
      {
        type:    "note",
        content: "La transparence désarme. Le prospect sait à quoi s'attendre — et il choisit d'écouter.",
      },
      {
        type: "choices",
        choices: [
          {
            label:   "✅ Allez-y",
            subId:   "p1-oui",
            content: "→ Passer directement à l'étape 2 «Question d'entrée».",
          },
          {
            label:   "🤔 C'est quoi ça ?",
            subId:   "p1-quoi",
            content: "«En gros, j'aide des artisans à recevoir des appels de nouveaux clients via Google — sans commission sur les chantiers, juste un budget pub géré directement. C'est pour ça que je voulais vous parler 30 secondes.»",
          },
          {
            label:   "⏱️ Pas le temps",
            subId:   "p1-temps",
            content: "«Pas de souci du tout. Vous préférez qu'on se rappelle plutôt matin ou après-midi cette semaine ?» → Poser le rappel.",
          },
        ],
      },
    ],
  },
  {
    emoji:   "🎯",
    name:    "Question d'entrée",
    time:    "~1min",
    mindset: "Curiosité sincère. Tu cherches à comprendre leur situation avant de proposer quoi que ce soit.",
    blocks: [
      {
        type:    "say",
        content: "En ce moment, comment vous trouvez vos nouveaux clients ? Bouche à oreille ? Via votre site web ? Un peu les deux ?",
      },
      {
        type:    "instructions",
        content: "→ Écouter attentivement. Ne pas couper.\n→ Reformuler leur réponse : «D'accord, donc principalement le bouche à oreille…»\n→ Enchaîner sur l'étape suivante.",
      },
    ],
  },
  {
    emoji:   "⚙️",
    name:    "Expliquer le mécanisme",
    time:    "~1min",
    mindset: "Pédagogue, pas commercial. Tu ne parles pas de pub — tu parles de visibilité et de position dominante face aux concurrents.",
    blocks: [
      {
        type:    "say",
        content: "Vous voyez quand quelqu'un tape «[métier] [ville]» sur Google ? Il y a plusieurs entreprises qui s'affichent — certaines en haut, d'autres beaucoup plus bas. Ce que je fais, c'est positionner votre entreprise tout en haut de cette liste, avant vos concurrents. Le client voit votre nom en premier, il appelle en premier.",
      },
      {
        type:    "note",
        content: "Ne jamais dire «sponsorisé» ou «publicité» — ça crée une friction inutile. Parler uniquement de visibilité, de position et de concurrence. Le prospect comprend l'idée sans se braquer.",
      },
      {
        type:    "tip",
        content: "Si le prospect dit «j'ai déjà un site» → «C'est bien d'avoir un site, mais si vos concurrents apparaissent avant vous quand un client cherche votre métier, c'est eux qui décrochent le téléphone. Là on renverse ça.»",
      },
    ],
  },
  {
    emoji:   "💡",
    name:    "Proposition de valeur",
    time:    "~1min",
    mindset: "Zero pression. Tu offres un test, pas un engagement.",
    blocks: [
      {
        type:    "say",
        content: "Ce que je propose, c'est une semaine test gratuite de ma part. Vous gérez uniquement le budget Google en direct — environ 10 à 15€ par jour. Pas de frais agence, pas d'engagement. Juste une semaine pour voir si ça marche pour vous.",
      },
      {
        type:    "note",
        content: "Insister sur «gratuite de ma part» et «pas d'engagement». Ce sont les deux déclencheurs qui ouvrent la conversation.",
      },
      {
        type:    "warn",
        content: "Ne pas parler de prix mensuel ici. On est encore dans le setting — le closing vient après la semaine test.",
      },
    ],
  },
  {
    emoji:   "📅",
    name:    "Projection + CTA RDV",
    time:    "~1min",
    mindset: "Assumer que oui. L'alternative fermée force une décision sans laisser la place au «je vais réfléchir».",
    blocks: [
      {
        type:    "say",
        content: "Si on lance demain, vous pouvez recevoir des premiers appels dès après-demain matin. Vous préférez qu'on se rappelle matin ou après-midi pour qu'on mette ça en place ensemble ?",
      },
      {
        type:    "note",
        content: "Alternative fermée : matin OU après-midi — pas «vous êtes partant ou pas». Le cerveau choisit entre les deux options proposées.",
      },
      {
        type:    "instructions",
        content: "→ Une fois le créneau posé, confirmer : «Parfait, je vous rappelle [jour] à [heure]. Bonne journée !»\n→ Raccrocher rapidement — ne pas sur-vendre.",
      },
    ],
  },
  {
    emoji:   "🛡️",
    name:    "Objections courantes",
    time:    "selon",
    mindset: "Calme et confiant. Chaque objection est une question déguisée — réponds à la question, pas à l'objection.",
    blocks: [
      {
        type:    "note",
        content: "Gérer l'objection, puis revenir immédiatement à la question de créneau : «Donc matin ou après-midi ?»",
      },
    ],
    objections: [
      {
        q: "C'est de la pub ? Je n'aime pas la pub.",
        a: "«Ce n'est pas de la pub au sens classique — vous ne payez que quand quelqu'un clique, donc quelqu'un qui cherche déjà votre métier dans votre zone. C'est de la visibilité ciblée, pas du spam.»",
      },
      {
        q: "Je suis déjà sur Google / j'ai déjà un site.",
        a: "«Être sur Google naturellement c'est bien, mais ça prend des mois. Google Ads, c'est être en haut des résultats dès demain — au-dessus des résultats naturels. Les deux se complètent.»",
      },
      {
        q: "Envoyez-moi un mail, je regarderai.",
        a: "«Le mail sans context ça n'explique pas bien. C'est pour ça que j'aime un appel rapide — en 5 minutes vous voyez exactement ce que ça peut donner pour vous. Matin ou après-midi cette semaine ?»",
      },
      {
        q: "J'ai pas le temps / je vais réfléchir.",
        a: "«Je comprends. Et justement, la semaine test ne vous prend aucun temps côté gestion — je m'occupe de tout. Le seul truc : choisir un créneau pour qu'on en parle. C'est quoi le meilleur moment ?»",
      },
      {
        q: "J'ai pas le budget.",
        a: "«Le budget Google c'est 70€ pour la semaine (10€/jour) — et mon service est offert pendant la semaine test. Si ça génère un seul chantier, c'est rentabilisé. C'est pour ça qu'on fait un test, pas un engagement.»",
      },
      {
        q: "J'ai assez de travail, le bouche à oreille suffit.",
        a: "«C'est une excellente position. La question c'est : est-ce que ça restera le cas dans 6 mois ? Beaucoup de mes clients me contactaient quand le bouche à oreille avait ralenti. Le test vous permet de voir sans rien changer à votre fonctionnement.»",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Données — Phase 2 : Closing semaine test
// ─────────────────────────────────────────────────────────────────────────────

const PHASE2_STEPS: GadsStep[] = [
  {
    emoji:   "🤝",
    name:    "Brise-glace",
    time:    "~30s",
    mindset: "On se connaît déjà — tutoiement naturel dès le départ. Décontracté, comme un ami qui rappelle.",
    blocks: [
      {
        type:    "say",
        content: "Salut [prénom] ! T'es où là, t'es sur un chantier ou au bureau ?",
      },
      {
        type:    "note",
        content: "Attendre la réponse. Rebondir dessus («Ah t'es sur un chantier, impec je fais vite !»). Ça crée une connexion humaine immédiate.",
      },
      {
        type:    "tip",
        content: "Le tutoiement dès le 1er mot enlève toute distance commerciale. Si le prospect répond en vouvoyant, adapter — mais conserver l'énergie décontractée.",
      },
    ],
  },
  {
    emoji:   "🎭",
    name:    "Positionnement",
    time:    "~1min",
    mindset: "Tu n'es pas un commercial lambda. Tu es un partenaire qui démontre avant de facturer.",
    blocks: [
      {
        type:    "say",
        content: "Donc je travaille pas pour une agence — je travaille en direct avec quelques artisans. Mon modèle c'est simple : je te démontre ma valeur d'abord, et tu me paies après. La semaine test, c'est offert de ma part.",
      },
      {
        type:    "note",
        content: "«Je démontre avant de facturer» est le pitch le plus puissant. Il inverse le risque — c'est toi qui prends le risque, pas le client.",
      },
    ],
  },
  {
    emoji:   "🔍",
    name:    "Diagnostic",
    time:    "~2-3min",
    mindset: "Médecin qui ausculte avant de prescrire. Chaque question a un but — écouter les réponses pour adapter le pitch.",
    blocks: [
      {
        type:    "say",
        content: "Avant de te proposer quoi que ce soit, j'ai 3 questions rapides pour pas te proposer quelque chose qui colle pas à ta situation.",
      },
      {
        type:    "instructions",
        content: "Question 1 : «T'as un site web en ce moment ? Si oui, il est comment — récent ou un peu vieillot ?\"\nQuestion 2 : «Quel type de chantier te rapporte le plus en ce moment ? Rénovation, salle de bain, toiture…?\"\nQuestion 3 : «Tu travailles sur quel rayon — 20km, 50km ?»",
      },
      {
        type:    "note",
        content: "Ces réponses servent à personnaliser l'exemple de résultats à l'étape 6. Note mentalement ou sur papier.",
      },
    ],
  },
  {
    emoji:   "⚡",
    name:    "Le mécanisme",
    time:    "~1-2min",
    mindset: "Visuel et concret. Pas de jargon. Une image vaut mille mots.",
    blocks: [
      {
        type:    "say",
        content: "Un site sans trafic, c'est une vitrine avec les volets fermés. Google Ads, c'est ouvrir les volets exactement au moment où quelqu'un passe dans ta rue en cherchant ce que tu fais.",
      },
      {
        type:    "say",
        content: "On choisit les mots-clés exacts que tes futurs clients tapent — «[métier] [ville]» — et ton annonce apparaît en haut. Tu paies seulement quand quelqu'un clique. Pas de vue, pas de frais.",
      },
      {
        type:    "tip",
        content: "Si le prospect a un site récent : «Parfait, ça veut dire qu'on peut diriger le trafic vers quelque chose de propre.»\nSi le site est vieux : «Pas grave, on peut mettre en place une landing page simple pour la semaine test.»",
      },
    ],
  },
  {
    emoji:   "💰",
    name:    "L'offre",
    time:    "~1min",
    mindset: "Clair, sans ambiguïté. Pas de flou sur les chiffres — la transparence crée la confiance.",
    blocks: [
      {
        type:    "say",
        content: "Concrètement voilà ce que je te propose : tu mets 100€ de budget Google sur la semaine — c'est 10 à 15€ par jour, géré directement sur ton compte Google. Mon service est offert. Tu reçois des appels, ou tu perds 100€ et tu sais que ça marche pas chez toi.",
      },
      {
        type:    "note",
        content: "«100€» est un chiffre psychologiquement accessible. C'est souvent moins que le coût d'un repas d'équipe ou d'un outil SaaS mensuel.",
      },
      {
        type:    "warn",
        content: "Ne pas encore parler du tarif mensuel (750€). Laisser la semaine test prouver la valeur d'abord. Le prix mensuel vient naturellement dans la conversation si la semaine test marche.",
      },
    ],
  },
  {
    emoji:   "🏆",
    name:    "Preuve + Recadrage",
    time:    "~1min",
    mindset: "La preuve sociale enlève le doute. Le recadrage «pire scénario» efface le risque perçu.",
    blocks: [
      {
        type:    "say",
        content: "Pour te donner un exemple concret : un paysagiste en région parisienne a généré 15 000€ de chantiers sur sa semaine test — avec 70€ de budget Google. On a continué, et en 3 mois il était à 150 000€ de CA pour 3 000€ de budget total.",
      },
      {
        type:    "say",
        content: "Pire scénario pour toi : tu dépenses 100€ et tu sais définitivement si Google Ads marche dans ta zone. C'est le coût d'une information qui vaut des mois de questionnement.",
      },
      {
        type:    "note",
        content: "Adapter les chiffres au métier du prospect si possible («un électricien à Lyon», «un peintre en Bretagne»…). La proximité géographique et métier rend la preuve plus crédible.",
      },
    ],
  },
  {
    emoji:   "🔒",
    name:    "Le Close",
    time:    "~30s",
    mindset: "Question directe, puis SILENCE total. Le premier qui parle après le silence perd. Tiens le silence.",
    blocks: [
      {
        type:    "say",
        content: "C'est bon pour toi tout ça ?",
      },
      {
        type:    "warn",
        content: "⚠️ SILENCE. Ne pas parler en premier. Compter jusqu'à 10 dans sa tête si besoin. Le silence crée une pression naturelle qui incite le prospect à répondre franchement.",
      },
      {
        type: "choices",
        choices: [
          {
            label:   "✅ Oui, on y va",
            subId:   "p2-oui",
            content: "→ «Super ! Je t'envoie le formulaire maintenant pour qu'on démarre rapidement — t'as 5 minutes devant toi ?» → Passer au formulaire en direct ou envoyer le lien.",
          },
          {
            label:   "🤔 Je sais pas trop",
            subId:   "p2-hes",
            content: "«C'est quoi le truc qui te bloque ? Le budget ? La confiance dans le concept ? Dis-moi franchement.» → Écouter, puis traiter l'objection spécifique.",
          },
          {
            label:   "❌ Non",
            subId:   "p2-non",
            content: "«Je comprends totalement. C'est quoi le principal frein — le timing, le budget, ou autre chose ?» → Comprendre pour affiner. Proposer un rappel dans 2-3 semaines si c'est du timing.",
          },
        ],
      },
    ],
  },
  {
    emoji:   "🛡️",
    name:    "Objections closing",
    time:    "selon",
    mindset: "Chaque objection révèle la vraie peur. Creuse, comprends, puis rassure avec du concret.",
    blocks: [
      {
        type:    "note",
        content: "Après chaque réponse, revenir au close : «Donc c'est bon pour toi ?» ou «On peut y aller ?»",
      },
    ],
    objections: [
      {
        q: "750€/mois c'est cher pour moi.",
        a: "«Je comprends. C'est pour ça qu'on commence par la semaine test à 100€. Si la semaine te ramène 2-3 chantiers, les 750€ mensuels sont rentabilisés au 1er chantier. Et si ça marche pas — tu ne paies pas les 750€.»",
      },
      {
        q: "Je veux bien mais les 100€ Google je les ai pas.",
        a: "«100€ c'est souvent moins que le budget qu'on met dans une dépense sans retour mesurable. Et là tu peux voir exactement combien ça génère à l'euro près. Mais si c'est vraiment un frein, on peut décaler la semaine test à [date] — t'as le temps de prévoir ça ?»",
      },
      {
        q: "J'ai déjà assez de travail en ce moment.",
        a: "«C'est une très bonne position. La question c'est : dans 3 mois, dans 6 mois, est-ce que le carnet de commandes sera aussi plein ? La plupart de mes clients me contactent quand ça ralentit — mais à ce moment là, Google Ads met 2-3 semaines pour démarrer. Là tu peux anticiper.»",
      },
      {
        q: "J'ai déjà essayé Google Ads, ça a pas marché.",
        a: "«Ça m'étonne pas — 80% des campagnes DIY ou agence sont mal configurées. Les mots-clés sont trop larges, le ciblage géo est mauvais, les annonces parlent de l'artisan pas du client. C'est exactement pour ça qu'on fait un test — pour voir ce qu'une campagne bien faite donne.»",
      },
      {
        q: "J'y connais rien à Google, j'aurais peur de me planter.",
        a: "«Bonne nouvelle : t'as rien à faire côté Google. Je configure tout sur ton compte, tu vois tout en transparence, mais tu touches à rien. T'as juste à répondre au téléphone quand ça sonne.»",
      },
      {
        q: "Je dois réfléchir / en parler à ma femme.",
        a: "«Je comprends. C'est quoi le point sur lequel vous avez besoin de réfléchir — le budget, la confiance, autre chose ? Parce que si c'est une question précise, je peux y répondre maintenant et ça vous évite d'y penser ce soir.»",
      },
      {
        q: "Je vais vous faire confiance mais j'attends une période plus calme.",
        a: "«Je comprends l'envie d'attendre. Mais la période calme c'est exactement le bon moment pour tester — vous avez du temps pour regarder les résultats, ajuster, apprendre. Quand c'est chargé, on n'a plus la tête à ça. Je vous propose de bloquer une date pour dans 2 semaines — ça vous convient ?»",
      },
      {
        q: "Comment je sais que vous allez pas disparaître ?",
        a: "«Question légitime. Je travaille avec des artisans en local, pas en masse — j'ai tout à perdre si je gère mal. Et la semaine test c'est justement conçu pour que vous puissiez juger le travail avant de vous engager. Pas besoin de me faire confiance à l'aveugle.»",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

function BlockRenderer({ block, openSub, onToggleSub }: {
  block:       Block;
  openSub:     string | null;
  onToggleSub: (id: string) => void;
}) {
  // Couleurs et labels par type
  const config: Record<BlockType, { border: string; bg: string; label: string; textColor: string }> = {
    say:          { border: "border-l-emerald-500",  bg: "bg-emerald-500/[0.04]",  label: "TU DIS",         textColor: "text-emerald-400" },
    note:         { border: "border-l-amber-500",    bg: "bg-amber-500/[0.04]",    label: "NOTE",           textColor: "text-amber-400"   },
    tip:          { border: "border-l-sky-500",      bg: "bg-sky-500/[0.04]",      label: "ASTUCE",         textColor: "text-sky-400"     },
    warn:         { border: "border-l-red-500",      bg: "bg-red-500/[0.04]",      label: "ATTENTION",      textColor: "text-red-400"     },
    instructions: { border: "border-l-orange-500",  bg: "bg-orange-500/[0.04]",   label: "INSTRUCTIONS",   textColor: "text-orange-400"  },
    choices:      { border: "border-l-violet-500",  bg: "bg-violet-500/[0.04]",   label: "SELON LA RÉPONSE", textColor: "text-violet-400" },
  };

  const c = config[block.type];

  if (block.type === "choices") {
    return (
      <div className={`rounded-xl border-l-[3px] ${c.border} ${c.bg} px-4 py-3`}>
        <div className={`text-[10px] font-bold tracking-widest mb-3 ${c.textColor}`}>{c.label}</div>
        <div className="space-y-2">
          {(block.choices || []).map((choice) => (
            <div key={choice.subId}>
              <button
                onClick={() => onToggleSub(choice.subId)}
                className={[
                  "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  openSub === choice.subId
                    ? "bg-violet-500/20 text-violet-200 border border-violet-500/30"
                    : "bg-white/[0.04] text-slate-300 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white",
                ].join(" ")}
              >
                <span>{choice.label}</span>
                <span className={`text-[10px] transition-transform duration-150 ${openSub === choice.subId ? "rotate-90" : ""}`}>▶</span>
              </button>
              {openSub === choice.subId && (
                <div className="mt-1.5 ml-3 pl-3 border-l border-violet-500/30 py-1.5">
                  {choice.content.split("\n").map((line, i) => (
                    <p key={i} className="text-sm text-slate-300 leading-relaxed">{line}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border-l-[3px] ${c.border} ${c.bg} px-4 py-3`}>
      <div className={`text-[10px] font-bold tracking-widest mb-2 ${c.textColor}`}>{c.label}</div>
      {block.content && (
        <div className="space-y-1">
          {block.content.split("\n").map((line, i) => {
            const isArrow = line.startsWith("→");
            if (block.type === "say") {
              return (
                <p key={i} className="text-[1.25rem] leading-[1.7] text-white font-light tracking-wide">
                  {i === 0 ? <>&ldquo;{line}&rdquo;</> : <>&ldquo;{line}&rdquo;</>}
                </p>
              );
            }
            return (
              <div key={i} className={`flex items-start gap-2 text-sm leading-relaxed ${
                isArrow ? "text-slate-400" : "text-slate-300"
              }`}>
                {isArrow && <span className="text-orange-500/60 shrink-0 mt-0.5">→</span>}
                <span>{isArrow ? line.slice(1).trim() : line}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ObjectionAccordion({ objections }: { objections: Objection[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {objections.map((obj, i) => (
        <div key={i} className="rounded-xl border border-white/[0.07] overflow-hidden">
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className={[
              "w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-all",
              openIdx === i ? "bg-red-500/10" : "bg-white/[0.02] hover:bg-white/[0.05]",
            ].join(" ")}
          >
            <span className={`text-sm font-medium transition-colors ${
              openIdx === i ? "text-red-300" : "text-slate-400 hover:text-slate-200"
            }`}>
              — {obj.q}
            </span>
            <span className={`text-slate-600 text-[10px] shrink-0 transition-transform duration-150 ${
              openIdx === i ? "rotate-90 text-red-400" : ""
            }`}>▶</span>
          </button>
          {openIdx === i && (
            <div className="px-4 py-3 border-t border-white/[0.06] bg-red-500/[0.03]">
              <p className="text-sm text-slate-300 leading-relaxed">{obj.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

export default function GoogleAdsScriptViewer({ onBack }: { onBack: () => void }) {
  const [phase,   setPhase]   = useState<1 | 2>(1);
  const [step,    setStep]    = useState(0);
  const [openSub, setOpenSub] = useState<string | null>(null);

  const steps    = phase === 1 ? PHASE1_STEPS : PHASE2_STEPS;
  const current  = steps[step];

  function goToStep(idx: number) {
    setStep(idx);
    setOpenSub(null);
  }

  function toggleSub(id: string) {
    setOpenSub(prev => prev === id ? null : id);
  }

  function switchPhase(p: 1 | 2) {
    setPhase(p);
    setStep(0);
    setOpenSub(null);
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent shrink-0" />

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] shrink-0 bg-[#0c0e15]/60 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200 transition-colors"
        >
          ← Scripts
        </button>
        <div className="w-px h-4 bg-white/10" />

        {/* Titre + badge */}
        <span className="text-sm font-semibold text-slate-100">Script Google Ads</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-orange-500/15 text-orange-400">
          Formation 10kchallenge
        </span>

        {/* Sélecteur de phase */}
        <div className="ml-auto flex gap-1 bg-white/[0.05] border border-white/[0.08] rounded-xl p-1">
          <button
            onClick={() => switchPhase(1)}
            className={[
              "px-3 py-1 rounded-lg text-xs font-medium transition-all",
              phase === 1
                ? "bg-cyan-500/20 text-cyan-200"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]",
            ].join(" ")}
          >
            📞 Phase 1 — Setting
          </button>
          <button
            onClick={() => switchPhase(2)}
            className={[
              "px-3 py-1 rounded-lg text-xs font-medium transition-all",
              phase === 2
                ? "bg-orange-500/20 text-orange-200"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]",
            ].join(" ")}
          >
            🏆 Phase 2 — Closing
          </button>
        </div>
      </header>

      {/* ── Corps — sidebar + contenu ─────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Sidebar étapes */}
        <nav className="w-52 shrink-0 border-r border-white/[0.06] py-3 overflow-y-auto bg-white/[0.01]">
          <div className={`text-[10px] font-bold tracking-widest px-4 mb-2 ${
            phase === 1 ? "text-cyan-600/70" : "text-orange-600/70"
          }`}>
            {phase === 1 ? "PROSPECTION" : "CLOSING"} — {steps.length} étapes
          </div>
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => goToStep(i)}
              className={[
                "w-full relative flex items-center gap-2.5 px-3 py-2.5 text-left transition-all",
                step === i
                  ? phase === 1
                    ? "bg-cyan-500/15 text-cyan-200"
                    : "bg-orange-500/15 text-orange-200"
                  : "text-slate-600 hover:text-slate-300 hover:bg-white/[0.05]",
              ].join(" ")}
            >
              {step === i && (
                <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-r-full bg-gradient-to-b ${
                  phase === 1 ? "from-cyan-400 to-cyan-600" : "from-orange-400 to-orange-600"
                }`} />
              )}
              <span className="text-sm shrink-0">{s.emoji}</span>
              <span className="text-xs leading-tight">{s.name}</span>
            </button>
          ))}
        </nav>

        {/* Contenu étape */}
        <div className="flex-1 overflow-auto px-8 py-8">
          {current && (
            <>
              {/* En-tête étape */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{current.emoji}</span>
                  <div>
                    <h3 className="text-base font-semibold text-slate-200">{current.name}</h3>
                    {current.time && (
                      <div className="text-xs text-slate-600 mono mt-0.5">{current.time}</div>
                    )}
                  </div>
                </div>

                {/* Navigation prev/next */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => goToStep(Math.max(0, step - 1))}
                    disabled={step === 0}
                    className="h-7 w-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-slate-400 text-sm disabled:opacity-20 transition-all"
                  >←</button>
                  <span className="text-xs text-slate-600 mono px-1">{step + 1}/{steps.length}</span>
                  <button
                    onClick={() => goToStep(Math.min(steps.length - 1, step + 1))}
                    disabled={step === steps.length - 1}
                    className="h-7 w-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-slate-400 text-sm disabled:opacity-20 transition-all"
                  >→</button>
                </div>
              </div>

              {/* Mindset */}
              {current.mindset && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-violet-900/20 border border-violet-500/20">
                  <div className="text-[10px] font-bold tracking-widest text-violet-500/70 mb-1.5">MINDSET</div>
                  <p className="text-sm text-violet-300/80 italic leading-relaxed">{current.mindset}</p>
                </div>
              )}

              {/* Blocs */}
              <div className="space-y-4 max-w-2xl">
                {current.blocks.map((block, i) => (
                  <BlockRenderer
                    key={i}
                    block={block}
                    openSub={openSub}
                    onToggleSub={toggleSub}
                  />
                ))}

                {/* Objections */}
                {current.objections && current.objections.length > 0 && (
                  <div className="mt-6">
                    <div className="text-[10px] font-bold tracking-widest text-red-500/60 mb-3">
                      OBJECTIONS ({current.objections.length})
                    </div>
                    <ObjectionAccordion objections={current.objections} />
                  </div>
                )}
              </div>

              {/* Navigation bas de page */}
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/[0.06] max-w-2xl">
                <button
                  onClick={() => goToStep(Math.max(0, step - 1))}
                  disabled={step === 0}
                  className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-200 disabled:opacity-20 transition-colors"
                >
                  ← Précédent
                </button>

                {/* Dots */}
                <div className="flex gap-1.5">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goToStep(i)}
                      className={[
                        "rounded-full transition-all",
                        i === step
                          ? `w-5 h-1.5 ${phase === 1 ? "bg-cyan-400" : "bg-orange-400"}`
                          : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40",
                      ].join(" ")}
                    />
                  ))}
                </div>

                <button
                  onClick={() => {
                    if (step < steps.length - 1) {
                      goToStep(step + 1);
                    } else if (phase === 1) {
                      switchPhase(2);
                    }
                  }}
                  disabled={step === steps.length - 1 && phase === 2}
                  className={[
                    "flex items-center gap-2 text-xs font-medium disabled:opacity-20 transition-colors",
                    step === steps.length - 1 && phase === 1
                      ? "text-orange-400 hover:text-orange-200"
                      : "text-slate-500 hover:text-slate-200",
                  ].join(" ")}
                >
                  {step === steps.length - 1 && phase === 1
                    ? "Phase 2 : Closing →"
                    : "Suivant →"
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
