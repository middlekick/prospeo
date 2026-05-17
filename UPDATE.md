# UPDATE.md — Suivi des modifications Prospeo

> Mis à jour automatiquement à chaque session Claude Code.
> P1 = Critique / bloquant · P2 = Important · P3 = Confort / croissance

---

## 🎨 Cahier des charges — Refonte design complète

> Analyse du brief "Awwwards SOTD" — état d'avancement détaillé

### ✅ Ce qui est déjà en place (correspond au brief)

| Élément | Brief | État actuel | Note |
|---|---|---|---|
| Background sombre | `#0A0A0B` | `#050508` | ✅ Quasi-identique |
| Fontes | Syne + DM Mono | Syne + DM Mono | ✅ Parfait |
| Framer Motion | Requis | v12.38 installé | ✅ Déjà utilisé |
| Lenis smooth scroll | Requis | v1.3 installé | ✅ Actif en landing |
| Grain texture | SVG noise overlay | Implémenté (`.grain:before`) | ✅ 2.8% opacity |
| Aurora animée | Fond hero | Implémenté (CSS animation) | ✅ 22s ease-in-out |
| Network Canvas 2D | Section particules | `NodeNetwork` Canvas 2D | ✅ Variante Canvas (pas R3F) |
| Scroll reveal | IntersectionObserver | `data-reveal` custom | ✅ Présent |
| Compteurs animés | Scroll-triggered | `Counter` component | ✅ easeOut cubic |
| Hero card 3D | Parallax souris | `HeroCard3D` + Framer springs | ✅ rotX/rotY springs |
| Section kickers | §XX DM Mono | `Eyebrow` + §00 §02… | ✅ Numbering présent |
| Claim hero | Max 8 mots, percutant | "Trouve. Appelle. Signe." | ✅ 3 mots choc |
| Gradient text | Titres colorés | `G()` component | ✅ Violet→cyan |
| FAQ accordion | Transitions layout | `FAQItem` | ⚠️ Basique (pas Framer) |
| Sticky CTA | Après 400px scroll | Implémenté | ✅ |
| Pricing section | 3 plans | Section `#pricing` | ⚠️ Pas de toggle mensuel/annuel |
| Dark only | Pas de light mode | 100% dark | ✅ |

### ❌ Ce qui n'est pas encore fait (du brief)

#### Étape 0 — Direction créative (à valider AVANT le code)
| Élément | Statut |
|---|---|
| 3 variantes de claim formel | ❌ "Trouve. Appelle. Signe." existe mais pas validé formellement |
| 3 concepts 3D pour le hero | ❌ Non présenté |
| Mood board verbal (5-8 mots) | ❌ Non formalisé |
| Système de naming sections validé | ⚠️ §XX existe mais informel |

#### Étape 1 — Design system (fichiers manquants)
| Fichier | Statut |
|---|---|
| `src/styles/design-tokens.ts` | ❌ N'existe pas |
| `lib/motion.ts` (presets Framer) | ❌ N'existe pas |
| `lib/easings.ts` | ❌ N'existe pas |
| Tailwind v4 `@theme` directive tokens | ❌ Tokens non centralisés |

#### Étape 2 — Primitives manquantes
| Composant | Statut |
|---|---|
| `MagneticButton` | ❌ Non implémenté |
| `GlowCursor` (curseur custom 12px→40px) | ❌ Non implémenté |
| `SmoothScrollProvider` (Lenis provider) | ⚠️ Inline dans page.tsx, pas un composant |
| `SectionLabel` réutilisable | ⚠️ Inline `Eyebrow`, pas un composant partagé |
| `AnimatedText` (split words/chars) | ❌ Non implémenté |
| `Marquee` (logos infinis) | ❌ Non implémenté |
| `GrainOverlay` (composant global) | ⚠️ CSS inline dans page.tsx |
| `GradientBorder` (conic-gradient animé) | ❌ Non implémenté |

#### Étape 3 — Hero 3D (React Three Fiber)
| Élément | Statut |
|---|---|
| `@react-three/fiber` installé | ❌ Non installé |
| `@react-three/drei` installé | ❌ Non installé |
| `three` installé | ❌ Non installé |
| Network graph 3D (nœuds pulsants + arêtes) | ❌ Canvas 2D existe mais pas R3F |
| Réaction souris (parallax + attraction) | ⚠️ Partiel (card Framer Motion) |
| Dépliage au scroll → France wireframe | ❌ Non implémenté |
| GSAP ScrollTrigger | ❌ Non installé |
| Shader bruit de Perlin (WebGL) | ❌ Non implémenté |

#### Étape 4 — Landing complète (sections manquantes)
| Section | Statut |
|---|---|
| Bandeau logos clients (marquee B&W → cyan hover) | ❌ |
| Section "Le constat" scroll-pinned data viz | ⚠️ Existe en statique, pas pinned |
| Démo produit scroll-pinned 4 étapes | ❌ `AnimatedDemo` existe mais pas scroll-pinned |
| Micro-vidéos loop (remplace screenshots) | ❌ Screenshots statiques ou AnimatedDemo JSX |
| Section "Avant/Après" split horizontal reveal | ❌ |
| Social proof (compteurs + 3 témoignages photos) | ⚠️ Compteurs ✅, témoignages basiques |
| Pricing toggle mensuel/annuel animé | ❌ |
| FAQ Framer Motion (layout animations) | ⚠️ FAQ basique sans Framer |
| CTA final XXL + bouton magnetic | ❌ CTA existe, pas magnétique |
| Footer massif (Framer/Vercel style) | ❌ Footer minimal |
| Page transitions (rideau noir + glitch logo) | ❌ |

#### Étape 5 — Pages secondaires (aucune n'existe)
| Page | Statut |
|---|---|
| `/produit` | ❌ |
| `/cas-dusage` | ❌ |
| `/integrations` | ❌ |
| `/tarifs` | ❌ |
| `/a-propos` | ❌ |
| `/blog` + `/blog/[slug]` | ❌ |
| `/changelog` | ❌ |
| `/contact` | ❌ |

#### App interne (delta avec le brief)
| Page | Brief | État | Statut |
|---|---|---|---|
| `/app/dashboard` | KPIs + derniers leads + activité | Existe, redesigné | ✅ |
| `/app` (leads) | Table + filtres + kanban | Existe, complet | ✅ |
| `/app/leads/[id]` | Fiche lead détaillée | → Drawer actuel (pas de route dédiée) | ⚠️ |
| `/app/campagnes` | Séquences de prospection | ❌ N'existe pas | ❌ |
| `/app/recherche` | SerpAPI + RNE unifié | INPI `/app/inpi` + Scrape dans `/app` | ⚠️ |
| `/app/parametres` | Profil, billing, intégrations | ❌ N'existe pas | ❌ |

#### SEO & Performance
| Élément | Statut |
|---|---|
| `app/sitemap.ts` | ❌ |
| `app/robots.ts` | ❌ |
| `/api/og` (OG images dynamiques) | ❌ |
| OpenGraph metadata par page | ⚠️ Partiel |
| Lighthouse > 90 (audit) | ❌ Non mesuré |
| Dynamic imports Three.js/GSAP | ❌ (libs non installées) |

#### Palette couleurs — différence clé
| Token | Brief | Actuel | Delta |
|---|---|---|---|
| Background | `#0A0A0B` | `#050508` / `#080b12` | Très proche ✅ |
| Accent primaire | `#00E5FF` cyan électrique | Violet `#7c3aed` | ⚠️ **Direction différente** |
| Cyan | Couleur principale | Couleur secondaire | Inversion à décider |
| Violet | Absent du brief | Couleur principale actuelle | À valider |

---

## 📋 Tableau de bord des tâches

| # | Priorité | Catégorie | Tâche | Statut | Fait le |
|---|---|---|---|---|---|
| 1 | 🔴 P1 | Stripe | Créer produits Pro (19€) + Agence (49€) sur dashboard.stripe.com — copier Price IDs dans env vars Vercel | ⏳ À faire | — |
| 2 | 🔴 P1 | Stripe | Test end-to-end : Checkout → webhook → Subscription en base → usePlan retourne "pro" | ⏳ À faire | — |
| 3 | 🔴 P1 | Vercel | Vérifier les env vars Vercel : `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app`, `NEXT_PUBLIC_APP_URL` | ⏳ À faire | — |
| 4 | 🔴 P1 | Stripe | Activer le webhook Stripe en prod → `https://prospeo-six.vercel.app/api/webhook` | ⏳ À faire | — |
| 5 | 🔴 P1 | Design | **Étape 0 brief** — Valider : claim final, concept 3D hero, palette cyan vs violet, mood board | ⏳ À faire | — |
| 6 | 🟡 P2 | Design | **Étape 1** — Design tokens (`design-tokens.ts`, `lib/motion.ts`, `lib/easings.ts`, Tailwind `@theme`) | ⏳ À faire | — |
| 7 | 🟡 P2 | Design | **Étape 2** — Primitives : `MagneticButton`, `GlowCursor`, `AnimatedText`, `Marquee`, `GradientBorder` | ⏳ À faire | — |
| 8 | 🟡 P2 | Design | **Étape 3** — Hero R3F : installer three + @react-three/fiber + @react-three/drei, network graph 3D | ⏳ À faire | — |
| 9 | 🟡 P2 | Design | **Étape 4a** — Landing : marquee logos, scroll-pinned "Le constat", split before/after | ⏳ À faire | — |
| 10 | 🟡 P2 | Design | **Étape 4b** — Landing : démo scroll-pinned 4 étapes, micro-vidéos loop, CTA magnetic, footer massif | ⏳ À faire | — |
| 11 | 🟡 P2 | Design | **Étape 4c** — Landing : pricing toggle mensuel/annuel Framer, FAQ Framer, page transitions | ⏳ À faire | — |
| 12 | 🟡 P2 | SEO | sitemap.ts + robots.ts + /api/og (OG images dynamiques) | ⏳ À faire | — |
| 13 | 🟡 P2 | UI/Design | Remplacer l'emoji 🔒 dans `UpgradeGate.tsx` par un SVG cadenas | ⏳ À faire | — |
| 14 | 🟡 P2 | UX | Page de succès post-checkout : toast/bannière "Bienvenue en Pro" quand `?checkout=success` | ⏳ À faire | — |
| 15 | 🟡 P2 | Data | Déduplication fuzzy à l'import CSV | ⏳ À faire | — |
| 16 | 🟡 P2 | UI | Badge trial restant dans la sidebar | ⏳ À faire | — |
| 17 | 🟢 P3 | Pages | `/produit`, `/cas-dusage`, `/integrations`, `/tarifs`, `/a-propos` | ⏳ À faire | — |
| 18 | 🟢 P3 | Pages | `/blog` + `/blog/[slug]`, `/changelog` (timeline animée), `/contact` | ⏳ À faire | — |
| 19 | 🟢 P3 | App | `/app/leads/[id]` route dédiée (vs drawer actuel) | ⏳ À faire | — |
| 20 | 🟢 P3 | App | `/app/campagnes` — séquences de prospection | ⏳ À faire | — |
| 21 | 🟢 P3 | App | `/app/parametres` — profil, billing, intégrations | ⏳ À faire | — |
| 22 | 🟢 P3 | Perf | Audit Lighthouse (objectif > 90) + dynamic imports | ⏳ À faire | — |
| 23 | 🟢 P3 | Mobile | PWA installable — manifest.json + service worker | ⏳ À faire | — |
| 24 | 🟢 P3 | UX | Notifications rappels in-app (badge + son) | ⏳ À faire | — |
| 25 | 🟢 P3 | Import | Import LinkedIn CSV (format Sales Navigator) | ⏳ À faire | — |
| 26 | 🟢 P3 | CRM | Tags personnalisables par user | ⏳ À faire | — |
| 27 | 🟢 P3 | Acquisition | Stratégie contenu LinkedIn + vidéo démo | ⏳ À faire | — |

---

## ✅ Historique des modifications

| Date | Phase | Description | Fichiers modifiés |
|---|---|---|---|
| 2026-05-17 | Phase 4.6 | Redesign Sidebar — SVG icons, keyboard hints ⌘1-5, Cmd+K button, plan badge glow | `Sidebar.tsx`, `LayoutShell.tsx` |
| 2026-05-17 | Phase 4.6 | Redesign StatsBar — StatCard SVG icons, accents par métrique, état actif coloré | `StatsBar.tsx` |
| 2026-05-17 | Phase 4.6 | Redesign FilterPills — couleur par statut, font-mono counter, pulse dot rappels | `FilterPills.tsx` |
| 2026-05-17 | Phase 4.6 | Redesign Dashboard — 4 panels gradient kicker, SVG KPI, funnel, calendrier RDV | `dashboard/page.tsx` |
| 2026-05-17 | Phase 4.6 | Redesign Scripts — ScriptCard gradient dual-tone, badges type, SVG actions | `scripts/page.tsx` |
| 2026-05-17 | Phase 4.6 | Redesign Auto-scrape — banner emerald SVG, config cards gradient, toggle glow | `auto-scrape/page.tsx` |
| 2026-05-17 | Phase 4.6 | Redesign INPI (page + composant) — header chips, formulaire SVG, table redesignée complète, états stylisés | `inpi/page.tsx`, `INPISearch.tsx` |
| 2026-05-17 | Docs | Mise à jour CLAUDE.md — versions exactes, routing, Phase 4.6, ConfirmModal | `CLAUDE.md` |
| 2026-05-17 | Docs | Création UPDATE.md — tableau P1/P2/P3, historique, analyse brief design | `UPDATE.md` |

---

## 📊 Résumé de l'état actuel

```
App CRM (fonctionnel)    ████████████████████░  97%
Design system app        ████████████████████░  95%
Landing page actuelle    ███████████████░░░░░░  72%  (brief ~40% couvert)
Stripe prod              ░░░░░░░░░░░░░░░░░░░░░   0%  ← P1 immédiat
Brief design (Étape 0)   ░░░░░░░░░░░░░░░░░░░░░   0%  ← à valider
Brief design (Étapes 1-5)████░░░░░░░░░░░░░░░░░  18%  (bases présentes)
Pages secondaires        ░░░░░░░░░░░░░░░░░░░░░   0%
SEO                      ░░░░░░░░░░░░░░░░░░░░░   0%
```

**Déployé sur** : https://prospeo-six.vercel.app
**Repo** : https://github.com/middlekick/prospeo
**Dernier commit** : `9980de4` — docs: ajout UPDATE.md
