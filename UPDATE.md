# UPDATE.md — Suivi des modifications Prospeo

> Mis à jour automatiquement à chaque session Claude Code.
> P1 = Critique / bloquant · P2 = Important · P3 = Confort / croissance

---

## 📋 Tableau de bord des tâches

| # | Priorité | Catégorie | Tâche | Statut | Fait le |
|---|---|---|---|---|---|
| 1 | 🔴 P1 | Stripe | Créer les produits Pro (19€) + Agence (49€) sur dashboard.stripe.com et copier les Price IDs dans les env vars Vercel | ⏳ À faire | — |
| 2 | 🔴 P1 | Stripe | Test end-to-end : Checkout → webhook → Subscription en base → usePlan retourne "pro" | ⏳ À faire | — |
| 3 | 🔴 P1 | Vercel | Vérifier les env vars Vercel : `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app`, `NEXT_PUBLIC_APP_URL=https://prospeo-six.vercel.app` | ⏳ À faire | — |
| 4 | 🔴 P1 | Stripe | Activer le webhook Stripe en prod → pointer vers `https://prospeo-six.vercel.app/api/webhook` | ⏳ À faire | — |
| 5 | 🟡 P2 | UI/Design | Remplacer l'emoji 🔒 dans `UpgradeGate.tsx` par un SVG cadenas (cohérence design system) | ⏳ À faire | — |
| 6 | 🟡 P2 | UX | Page de succès post-checkout : ajouter toast/bannière "Bienvenue en Pro" quand `?checkout=success` | ⏳ À faire | — |
| 7 | 🟡 P2 | Data | Déduplication fuzzy à l'import CSV (ex: "Dupont" vs "DUPONT" non détectés) | ⏳ À faire | — |
| 8 | 🟡 P2 | UI | Afficher les jours de trial restants dans la sidebar (données déjà dans usePlan) | ⏳ À faire | — |
| 9 | 🟢 P3 | Mobile | PWA installable — manifest.json + service worker pour prospection mobile | ⏳ À faire | — |
| 10 | 🟢 P3 | UX | Notifications rappels in-app — badge rouge + son discret à J0 des rappels dus | ⏳ À faire | — |
| 11 | 🟢 P3 | Import | Import LinkedIn CSV (format Sales Navigator) — parser dédié | ⏳ À faire | — |
| 12 | 🟢 P3 | CRM | Tags personnalisables par user (actuellement hard-codés dans `types.ts`) | ⏳ À faire | — |
| 13 | 🟢 P3 | UX | Onboarding interactif — tour guidé in-app avec highlights après la modal actuelle | ⏳ À faire | — |
| 14 | 🟢 P3 | Acquisition | Stratégie contenu LinkedIn ciblant commerciaux indépendants + vidéo démo courte | ⏳ À faire | — |

---

## ✅ Historique des modifications

| Date | Phase | Description | Fichiers modifiés |
|---|---|---|---|
| 2026-05-17 | Phase 4.6 | Redesign complet UI app — Sidebar SVG icons + plan badge, StatsBar StatCard, FilterPills couleurs, LayoutShell orbe | `Sidebar.tsx`, `StatsBar.tsx`, `FilterPills.tsx`, `LayoutShell.tsx` |
| 2026-05-17 | Phase 4.6 | Redesign Dashboard — 4 panels gradient kicker, SVG KPI icons, funnel taux, calendrier RDV | `dashboard/page.tsx` |
| 2026-05-17 | Phase 4.6 | Redesign Scripts — ScriptCard gradient dual-tone, badges type, SVG actions, section kickers | `scripts/page.tsx` |
| 2026-05-17 | Phase 4.6 | Redesign Auto-scrape — banner emerald SVG, config cards gradient, toggle glow | `auto-scrape/page.tsx` |
| 2026-05-17 | Phase 4.6 | Redesign INPI — header chips, enrichissement banner SVG, formulaire redesigné complet | `inpi/page.tsx` |
| 2026-05-17 | Phase 4.6 | Redesign INPISearch — table redesignée (checkbox globale, badge RM étoile, code postal, états stylisés, pagination SVG) | `INPISearch.tsx` |
| 2026-05-17 | Phase 4.6 | Mise à jour CLAUDE.md — versions exactes, routing corrigé, Phase 4.6 ajoutée, ConfirmModal documenté | `CLAUDE.md` |

---

## 📊 Résumé de l'état actuel

```
Fonctionnel en prod  ████████████████████░  95%
Système de plans     ████████████████████░  95%  (code ✅ — Stripe prod ❌)
Design system        ████████████████████░  98%
Tests Stripe         ░░░░░░░░░░░░░░░░░░░░░   0%  ← priorité immédiate
```

**Déployé sur** : https://prospeo-six.vercel.app
**Repo** : https://github.com/middlekick/prospeo
**Dernier commit** : `b2a3b8f` — docs(claude): mise à jour CLAUDE.md
