# Prospeo — CRM de prospection commerciale

Prospeo est un CRM SaaS pensé pour les commerciaux indépendants et freelances qui prospectent des artisans et TPE locales. Il centralise le sourcing de leads, le suivi des appels, les scripts téléprompter et l'envoi d'emails — en un seul endroit.

---

## Fonctionnalités

- **Scraping Google Maps** — trouve des leads par métier et ville via SerpAPI
- **Auto-scraping quotidien** — cron Vercel qui alimente le CRM automatiquement chaque matin
- **Recherche INPI / RNE** — entreprises récentes avec filtres (département, NAF, artisans)
- **CRM complet** — tags, rappels, journal d'activité, RDV, notes
- **Scripts d'appel** — téléprompter Cold Call & Closing interactif
- **Envoi d'emails** — 3 templates (offre, confirmation RDV, rappel RDV) via Gmail
- **Dashboard** — métriques, funnel de conversion, graphique 30j
- **Import / Export CSV** — avec auto-détection des colonnes
- **Plans Free / Pro / Agence** — gates API + UI, abonnements Stripe
- **Auth multi-utilisateurs** — Clerk

## Stack

| Couche | Techno |
|---|---|
| Framework | Next.js 16 — App Router |
| Langage | TypeScript strict |
| Styling | Tailwind CSS v4 |
| Auth | Clerk |
| Base de données | PostgreSQL — Neon via Prisma v7 |
| Scraping | SerpAPI — Google Maps |
| Recherche entreprises | API publique RNE |
| Email | Nodemailer — Gmail |
| Paiements | Stripe |
| Déploiement | Vercel |

## Lancement local

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Copie `.env.example` en `.env` et remplis les variables (Clerk, Neon, SerpAPI, Stripe, Gmail).

## Déploiement

Déploiement sur Vercel. Le fichier `vercel.json` configure le cron d'auto-scraping (`0 7 * * *`) et les timeouts des routes longues.
