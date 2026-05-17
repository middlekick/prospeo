# CLAUDE.md — Prospeo CRM

> Ce fichier est lu automatiquement par Claude Code à chaque session.
> Il contient tout le contexte du projet. Ne jamais le supprimer ni l'alléger.

---

## 🧠 Contexte du projet

**Prospeo** est un CRM de prospection commerciale développé et utilisé par **Téo Mikulic**.

### Cible principale du SaaS
**Commerciaux indépendants, freelances en acquisition, et petites agences** qui prospectent des artisans et TPE locales (plombiers, électriciens, paysagistes, peintres…). Ils ont besoin de sourcer des leads, suivre leurs appels, gérer leurs RDV et relances — le tout centralisé. Prospeo est le seul outil qui intègre le sourcing (Google Maps + INPI) **et** le suivi CRM en un seul endroit.

### Objectif du CRM
Centraliser la prospection : sourcing de leads (Google Maps + INPI), suivi des appels,
gestion des RDV, scripts d'appel, relances automatiques, journal d'activité — le tout sur une interface unique.

### État du projet
- ✅ **SaaS multi-utilisateurs** avec abonnements Stripe (Free / Pro 19€ / Agence 49€)
- ✅ **Déployé sur Vercel** — `prospeo-six.vercel.app` — repo `middlekick/prospeo`
- ✅ **Cron auto-scraping** actif (Vercel Cron, 8h Paris)
- ✅ **Système de plans complet** (gates API + UI + trial par code)

---

## 🏗️ Stack technique — État ACTUEL

| Couche | Technologie |
|---|---|
| Framework | **Next.js 16.2.6** — App Router |
| Langage | **TypeScript** strict |
| Styling | **Tailwind CSS v4** + fontes Syne / DM Mono |
| Auth | **Clerk v7** (`@clerk/nextjs`) — frFR localization, middleware actif |
| Base de données | **PostgreSQL** — Neon (cloud) via **Prisma v7** + adapter `@prisma/adapter-pg` |
| ORM | **Prisma v7** — schema dans `prisma/schema.prisma`, config dans `prisma.config.ts` |
| Scraping leads | **SerpAPI** — Google Maps (`engine: google_maps`) |
| Recherche entreprises | **API publique RNE** — `recherche-entreprises.api.gouv.fr` |
| Email | **Nodemailer** — transport Gmail (3 templates HTML redesignés) |
| Paiements | **Stripe v22** — checkout + webhook lifecycle complet |
| Déploiement | **Vercel** — `prospeo-six.vercel.app` — cron 8h actif |

---

## 📁 Structure réelle du projet

```
Prospeo/
├── app/
│   ├── page.tsx                       # Landing publique (route racine /)
│   ├── app/                           # CRM — protégé par Clerk
│   │   ├── page.tsx                   # Page leads — table/kanban, session d'appels, bulk, raccourcis
│   │   ├── dashboard/page.tsx         # Dashboard métriques + funnel + calendrier RDV + export CSV
│   │   ├── inpi/page.tsx              # Recherche INPI + import + auto-enrichissement
│   │   ├── scripts/page.tsx           # Scripts d'appel (téléprompter, CRUD localStorage)
│   │   ├── auto-scrape/page.tsx       # Config auto-scraping quotidien + "lancer maintenant"
│   │   └── admin/page.tsx             # Dashboard admin — users, plan, reset pwd, suppression
│   ├── not-found.tsx                  # Page 404 custom dark theme
│   ├── sign-in/[[...sign-in]]/page.tsx# Page login Clerk (dark theme)
│   ├── sign-up/[[...sign-up]]/page.tsx# Page inscription Clerk (dark theme)
│   ├── layout.tsx                     # Layout racine — ClerkProvider + ToastProvider + Shell
│   ├── globals.css                    # Tailwind + fontes + scrollbar
│   └── api/
│       ├── leads/
│       │   ├── route.ts               # GET — leads de l'user connecté (Prisma)
│       │   ├── save/route.ts          # POST — update + log auto + relances multi-paliers + retour lead
│       │   ├── import/route.ts        # POST — import en masse avec déduplication (gated csv Pro+)
│       │   ├── delete/route.ts        # POST — suppression par nom+telephone
│       │   └── activity/route.ts      # POST — ajout entrée manuelle au journal
│       ├── scrape/route.ts            # POST — scrape Google Maps via SerpAPI (gated quota Free)
│       ├── enrich/route.ts            # POST — enrichit les leads sans tel (Pro+)
│       ├── inpi/route.ts              # GET — recherche RNE avec filtres serveur (gated Pro+)
│       ├── email/route.ts             # POST — envoi email (3 templates) + log activité (gated Pro+)
│       ├── plan/route.ts              # GET — plan + limites + quota scraping (hook usePlan)
│       ├── trial/route.ts             # POST — activation trial par code d'invitation
│       ├── checkout/route.ts          # POST — session Stripe (pro/agency) avec metadata userId+plan
│       ├── webhook/route.ts           # POST — webhook Stripe (checkout.completed, sub.updated, sub.deleted)
│       ├── contact/route.ts           # POST — formulaire contact landing
│       ├── auto-scrape/route.ts       # GET/POST/PUT/DELETE — CRUD configs auto-scraping (Clerk)
│       ├── auto-scrape/run/route.ts   # POST — run manuel sécurisé Clerk (pas de secret exposé)
│       ├── cron/auto-scrape/route.ts  # POST — cron Vercel 8h (Bearer CRON_SECRET)
│       └── admin/                     # users, plan, reset-password, delete-user (ADMIN_USER_IDS)
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx                # Sidebar 220px — nav SVG + plan badge + UserButton Clerk
│   │   └── LayoutShell.tsx            # Shell + orbe violet + CommandPalette globale
│   ├── leads/
│   │   ├── types.ts                   # re-export Lead + TAG_OPTIONS + TAG_LABEL + colors
│   │   ├── LeadsTable.tsx             # Table + tag inline + tri + log rapide hover + sélection multiple
│   │   ├── KanbanView.tsx             # Vue kanban drag & drop natif par statut
│   │   ├── CallSession.tsx            # Mode session d'appels plein écran (portal) + stats live
│   │   ├── LeadDrawer.tsx             # Drawer — Suivi/Formulaire client(gated)/RDV + EmailPanel + Journal + voix
│   │   ├── FilterPills.tsx            # Filtres par statut + badge rappels pulsé
│   │   ├── StatsBar.tsx               # Stats globales (total, rappels, intéressés, RDV…)
│   │   ├── ScrapeForm.tsx             # Formulaire scraping + badge quota Free
│   │   ├── ImportCSV.tsx              # Modal import CSV avec preview 3 lignes
│   │   └── EnrichButton.tsx           # Enrichissement batch leads sans téléphone (Pro+ only)
│   ├── dashboard/
│   │   └── RdvCalendar.tsx            # Calendrier mensuel des RDV (pastilles par statut)
│   ├── inpi/
│   │   └── INPISearch.tsx             # Formulaire + table INPI (depts, NAF, RM, pagination)
│   ├── scripts/
│   │   └── GoogleAdsScriptViewer.tsx  # Viewer script closing Google Ads (étapes + objections)
│   ├── landing/
│   │   └── AnimatedDemo.tsx           # Démo animée 5 scènes en autoplay (Scraping→INPI→Scripts…)
│   └── ui/
│       ├── Toast.tsx                  # Système de toasts (Context + useToast) — remplace alert()
│       ├── CommandPalette.tsx         # Palette Cmd+K — navigation + recherche leads
│       ├── VoiceButton.tsx            # Dictée vocale Web Speech API (fr-FR)
│       ├── UpgradeGate.tsx            # Overlay 🔒 avec CTA vers /#pricing
│       ├── OnboardingModal.tsx        # Modal 4 étapes au 1er login (localStorage)
│       ├── TrialCodeModal.tsx         # Modal code d'invitation trial
│       ├── ContactModal.tsx           # Modal contact (landing page)
│       └── ConfirmModal.tsx           # Modal de confirmation générique (utilisé dans admin)
├── hooks/
│   └── usePlan.ts                     # Hook plan — fetch /api/plan, cache 5min sessionStorage, refresh()
├── lib/
│   ├── db.ts                          # Activity, Lead, fromPrisma, normalizeLead, leadKey
│   ├── plan.ts                        # PLAN_LIMITS, getUserPlan(), checkAndIncrementScrape(), getScrapeUsage()
│   ├── prisma.ts                      # Singleton PrismaClient (adapter pg, hot-reload safe)
│   ├── phone.ts                       # toWhatsAppUrl() — normalisation 06/07 → wa.me/336...
│   ├── email.ts                       # mailer + 3 templates HTML (offre, rdv_confirmation, rdv_rappel)
│   └── stripe.ts                      # export stripe (null si clé manquante)
├── prisma/
│   ├── schema.prisma                  # Schéma Prisma v7 (sans url= — cf. prisma.config.ts)
│   └── migrations/                    # Migrations SQL générées (ne pas modifier manuellement)
├── scripts/
│   └── migrate-json-to-db.ts          # Script one-shot : artisans.json → PostgreSQL
├── data/
│   ├── artisans.json                  # ⚠️ BACKUP + EXCLU DU GIT (données personnelles) — dans Neon
│   └── scripts.json                   # Scripts d'appel (cold call + closing Google Ads)
├── prisma.config.ts                   # Config Prisma v7 (datasource.url via dotenv)
├── proxy.ts                           # Middleware Clerk (fichier nommé proxy.ts par convention Next.js 16)
│                                      # Protège tout sauf : /, /landing, /sign-in, /sign-up, /api/webhook, /api/contact
├── vercel.json                        # Cron 8h (0 7 * * * UTC) + timeouts fonctions (60s scrape, 30s inpi)
├── .env                               # Variables d'environnement (ne jamais committer)
├── next.config.ts                     # serverExternalPackages: nodemailer, serpapi
├── tsconfig.json                      # scripts/ et lib/prisma.ts exclus du check TS (Prisma v7)
├── CLAUDE.md                          # Ce fichier
└── package.json                       # build: "prisma generate && next build"
```

---

## 🔑 Variables d'environnement (`.env`)

```env
# SerpAPI
SERPAPI_KEY=...

# Gmail
GMAIL_USER=...
GMAIL_APP_PASSWORD=...
CONTACT_PRENOM=Téo
CONTACT_NOM=Mikulic
CONTACT_TEL=06 18 14 62 83

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_ID_PRO=price_...            # Plan Pro 19€/mois
STRIPE_PRICE_ID_AGENCY=price_...         # Plan Agence 49€/mois
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Clerk — Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app

# App URL (localhost en dev, URL Vercel en prod)
NEXT_PUBLIC_APP_URL=https://prospeo-six.vercel.app

# Neon — PostgreSQL
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...              # Même URL que DATABASE_URL (Neon sans pooler séparé)

# Plans & Admin
CRON_SECRET=...                          # Secret pour le cron Vercel (/api/cron/auto-scrape)
TRIAL_INVITE_CODES=FORMATION2025         # Codes trial (virgule-séparés)
TRIAL_DURATION_DAYS=7                    # Durée du trial en jours
ADMIN_USER_IDS=user_xxx,user_yyy         # IDs Clerk des admins (séparés par virgule)
```

---

## 🗂️ Modèle de données Prisma

### `Lead`
Chaque lead appartient à un `user_id` Clerk — isolation totale entre comptes.
Déduplication : `nom|telephone` (lowercase) par user.

```typescript
// Champs CRM
nom, metier, telephone, site, emplacement, pays
tag         // "non_appele" | "ne_repond_pas" | "interesse" | "rdv_pris" | "pas_interesse"
rappel      // YYYY-MM-DD ou ""
note        // texte libre
created_at  // YYYY-MM-DD — date d'ajout dans le CRM
contacted_at // YYYY-MM-DD — date du 1er vrai contact (tag quitte non_appele)

// Formulaire client (champs ads_* — nom interne historique conservé)
ads_prenom, ads_nomclient, ads_entreprise, ads_tel, ads_email,
ads_zone, ads_rayon, ads_statut, ads_budget, ads_type,
ads_services (Json → string[]), ads_notes

// RDV
rdv_date, rdv_heure, rdv_statut, rdv_lieu, rdv_notes

// Journal d'activité (Json → Activity[])
activities  // type: "statut" | "email" | "note" | "appel"
```

### `AutoScrapeConfig`
```typescript
user_id, metier, ville, pays, nb_per_run (default 20), enabled
last_run_at, last_run_added  // stats dernière exécution
```

### `Subscription`
```typescript
user_id (unique), plan ("free"|"pro"|"agency")
stripe_customer_id, stripe_sub_id, stripe_status
current_period_end
scrape_count, scrape_reset_at  // compteur mensuel reset auto
trial_expires_at, trial_code_used  // trial par code d'invitation
```

---

## ✅ Fonctionnalités implémentées

### Auth (Clerk v7)
- Login/logout via Clerk (email, extensible Google/autres)
- `proxy.ts` = middleware — protège toutes les routes sauf landing + sign-in/up + webhooks
- `UserButton` en bas de sidebar
- Pages `/sign-in` et `/sign-up` dark theme custom

### Page Leads (`/app`)
- **Vue table OU kanban** (toggle, raccourci `K`) — kanban drag & drop natif entre colonnes de statut
- Table triable (nom, métier, emplacement, statut, rappel)
- Tag modifiable inline (popover sans ouvrir le drawer)
- **Log appel rapide** : 3 boutons au hover sur chaque ligne (📵 / ⭐ / ✗)
- **Sélection multiple + bulk actions** : changer le statut en masse, suppression groupée (barre flottante)
- **Mode Session d'appels** (feature signature) : plein écran portal, enchaîne les non-appelés, numéro géant cliquable (tel: + WhatsApp), script Cold Call avec variables remplacées, 4 résultats, raccourcis `1-4`/`S`/`Échap`, stats live + écran de bilan
- **Raccourcis clavier** : `K` (kanban), `/` (focus recherche), `Échap` (fermer/vider)
- Rappels en retard surlignés + badge pulsé dans la sidebar, filtre "Rappels" dédié
- Barre de stats (total, rappels dus, intéressés, RDV pris, RDV du jour, taux contact)
- Scraping Google Maps direct (quota 3/mois en free), Import/Export CSV (Pro+), enrichissement batch, lien "Trouver"
- **Skeleton de chargement** animé
- **Relances multi-paliers** : passage en `ne_repond_pas` → rappel auto escaladé (J+3 → J+7 → J+15)
- **Drawer lead** : 3 onglets (Suivi / Formulaire client / RDV)
  - Journal d'activité avec timeline (statuts, emails, notes, appels)
  - Ajout note manuelle + **dictée vocale** (Web Speech API fr-FR)
  - EmailPanel : 3 templates, champ email, envoi + log automatique (Pro+)
  - Onglet RDV : boutons raccourcis "Confirmer RDV" / "Rappel J-1"
  - Bouton WhatsApp direct
  - **Save optimisé** : l'API retourne le lead mis à jour (pas de re-fetch global)

### Palette de commandes (`Cmd/Ctrl+K`) — globale
- Navigation rapide entre pages + recherche de leads, navigation clavier complète

### Page Dashboard (`/app/dashboard`) — Pro+
- Sélecteur de période : aujourd'hui / 7j / 30j + **export CSV du bilan**
- 4 KPI cards (contactés, ajoutés, RDV à venir, rappels en retard) avec gradient et SVG icons
- Graphique barres 30j SVG (violet = contactés, cyan = ajoutés, fonds weekend)
- **Funnel de conversion** : taux calculés sur les *vrais échanges* (décrochage / intérêt / closing RDV)
- **Calendrier mensuel des RDV** (pastilles colorées par statut, clic → détail du jour)
- Liste des RDV à venir + contacts récents (cliquables → page leads)
- Plan free → overlay `UpgradeGate`

### Page INPI (`/app/inpi`) — Pro+
- Recherche par mot-clé, département, code NAF, ancienneté max (1-10 ans)
- Filtre "Jeunes entreprises" (< 3/6/12/24 mois) — tri par date de création desc
- Filtre "Artisans seulement" (Registre des Métiers)
- Table avec checkbox globale, SIREN, dirigeant, forme juridique, badge RM étoile, code postal
- Sélection multiple + import en masse → auto-enrichissement immédiat via Google Maps
- Plan free → page de verrouillage dédiée

### Page Scripts (`/app/scripts`) — Pro+
- **Cold Call** : défilement téléprompter, grand texte
- **Closing Google Ads** : navigation par étapes, objections pliables
- CRUD scripts (ajout, édition, export/import JSON, suppression)
- Toggle "Mindset" global (masqué par défaut)
- Plan free → overlay `UpgradeGate`

### Page Auto-Scrape (`/app/auto-scrape`)
- Configs de scraping quotidien (métier + ville + nb_per_run)
- Toggle actif/inactif par config
- Bouton "Lancer maintenant" (appelle `/api/auto-scrape/run` via Clerk, sécurisé sans exposer CRON_SECRET)
- Stats dernière exécution (date + nb leads ajoutés)
- Cron Vercel : `0 7 * * *` UTC (8h Paris) → `/api/cron/auto-scrape` (Bearer CRON_SECRET)

### Page Admin (`/app/admin`) — ADMIN_USER_IDS uniquement
- Tableau tous les users (info Clerk + plan + leads + activités)
- Changer le plan d'un user (free/pro/agency)
- Reset password (Clerk)
- Supprimer un user (Clerk + Prisma)
- Modal de confirmation avant action destructive

### Système de plans (Free / Pro / Agence)
| Feature | Free | Pro | Agence |
|---|:---:|:---:|:---:|
| Leads max | 100 | Illimité | Illimité |
| Scraping Google Maps | 3/mois | Illimité | Illimité |
| Import/Export CSV | ✗ | ✓ | ✓ |
| Recherche INPI | ✗ | ✓ | ✓ |
| Envoi d'emails | ✗ | ✓ | ✓ |
| Dashboard analytics | ✗ | ✓ | ✓ |
| Scripts téléprompter | ✗ | ✓ | ✓ |
| Formulaire client | ✗ | ✓ | ✓ |
| Prix | 0€ | 19€/mois | 49€/mois |

- **`lib/plan.ts`** : `PLAN_LIMITS`, `getUserPlan()`, `checkAndIncrementScrape()` (reset mensuel auto), `getScrapeUsage()`
- **`/api/plan`** : retourne plan + limites + quota scraping (fallback free si erreur DB)
- **`hooks/usePlan.ts`** : cache 5min sessionStorage, `refresh()` après activation trial
- **`UpgradeGate`** : overlay blur + CTA, ou page dédiée selon le contexte
- **Guards API** : scrape (quota), email, inpi, import CSV → `403 { error: "upgrade_required" }`
- **Trial** : code invitation `FORMATION2025` → `N` jours Pro (configurable via `.env`)

### Stripe — Lifecycle complet
- `POST /api/checkout` : session Stripe avec `metadata: { userId, plan }`
- `POST /api/webhook` : 3 événements gérés :
  - `checkout.session.completed` → upsert Subscription actif
  - `customer.subscription.updated` → update statut + période
  - `customer.subscription.deleted` → retour plan free

### Landing page (`/`) — publique
- **Bandeau early adopter** : barre fixe violet, dismissable, persisté localStorage
- Hero avec démo animée 5 scènes en autoplay (`AnimatedDemo`)
- Compteurs animés au scroll, section "Pourquoi", feature cards, comparatif, timeline, témoignage
- Pricing 0€ / 19€ / 49€ → Stripe checkout
- **Sticky CTA** bas de page après 400px scroll
- Effet curseur lumineux (orbe violet 600px rAF 6%)

### Emails (3 templates)
- `offre` : présentation semaine test + preuve sociale + aperçu site
- `rdv_confirmation` : bloc date/heure dark + boutons email + SMS
- `rdv_rappel` : bloc heure + boutons email + SMS

### Design system (cohérent sur toute l'app)
- Background `#080b12`, drawer `#090c14`, panels `#0e1118`
- Accents violet `#7c3aed` + cyan `#06b6d4`, toujours dual-tone
- Tous les chiffres/codes en `font-mono`
- Kicker pattern : dot coloré + label monospace uppercase 10px
- SVG icons partout (pas d'emoji dans l'UI)
- Gradients subtils `from-X/[0.04] to-transparent` sur les panels
- Borders `border-white/[0.05-0.08]`, glow sur les éléments actifs

---

## 🔌 Intégrations actives

### Clerk v7
- `clerkMiddleware` + `createRouteMatcher` dans `proxy.ts`
- `auth()` dans toutes les routes API → `userId` isolé par user
- `ClerkProvider` + `frFR` dans `app/layout.tsx`

### Prisma v7 + Neon
- Schema sans `url=` dans datasource — config dans `prisma.config.ts`
- Client via `@prisma/adapter-pg` (obligatoire pour engine type "client")
- Singleton dans `lib/prisma.ts` (hot-reload safe)
- Commandes :
  - `npx prisma generate` — régénère le client après modif du schema
  - `npx prisma migrate dev --name xxx` — crée une migration
  - `npx tsx scripts/migrate-json-to-db.ts <userId>` — migration one-shot JSON → DB

### SerpAPI — Google Maps
- Scraping : `POST /api/scrape` — métier + ville
- Enrichissement : `POST /api/enrich` — trouve tel + site pour leads sans numéro
- `engine: google_maps`, `hl: fr`, pause 200ms entre requêtes

### API RNE (INPI)
- Endpoint : `https://recherche-entreprises.api.gouv.fr/search`
- Params valides : `q`, `per_page` (max **25**), `page`, `departement`, `activite_principale`
- ⚠️ `etat_administratif` et `date_creation_min` sont invalides — filtrage côté serveur uniquement
- Pagination : MAX_API_ROUNDS=6 rounds pour remplir 25 résultats filtrés

### Stripe v22
- `lib/stripe.ts` : export `stripe` (null si clé manquante → pas de crash)
- Price IDs lus depuis env : `STRIPE_PRICE_ID_PRO`, `STRIPE_PRICE_ID_AGENCY`

---

## 📐 Règles de développement

### Principes généraux
- **Toujours demander confirmation** avant de supprimer un fichier ou une fonctionnalité
- **Travailler étape par étape** : audit → plan → validation → exécution
- **Ne jamais casser l'existant** sans avoir une version de remplacement fonctionnelle
- Commenter le code en **français**
- Nommer les variables et fonctions en **anglais** (convention JS/TS universelle)

### Qualité de code
- Composants **réutilisables** dès que quelque chose apparaît 2 fois
- **Pas de duplication** : `TAG_OPTIONS`, `TAG_LABEL` définis dans `types.ts` seulement
- Gestion des erreurs **toujours présente** (try/catch, états d'erreur UI)
- Variables d'environnement dans `.env`, jamais de secrets dans le code
- Pas de `console.log` laissés (sauf préfixés `[MODULE]` dans les routes API)

### Prisma v7 — points d'attention
- Le champ `activities` (Json) se cast en `unknown as Activity[]` pour la lecture
- Pour l'écriture vers Prisma : `activities as unknown as never`
- `scripts/` et `lib/prisma.ts` exclus du tsconfig (pas de check TS — Prisma v7 non généré = erreur)
- Après toute modif du schema → `npx prisma generate` + `npx prisma migrate dev`

### Design — règles à respecter
- Background pages : `bg-[#080b12]` (jamais de blanc ou gris clair)
- Headers de page : `bg-[#080b12]/70 backdrop-blur-md border-b border-white/[0.05]`
- Trait lumineux en haut de page : `h-px bg-gradient-to-r from-transparent via-violet-500/25 to-transparent`
- Bouton primaire violet : `bg-violet-600 hover:bg-violet-500 shadow-[0_0_16px_rgba(124,58,237,0.2)]`
- Section kicker : `<div class="w-1.5 h-1.5 rounded-full bg-X-400" />` + `text-[10px] font-mono tracking-widest uppercase`
- Toujours SVG icons, jamais emoji dans l'UI CRM

---

## 🚫 Ce qu'on ne fait PAS

- Pas de jQuery
- Pas de CSS inline sauf exception justifiée
- Pas de commits sans message clair
- Pas de suppression de fichier sans audit préalable
- Ne pas ajouter `etat_administratif` ou `date_creation_min` à l'API RNE (paramètres invalides)
- Ne pas toucher à `data/artisans.json` — backup exclu du git, données dans Neon
- Ne pas mettre `url=` dans `prisma/schema.prisma` (Prisma v7 — se fait dans `prisma.config.ts`)
- Ne pas renommer `proxy.ts` en `middleware.ts` (convention Next.js 16 — les deux fonctionnent mais proxy.ts est utilisé)

---

## 📋 Workflow de session Claude Code

1. **Début de session** : lire ce fichier pour reprendre le contexte exact
2. **Avant toute action destructive** : présenter ce qui sera supprimé/modifié et attendre validation
3. **Après chaque feature** : `npx tsc --noEmit` + résumé
4. **Fin de session** : mettre à jour ce fichier + `git push prospeo main`

## 📝 Suivi des modifications — UPDATE.md

**`UPDATE.md`** est le fichier de suivi vivant du projet. Il doit être mis à jour **à chaque requête** :
- ✅ Cocher une tâche quand elle est accomplie (statut → `✅ Fait` + date)
- ➕ Ajouter une ligne dans "Historique des modifications" pour chaque changement effectué
- ➕ Ajouter une nouvelle tâche si un besoin est identifié en cours de session
- La priorité P1/P2/P3 peut évoluer selon les décisions prises

Voir : [`UPDATE.md`](./UPDATE.md)

---

## 🗺️ Roadmap

### Phase 1 — Migration & CRM de base ✅ TERMINÉ
- [x] Migration Express → Next.js 16 + TypeScript + Tailwind
- [x] Gestion leads CRUD complet
- [x] Scraping Google Maps (SerpAPI)
- [x] Import/export CSV
- [x] Système de rappels / relances
- [x] Filtres et recherche
- [x] Enrichissement automatique (leads sans téléphone)

### Phase 2 — Sources de leads qualifiés ✅ TERMINÉ
- [x] Intégration API RNE (INPI) avec filtres avancés
- [x] Import INPI → CRM avec auto-enrichissement
- [x] Scripts d'appel (téléprompter, cold call + closing Google Ads)
- [x] Lien "Trouver" pour leads sans numéro

### Phase 3 — Productivité & UX ✅ TERMINÉ
- [x] Dashboard avec graphiques et métriques réelles
- [x] Journal d'activité par lead (timeline)
- [x] Envoi email depuis le drawer (3 templates)
- [x] Boutons SMS/appel dans les emails
- [x] Rappel automatique J+3 sur passage en "Ne répond pas"

### Phase 4 — SaaS ✅ TERMINÉ
- [x] Auth Clerk multi-utilisateurs
- [x] Migration PostgreSQL (Prisma v7 + Neon)
- [x] Plans d'abonnement Stripe (checkout + webhook lifecycle complet)
- [x] Landing page publique enrichie (démo animée 5 scènes, comparatif, timeline, sticky CTA)
- [x] Système de plans Free/Pro/Agence — gates API + UI (UpgradeGate + pages dédiées)
- [x] Trial par code d'invitation (FORMATION2025, 7 jours configurables)
- [x] Dashboard admin (/app/admin) : gestion users, plan, reset password, suppression
- [x] Page 404 custom dark theme
- [x] Modal onboarding 4 étapes au 1er login
- [x] Scripts d'appel CRUD avec localStorage + import/export JSON
- [x] **Déploiement Vercel** (prospeo-six.vercel.app, repo middlekick/prospeo)
- [x] Auto-scraping quotidien (Vercel Cron 8h) + run manuel sécurisé Clerk

### Phase 4.5 — UX premium ✅ TERMINÉ
- [x] Système de toasts (remplace tous les `alert()`)
- [x] Vue Kanban avec drag & drop natif
- [x] Mode Session d'appels plein écran + stats live (feature signature)
- [x] Sélection multiple + bulk actions (tag/suppression en masse)
- [x] Log appel rapide au hover sur les lignes
- [x] Palette de commandes Cmd+K (navigation + recherche globale)
- [x] Calendrier mensuel des RDV dans le dashboard
- [x] Notes vocales (Web Speech API)
- [x] Relances multi-paliers (J+3 → J+7 → J+15)
- [x] Skeletons de chargement + raccourcis clavier
- [x] Fix funnel conversion (taux sur vrais échanges)
- [x] Perf : save API retourne le lead (pas de re-fetch global)

### Phase 4.6 — Design system cohérent ✅ TERMINÉ
- [x] Refonte design complète — `#080b12` base, dual accent violet+cyan, DM Mono data
- [x] Sidebar redesignée — SVG icons, keyboard hints ⌘1-5, Cmd+K button, plan badge avec glow
- [x] StatsBar — `StatCard` avec SVG icons, accent par métrique, état actif coloré
- [x] FilterPills — couleur par statut, font-mono counter, pulse dot rappels
- [x] Header pages — gradient top, `backdrop-blur-md`, chips de capacités
- [x] Dashboard — 4 panels gradient kicker (chart, funnel, RDV, contacts récents)
- [x] Scripts — ScriptCard gradient dual-tone, badges type, SVG actions
- [x] Auto-scrape — banner info emerald, config cards gradient, toggle glow
- [x] INPI — formulaire SVG icons, table redesignée (checkbox globale, badge RM étoile, code postal), états vide/loading stylisés
- [x] LeadDrawer — overlay blur, onglets gradient underline, footer glow save

### Phase 5 — Post-lancement (à faire)
- [ ] **Stripe en prod** : créer les produits sur dashboard.stripe.com, copier les Price IDs dans Vercel env vars
- [ ] **Test end-to-end Stripe** : checkout → webhook → upgrade plan en base
- [ ] **Vérification Vercel env vars** : `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`, `NEXT_PUBLIC_APP_URL` à jour
- [ ] PWA installable (prospecter depuis mobile)
- [ ] Détection doublons fuzzy à l'import CSV
- [ ] Onboarding interactif (tour guidé in-app)
- [ ] Tags personnalisables par user
- [ ] Notifications rappels in-app (badge + son)
- [ ] Import LinkedIn (CSV Sales Navigator)
- [ ] Stratégie acquisition : LinkedIn content + prospection directe freelances commerciaux
- [ ] API publique pour intégrations tierces
