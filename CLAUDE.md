# CLAUDE.md — Prospeo CRM

> Ce fichier est lu automatiquement par Claude Code à chaque session.
> Il contient tout le contexte du projet. Ne jamais le supprimer ni l'alléger.

---

## 🧠 Contexte du projet

**Prospeo** est un CRM de prospection commerciale développé et utilisé par **Téo Mikulic**.

### Cible principale du SaaS
**Commerciaux indépendants, freelances en acquisition, et petites agences** qui prospectent des artisans et TPE locales (plombiers, électriciens, paysagistes, peintres…). Ils ont besoin de sourcer des leads, suivre leurs appels, gérer leurs RDV et relances — le tout centralisé. Prospeo est le seul outil qui intègre le sourcing (Google Maps + INPI) **et** le suivi CRM en un seul endroit.

### Activité personnelle de Téo (parenthèse sur la landing)
- Acquisition client pour **artisans français** via **campagnes Google Ads locales**, semaine de test offerte
  - Le prospect paie uniquement le budget Google (~100€/semaine, 10-15€/jour) **directement à Google**
  - Téo ne se facture rien sur la semaine de test — il se rémunère sur les mois suivants
- **Preuve sociale clé** : un paysagiste a généré 12 000€ de CA sur la semaine de test,
  puis 150 000€ de CA sur 3 mois pour 3 000€ de budget Google total
- Cette activité est présentée dans une section dédiée de la landing — elle est **secondaire** par rapport au SaaS

### Objectif du CRM
Centraliser la prospection : sourcing de leads (Google Maps + INPI), suivi des appels,
gestion des RDV, scripts d'appel, relances automatiques, journal d'activité — le tout sur une interface unique.

### Vision long terme
- SaaS multi-utilisateurs avec abonnements Stripe ✅ **système de plans complet**
- Auth Clerk déjà en place
- DB PostgreSQL (Neon) déjà en place
- Déploiement Vercel ← **en cours** (git initialisé, 3 commits, repo GitHub à créer)

---

## 🏗️ Stack technique — État ACTUEL

| Couche | Technologie |
|---|---|
| Framework | **Next.js 16** — App Router |
| Langage | **TypeScript** strict |
| Styling | **Tailwind CSS v4** + fontes Syne / DM Mono |
| Auth | **Clerk** (`@clerk/nextjs`) — frFR localization, middleware actif |
| Base de données | **PostgreSQL** — Neon (cloud) via **Prisma v7** + adapter `@prisma/adapter-pg` |
| ORM | **Prisma v7** — schema dans `prisma/schema.prisma`, config dans `prisma.config.ts` |
| Scraping leads | **SerpAPI** — Google Maps (`engine: google_maps`) |
| Recherche entreprises | **API publique RNE** — `recherche-entreprises.api.gouv.fr` |
| Email | **Nodemailer** — transport Gmail (3 templates HTML redesignés) |
| Paiements | **Stripe** — route checkout + webhook prêts |
| Déploiement | Local — git initialisé, prêt pour Vercel |

---

## 📁 Structure réelle du projet

```
Prospeo/
├── app/
│   ├── page.tsx                       # Page principale — gestion des leads
│   ├── dashboard/page.tsx             # Dashboard métriques prospection
│   ├── inpi/page.tsx                  # Recherche INPI + import + auto-enrichissement
│   ├── scripts/page.tsx               # Scripts d'appel (téléprompter)
│   ├── landing/page.tsx               # Landing page publique (marketing SaaS)
│   ├── sign-in/[[...sign-in]]/page.tsx# Page login Clerk (dark theme)
│   ├── layout.tsx                     # Layout racine — ClerkProvider + Sidebar
│   ├── globals.css                    # Tailwind + fontes + scrollbar
│   └── api/
│       ├── leads/
│       │   ├── route.ts               # GET — leads de l'user connecté (Prisma)
│       │   ├── save/route.ts          # POST — update lead + log activité auto + rappel J+3
│       │   ├── import/route.ts        # POST — import en masse avec déduplication
│       │   ├── delete/route.ts        # POST — suppression par nom+telephone
│       │   └── activity/route.ts      # POST — ajout entrée manuelle au journal
│       ├── scrape/route.ts            # POST — scrape Google Maps via SerpAPI
│       ├── enrich/route.ts            # POST — enrichit les leads sans tel
│       ├── inpi/route.ts              # GET — recherche RNE avec filtres serveur
│       ├── email/route.ts             # POST — envoi email (3 templates) + log activité
│       ├── checkout/route.ts          # POST — création session Stripe
│       └── webhook/route.ts           # POST — webhook Stripe
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx                # Sidebar 220px — nav + plan badge + UserButton Clerk
│   │   └── LayoutShell.tsx            # Shell avec orbe violet + margin ml-[220px]
│   ├── leads/
│   │   ├── types.ts                   # re-export Lead + TAG_OPTIONS + TAG_LABEL + colors
│   │   ├── LeadsTable.tsx             # Table flexbox + tag inline + tri + lien "Trouver"
│   │   ├── LeadDrawer.tsx             # Drawer 480px — Suivi/Ads(gated)/RDV + EmailPanel + Journal
│   │   ├── FilterPills.tsx            # Filtres par statut + badge rappels pulsé
│   │   ├── StatsBar.tsx               # Stats globales (total, rappels, intéressés, RDV…)
│   │   ├── ScrapeForm.tsx             # Formulaire scraping + badge quota Free
│   │   ├── ImportCSV.tsx              # Modal import CSV avec preview 3 lignes
│   │   └── EnrichButton.tsx           # Enrichissement batch leads sans téléphone (Pro+ only)
│   ├── inpi/
│   │   └── INPISearch.tsx             # Formulaire + table INPI (depts, NAF, RM, pagination)
│   ├── landing/
│   │   └── AnimatedDemo.tsx           # Démo animée 3 scènes en autoplay (Scraping→INPI→Scripts)
│   └── ui/
│       ├── UpgradeGate.tsx            # Overlay 🔒 avec CTA vers /landing#pricing
│       ├── OnboardingModal.tsx        # Modal 4 étapes au 1er login (localStorage)
│       ├── TrialCodeModal.tsx         # Modal code d'invitation trial
│       └── ContactModal.tsx           # Modal contact (landing page)
├── hooks/
│   └── usePlan.ts                     # Hook plan — fetch /api/plan, cache 5min sessionStorage
├── lib/
│   ├── db.ts                          # Activity, Lead, fromPrisma, normalizeLead, leadKey
│   ├── plan.ts                        # PLAN_LIMITS, getUserPlan(), checkAndIncrementScrape()
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
├── middleware.ts                      # Clerk middleware — protège tout sauf /sign-in /sign-up /landing /api/webhook
├── vercel.json                        # Config Vercel (timeout 60s sur scrape/enrich/inpi)
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

# App URL (localhost en dev, URL Vercel en prod)
NEXT_PUBLIC_APP_URL=https://votre-projet.vercel.app

# Neon — PostgreSQL
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...              # Même URL que DATABASE_URL (Neon sans pooler séparé)

# Plans & Admin
TRIAL_INVITE_CODES=FORMATION2025         # Codes trial (virgule-séparés)
TRIAL_DURATION_DAYS=7                    # Durée du trial en jours
ADMIN_USER_IDS=user_xxx,user_yyy         # IDs Clerk des admins
```

---

## 🗂️ Modèle de données — `Lead` + `Activity`

Défini dans `lib/db.ts`, lu/écrit via Prisma.
Chaque lead appartient à un `user_id` Clerk — isolation totale entre comptes.
Déduplication : `nom|telephone` (lowercase) par user.

```typescript
// Journal d'activité (stocké en JSON dans la colonne `activities`)
interface Activity {
  id:      string;            // timestamp string
  date:    string;            // YYYY-MM-DDTHH:mm
  type:    "statut" | "email" | "note" | "appel";
  content: string;
  meta?:   string;            // ex: ancien tag, adresse email destinataire
}

// Champs CRM
nom, metier, telephone, site, emplacement, pays, tag, rappel, note
created_at    // YYYY-MM-DD — date d'ajout dans le CRM
contacted_at  // YYYY-MM-DD — date du 1er vrai contact (tag quitte non_appele)

// Suivi Google Ads
ads_prenom, ads_nomclient, ads_entreprise, ads_tel, ads_email,
ads_zone, ads_rayon, ads_statut, ads_budget, ads_type,
ads_services (string[]), ads_notes

// RDV
rdv_date, rdv_heure, rdv_statut, rdv_lieu, rdv_notes

// Journal
activities: Activity[]
```

Tags : `non_appele` | `ne_repond_pas` | `interesse` | `rdv_pris` | `pas_interesse`

---

## ✅ Fonctionnalités implémentées

### Auth (Clerk)
- Login/logout via Clerk (email, extensible Google/autres)
- Middleware protège toutes les routes sauf `/sign-in`, `/sign-up`, `/landing`
- `UserButton` en bas de sidebar
- Page `/sign-in` dark theme custom

### Page Leads (`/`)
- Table triable (nom, métier, emplacement, statut, rappel)
- Tag modifiable inline (popover sans ouvrir le drawer)
- Rappels en retard surlignés en jaune + badge pulsé dans la sidebar
- Filtre "Rappels" dédié
- Barre de stats (total, rappels dus, intéressés, RDV pris, RDV du jour, taux contact)
- Scraping Google Maps direct (formulaire en haut de page)
- Import CSV (modal, auto-détection colonnes et séparateur, preview 3 lignes)
- Export CSV
- Bouton enrichissement batch (leads sans téléphone → Google Maps)
- Lien "Trouver" (Google search) pour les leads sans téléphone
- **Rappel automatique J+3** : passage en `ne_repond_pas` → rappel créé automatiquement + log journal
- **Drawer lead** : 3 onglets (Suivi / Google Ads / RDV)
  - Journal d'activité avec timeline (statuts, emails, notes, appels)
  - Ajout note manuelle
  - EmailPanel : 3 templates, champ email, envoi + log automatique
  - Onglet RDV : boutons raccourcis "Confirmer RDV" / "Rappel J-1"
  - Bouton WhatsApp direct

### Page Dashboard (`/dashboard`)
- Sélecteur de période : aujourd'hui / 7j / 30j
- 4 KPI cards : contactés, ajoutés, RDV à venir, rappels en retard
- Graphique barres 30j SVG (violet = contactés, cyan = ajoutés, fonds weekend)
- Funnel de conversion avec barres en % et 3 taux
- Liste des RDV à venir (6 prochains)
- Liste des contacts récents (8 derniers)
- **Seules les actions réelles comptent** (`contacted_at` défini uniquement au 1er vrai contact)

### Page INPI (`/inpi`)
- Recherche par mot-clé, département, code NAF, ancienneté max (1-10 ans)
- Filtre "Artisans seulement" (inscrits au Registre des Métiers)
- Table avec SIREN, dirigeant, forme juridique, badge RM
- Sélection multiple + import en masse
- **Auto-enrichissement** : dès l'import, recherche automatique des numéros via Google Maps

### Page Scripts (`/scripts`)
- **Cold Call** : défilement linéaire téléprompter, grand texte
- **Closing Google Ads** : navigation par étapes, objections pliables
- Toggle "Mindset" global (masqué par défaut)

### Landing page (`/landing`) — publique
- Navbar fixe avec ancres — se décale sous le bandeau automatiquement
- **Bandeau early adopter** : barre fixe violet, dismissable, persisté localStorage
- Hero avec démo animée 3 scènes en autoplay (`AnimatedDemo`) :
  - Scène 1 : Scraping Google Maps (typing → leads → drawer → tag)
  - Scène 2 : Recherche INPI (typing → résultats → sélection → import)
  - Scène 3 : Téléprompter scripts (texte défile → objection slide-in)
- **Compteurs animés** au scroll : 50+ / 100% / 14j / 0€
- Section "Pourquoi" (avant/après/résultat)
- 6 feature cards avec **micro-animations hover** sur les icônes
- **Tableau comparatif** Prospeo vs Excel vs HubSpot (8 critères)
- Timeline animée "Comment ça marche" (3 étapes colorées, ligne gradient)
- Témoignage chiffré (12k€ / 150k€)
- Section artisans (mailto Téo)
- Pricing 0€ / 19€ / 49€ → Stripe checkout
- **Sticky CTA** : barre flottante bas de page après 400px de scroll
- Effet curseur lumineux (orbe violet 600px interpolé rAF 6%)
- Grille de fond subtile à 3% d'opacité

### Emails (3 templates)
- `offre` : présentation semaine test + preuve sociale + aperçu site
- `rdv_confirmation` : bloc date/heure dark + boutons email + SMS
- `rdv_rappel` : bloc heure + boutons email + SMS
- Bouton email → `mailto:GMAIL_USER`
- Bouton SMS → `sms:+33XXXXXXXXX` (normalisation auto depuis CONTACT_TEL)

---

## 🔌 Intégrations actives

### Clerk
- `clerkMiddleware` + `createRouteMatcher` dans `middleware.ts`
- `auth()` dans toutes les routes API → `userId` isolé par user
- `ClerkProvider` + `frFR` dans `app/layout.tsx`

### Prisma v7 + Neon
- Schema sans `url=` dans datasource (Prisma v7) — config dans `prisma.config.ts`
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

### WhatsApp
- `lib/phone.ts` : `toWhatsAppUrl()` — 06XXXXXXXX → `wa.me/336XXXXXXXX`

### Stripe
- Route `POST /api/checkout` — crée session Stripe subscription
- Route `POST /api/webhook` — webhook Stripe
- Activer : créer un produit sur dashboard.stripe.com → copier Price ID dans `.env`

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

---

## 🚫 Ce qu'on ne fait PAS

- Pas de jQuery
- Pas de CSS inline sauf exception justifiée
- Pas de commits sans message clair
- Pas de suppression de fichier sans audit préalable
- Ne pas ajouter `etat_administratif` ou `date_creation_min` à l'API RNE (paramètres invalides)
- Ne pas toucher à `data/artisans.json` — backup exclu du git, données dans Neon
- Ne pas mettre `url=` dans `prisma/schema.prisma` (Prisma v7 — se fait dans `prisma.config.ts`)

---

## 📋 Workflow de session Claude Code

1. **Début de session** : lire ce fichier pour reprendre le contexte exact
2. **Avant toute action destructive** : présenter ce qui sera supprimé/modifié et attendre validation
3. **Après chaque feature** : `npx tsc --noEmit` + résumé
4. **Fin de session** : mettre à jour ce fichier

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
- [x] Plans d'abonnement Stripe (routes checkout + webhook opérationnels)
- [x] Landing page publique enrichie (démo animée, comparatif, timeline, sticky CTA, bandeau)
- [x] Système de plans Free/Pro/Agence avec gates API + UI
- [x] Trial par code d'invitation (FORMATION2025, 7 jours)
- [x] Dashboard admin (/admin) : gestion users, plan, reset password, suppression
- [x] Page 404 custom dark theme
- [x] Modal onboarding 4 étapes au 1er login
- [x] Scripts d'appel CRUD avec localStorage + import/export JSON
- [x] Sidebar redesignée 220px avec labels + badge plan
- [ ] **Déploiement Vercel** ← prochaine étape (git initialisé, repo GitHub à créer, variables d'env prêtes)

### Phase 5 — Post-lancement
- [ ] Stratégie acquisition : LinkedIn content + prospection directe freelances commerciaux
- [ ] Tags personnalisables par user
- [ ] Notifications rappels in-app
- [ ] Import LinkedIn (CSV Sales Navigator)
- [ ] API publique pour intégrations tierces
