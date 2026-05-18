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
| FAQ accordion | Transitions layout | `FAQItem` + AnimatePresence | ✅ Framer Motion |
| Sticky CTA | Après 400px scroll | Implémenté | ✅ |
| Pricing section | 3 plans | Section `#pricing` + toggle | ✅ Toggle annuel -20% |
| Dark only | Pas de light mode | 100% dark | ✅ |

### ✅ Ce qui a été complété (session actuelle)

#### Étape 1 — Design system
| Fichier | Statut |
|---|---|
| `lib/design-tokens.ts` | ✅ Créé |
| `lib/motion.ts` (presets Framer) | ✅ Créé |
| `lib/easings.ts` | ✅ Créé |
| Tailwind v4 `@theme` directive tokens (brand-50→900) | ✅ Dans `globals.css` |
| Migration violet → cyan `#00E5FF` (17 fichiers) | ✅ Terminé |

#### Étape 2 — Primitives
| Composant | Statut |
|---|---|
| `MagneticButton` (primary/ghost/link, spring 60px) | ✅ Créé |
| `GlowCursor` (12px→40px, mobile disabled) | ✅ Créé + intégré layout |
| `SmoothScrollProvider` (Lenis global) | ✅ Créé + intégré layout |
| `SectionLabel` (§XX kicker animé) | ✅ Créé |
| `AnimatedText` (split words/chars) | ✅ Créé |
| `Marquee` (Web Animations API, GPU-accelerated) | ✅ Créé |
| `GradientBorder` (conic-gradient rAF animé) | ✅ Créé |

#### Étape 4 — Landing améliorée
| Section | Statut |
|---|---|
| §01 Marquee features (entre Hero et §02) | ✅ Inséré |
| §03 Social proof — métriques 4 cards + témoignage | ✅ Créé |
| FAQ Framer Motion (AnimatePresence + layout) | ✅ Accordion animé |
| Hero CTA — `MagneticButton` primary + ghost | ✅ |
| CTA final — `MagneticButton` | ✅ |
| Pricing card Pro — `GradientBorder` animé | ✅ |
| Features grid — SVG icons (remplace emoji) | ✅ |
| Footer massif — 4 colonnes, social links, status | ✅ |
| NodeNetwork — couleurs violet → brand cyan | ✅ |
| Migration cyan-* → brand-* (page.tsx) | ✅ |

### ❌ Ce qui n'est pas encore fait (du brief)

#### Étape 3 — Hero 3D (React Three Fiber)
| Élément | Statut |
|---|---|
| Network graph 3D R3F (nœuds pulsants) | ⚠️ Canvas 2D existe — R3F non prioritaire |
| GSAP ScrollTrigger scroll-pinned sections | ❌ Non implémenté |
| Dépliage au scroll → wireframe France | ❌ Non implémenté |
| Shader bruit de Perlin (WebGL) | ❌ Non implémenté |

#### Étape 4 — Landing (reste)
| Section | Statut |
|---|---|
| Section "Le constat" scroll-pinned data viz | ✅ ConstatSection.tsx — 300vh sticky, 3 cartes révélées au scroll |
| Démo produit scroll-pinned 5 scènes | ✅ ScrollDemoSection.tsx — 500vh sticky, forceScene prop |
| Pricing toggle mensuel/annuel animé | ✅ Done |
| Page transitions (rideau noir) | ✅ Curtain + PageFade dans LayoutShell |

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
| `app/sitemap.ts` | ✅ |
| `app/robots.ts` | ✅ |
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
| 5 | 🔴 P1 | Design | **Direction créative** — Claim validé ✅, palette cyan ✅ — Concept 3D R3F reporté | ✅ Partiel | 2026-05-17 |
| 6 | 🟡 P2 | Design | **Étape 1** — Design tokens (`design-tokens.ts`, `lib/motion.ts`, `lib/easings.ts`, Tailwind `@theme`) | ✅ Fait | 2026-05-17 |
| 7 | 🟡 P2 | Design | **Étape 2** — Primitives : `MagneticButton`, `GlowCursor`, `AnimatedText`, `Marquee`, `GradientBorder` | ✅ Fait | 2026-05-17 |
| 8 | 🟡 P2 | Design | **Étape 3** — Hero R3F : Canvas 2D NodeNetwork retenu (R3F non prioritaire) | ⏳ Reporté | — |
| 9 | 🟡 P2 | Design | **Étape 4a** — Landing : §01 marquee ✅, §03 social proof ✅, SVG icons ✅, footer massif ✅ | ✅ Fait | 2026-05-17 |
| 10 | 🟡 P2 | Design | **Étape 4b** — Landing : FAQ Framer ✅, MagneticButton CTAs ✅, GradientBorder Pro card ✅ | ✅ Fait | 2026-05-17 |
| 11 | 🟡 P2 | Design | **Étape 4c** — Pricing toggle ✅ / SVG checkmarks ✅ / rideau noir ✅ / §02 scroll-pinned ✅ / Hero H1 animé ✅ | ✅ Fait | 2026-05-17 |
| 12 | 🟡 P2 | SEO | sitemap.ts + robots.ts ✅ / /api/og (OG images dynamiques) ❌ | ✅ Partiel | 2026-05-17 |
| 13 | 🟡 P2 | UI/Design | Remplacer l'emoji 🔒 dans `UpgradeGate.tsx` par un SVG cadenas | ✅ Fait | 2026-05-17 |
| 14 | 🟡 P2 | UX | Page de succès post-checkout : toast/bannière "Bienvenue en Pro" quand `?checkout=success` | ✅ Fait | 2026-05-17 |
| 15 | 🟡 P2 | Data | Déduplication fuzzy à l'import CSV | ✅ Fait | 2026-05-17 |
| 16 | 🟡 P2 | UI | Badge trial restant dans la sidebar | ✅ Fait | 2026-05-17 |
| 17 | 🟢 P3 | Pages | `/produit`, `/cas-dusage`, `/integrations`, `/tarifs`, `/a-propos` | ⏳ À faire | — |
| 18 | 🟢 P3 | Pages | `/blog` + `/blog/[slug]`, `/changelog` (timeline animée), `/contact` | ⏳ À faire | — |
| 19 | 🟢 P3 | App | `/app/leads/[id]` route dédiée (vs drawer actuel) | ⏳ À faire | — |
| 20 | 🟢 P3 | App | `/app/campagnes` — séquences de prospection | ⏳ À faire | — |
| 21 | 🟢 P3 | App | `/app/parametres` — profil, billing, intégrations | ⏳ À faire | — |
| 22 | 🟡 P2 | Perf | Optimisations perf landing : next/font self-hosted, dynamic imports, RAF off-screen | ✅ Fait | 2026-05-18 |
| 23 | 🟢 P3 | Mobile | PWA installable — manifest.json + service worker | ✅ Fait | 2026-05-18 |
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
| 2026-05-17 | Design | Primitives UI : `MagneticButton`, `GlowCursor`, `SmoothScrollProvider`, `SectionLabel`, `AnimatedText`, `Marquee`, `GradientBorder` | 7 fichiers créés |
| 2026-05-17 | Design | Design system : `lib/design-tokens.ts`, `lib/motion.ts`, `lib/easings.ts`, `@theme` Tailwind v4 brand-50→900 | 3 fichiers créés |
| 2026-05-17 | Design | Migration couleur violet → cyan `#00E5FF` — 17+ fichiers app CRM + landing | Batch PowerShell |
| 2026-05-17 | Landing | §01 Marquee features (Google Maps, INPI, Relances…) entre Hero et §02 | `app/page.tsx` |
| 2026-05-17 | Landing | §03 Social proof — 4 métriques + témoignage quote | `app/page.tsx` |
| 2026-05-17 | Landing | FAQ accordion Framer Motion — AnimatePresence + layout + brand accent | `app/page.tsx` |
| 2026-05-17 | Landing | Hero CTA → `MagneticButton` primary + ghost ; CTA Final → `MagneticButton` | `app/page.tsx` |
| 2026-05-17 | Landing | Pricing Pro card → `GradientBorder` conic-gradient animé (6s/tour) | `app/page.tsx` |
| 2026-05-17 | Landing | Features grid — 6 SVG icons dans icon box (remplace emoji) | `app/page.tsx` |
| 2026-05-17 | Landing | Footer massif — 4 colonnes, social links LinkedIn/email, status dot émeraude | `app/page.tsx` |
| 2026-05-17 | Landing | NodeNetwork — violet retiré, palette 100% brand cyan | `app/page.tsx` |
| 2026-05-17 | Fix | Mojibake UTF-8/cp1252 corrigé — 26 fichiers TSX (é, à, §, —, →) via fix-encoding2.js | Batch 26 fichiers |
| 2026-05-17 | Landing | ✓/✕ → SVG inline dans features compare, comparatif tableau, pricing feats | `app/page.tsx` |
| 2026-05-17 | Landing | Toggle mensuel/annuel animé (spring) — Pro 15€, Agence 39€/mois en annuel, badge -20% | `app/page.tsx` |
| 2026-05-17 | Landing | Refs résiduelles cyan-*/violet-* → brand-* supprimées | `app/page.tsx` |
| 2026-05-17 | SEO | sitemap.ts + robots.ts créés
| 2026-05-17 | Landing | Transitions de page — rideau noir (Curtain scaleY 1→0, 700ms) + PageFade (opacity delay 180ms) | ,  |
| 2026-05-17 | Landing | Hero H1 — stagger word reveal (chaque mot slide depuis le bas, overflow masqué) |  |
| 2026-05-17 | Landing | §02 ConstatSection — 320vh sticky, redesign 3 cartes (BadCard rouge / MidCard cyan "Recommandé" / GoodCard emerald grille 2×2 ROI), barre progression gradient | `components/landing/ConstatSection.tsx` |
| 2026-05-17 | Landing | §04 démo scroll-pinned — ScrollDemoSection.tsx (500vh sticky, 5 étapes, forceScene contrôlé) | `components/landing/ScrollDemoSection.tsx` |
| 2026-05-17 | Fix | **Scroll-pinned débloqué** : `overflow-x:hidden` forçait `overflow-y:auto` sur le div racine (conteneur de scroll) → `position:sticky` cassé pour §02 et §04. Remplacé par `overflow-x:clip` + hooks `getBoundingClientRect` RAF (compat Lenis) | `app/page.tsx`, `ConstatSection.tsx`, `ScrollDemoSection.tsx` |
| 2026-05-17 | UX | Bannière post-checkout — redirect Stripe → `/app?checkout=success&plan=`, `CheckoutBanner` (toast bienvenue + refresh plan + URL nettoyée), monté dans LayoutShell | `api/checkout/route.ts`, `CheckoutBanner.tsx`, `LayoutShell.tsx` |
| 2026-05-17 | UI | Badge trial sidebar — `/api/plan` expose `getTrialInfo`, `usePlan` typé `trial`, badge ambré pulsé "Essai · N jours restants" | `api/plan/route.ts`, `usePlan.ts`, `Sidebar.tsx` |
| 2026-05-17 | Fix | Mojibake icônes Toast (✓ ✕ ⚠) corrigé | `components/ui/Toast.tsx` |
| 2026-05-17 | Fix | Build Vercel cassé — CheckoutBanner importait lib/plan (→ Prisma/pg dans bundle navigateur). Labels plan inline client-safe | `components/ui/CheckoutBanner.tsx` |
| 2026-05-17 | Landing | ConstatSection — métrique « 12 k€ semaine de test » (activité Ads perso, hors sujet CRM) remplacée par « +3h gagnées/jour » | `components/landing/ConstatSection.tsx` |
| 2026-05-17 | Data | Déduplication fuzzy import CSV — `normalizePhoneKey` (tous formats → 10 chiffres) + `normalizeNameKey` (accents/formes juridiques/tokens triés). Dédup par tel canonique prioritaire, repli nom+ville. Retour `skipped` affiché dans ImportCSV | `lib/phone.ts`, `api/leads/import/route.ts`, `ImportCSV.tsx` |
| 2026-05-17 | Cleanup | Suppression du marketing Google Ads / stat paysagiste (12k€/150k€) — email "offre" génériqué (sans la stat), landing "closing Google Ads"→"scripts de closing", CLAUDE.md (section "Activité personnelle de Téo" retirée), README, ContactModal | `lib/email.ts`, `app/page.tsx`, `CLAUDE.md`, `README.md`, `ContactModal.tsx` |
| 2026-05-17 | CRM | LeadDrawer — onglet « Suivi Google Ads » renommé « Formulaire client » (feature et colonnes `ads_*` conservées, non destructif) | `components/leads/LeadDrawer.tsx` |
| 2026-05-18 | Perf | Fonts migrées `@fontsource @import` (render-blocking) → `next/font/local` self-hosted (preload, swap, anti-CLS) | `app/fonts/fonts.ts`, `app/layout.tsx`, `app/globals.css` |
| 2026-05-18 | Perf | `ScrollDemoSection` + `ConstatSection` (lourdes, sous la ligne de flottaison, → `AnimatedDemo`) en `next/dynamic` — sorties du chunk initial de `/` | `app/page.tsx` |
| 2026-05-18 | Perf | `NodeNetwork` — boucle RAF gelée hors-vue (IntersectionObserver) + onglet caché (visibilitychange) : fin du drain CPU continu | `app/page.tsx` |
| 2026-05-18 | PWA | Manifest corrigé — `theme_color` #00E5FF (cohérent layout), `start_url`/`id` `/app`, `scope` `/`, `dir`. SW v2 — fallback hors-ligne brandé pour les navigations non cachées | `app/manifest.ts`, `public/sw.js` |
| 2026-05-18 | Perf | **LCP 7,9 s → ≈FCP** (PageSpeed mobile 62). Le H1 hero (élément LCP) était `opacity:0` via Framer Motion `initial` → invisible jusqu'à l'hydratation. Remplacé par reveal CSS pur transform-only (`.hero-word`, démarre au 1er paint, respecte reduced-motion) | `app/page.tsx`, `app/globals.css` |
| 2026-05-18 | A11y | Accessibilité 80 → corrections déterministes : `maximumScale` retiré du viewport (zoom débloqué), `<main>` landmark sur landing/auth, 5 noms accessibles (`aria-label` : toggle annuel role=switch, LinkedIn, contact email, CTA sticky, fermeture bannière), SVG `aria-hidden` | `app/layout.tsx`, `components/layout/LayoutShell.tsx`, `app/page.tsx` |
| 2026-05-18 | Perf | `GlowCursor` (curseur custom global : listener mousemove + RAF + élément fixe sur toutes les pages) supprimé du layout + fichier retiré — moins de JS/runtime client | `app/layout.tsx`, `components/ui/GlowCursor.tsx` (supprimé) |
| 2026-05-18 | Perf | Landing découplée de Clerk (étape 1) — `useUser` retiré, auth vérifiée serveur (`/api/checkout` → 401 `auth_required`, redirection sign-up), nav publique unique | `app/page.tsx`, `app/api/checkout/route.ts` |
| 2026-05-18 | Perf | **Route groups (étape 2)** — `(public)` (landing, layout sans Clerk) vs `(app)` (CRM + sign-in/up, layout avec ClerkProvider + LayoutShell). `clerk-js` totalement hors du bundle de `/`. URLs inchangées, proxy.ts non impacté. Build prod validé | `app/(public)/`, `app/(app)/`, `app/layout.tsx` |
| 2026-05-18 | Design | Landing : carte "Le plus populaire" premium (badge cyan dégradé + étoile + glow, surface brand renforcée, fix double `md:-mt-3`) ; toggle mensuel/annuel recentré (pastille `top-px/left-px`) ; démo §04 (AnimatedDemo) 28 occurrences violet/indigo → cyan brand ; logo landing en cyan | `app/(public)/page.tsx`, `components/landing/AnimatedDemo.tsx` |
| 2026-05-18 | Fix | `€` affiché en carré blanc = U+0080 (octet € cp1252 mal décodé, char de contrôle sans glyphe). Correction encodage complète de `page.tsx` (U+0080→€, …→…, —→—, œ→œ ; 39 chars, 0 restant). Carte Pro re-redesignée : GradientBorder animé retiré, carte premium nette (bordure brand, dégradé, glow, CTA cyan) | `app/(public)/page.tsx` |
| 2026-05-18 | Fix | **Mojibake cp1252 repo-wide** — le bug du carré blanc touchait 22 fichiers (131 chars : ' — … € œ en chars de contrôle). Corrigé via table Windows-1252 sur tout app/components/lib. Favicon refait en cyan (`app/icon.svg`, `public/icon*.svg`), ancien `favicon.ico` Next supprimé | 26 fichiers |
| 2026-05-18 | Fix | Migration brand incomplète : 67 classes violet/indigo réelles oubliées (sign-in/up 100% violet, INPISearch, GoogleAdsScriptViewer, not-found, Sidebar…) → cyan brand. App 100% cohérente | 10 fichiers |

---

## 📊 Résumé de l'état actuel

```
App CRM (fonctionnel)    ████████████████████░  97%
Design system app        ████████████████████░  97%
Landing page             █████████████████████  97%  (brief ~85% couvert)
Brief design Étapes 1-2  ████████████████████░  100% ✅
Brief design Étape 3     ████░░░░░░░░░░░░░░░░░  20%  (Canvas 2D, pas R3F)
Brief design Étape 4     █████████████████████  100% ✅
Brief design Étape 5     ░░░░░░░░░░░░░░░░░░░░░   0%  (pages secondaires)
Stripe prod              ░░░░░░░░░░░░░░░░░░░░░   0%  ← P1 immédiat
Pages secondaires        ░░░░░░░░░░░░░░░░░░░░░   0%
SEO                      ░░░░░░░░░░░░░░░░░░░░░   0%
```

**Déployé sur** : https://prospeo-six.vercel.app
**Repo** : https://github.com/middlekick/prospeo
**Dernier commit** : `9980de4` — docs: ajout UPDATE.md
