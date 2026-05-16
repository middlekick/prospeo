---
name: Landing page — état et améliorations
description: Ce qui a été fait sur la landing page Prospeo (composants, sections, design)
type: project
---

La landing page (`app/landing/page.tsx`) a été largement enrichie.

**Why:** Préparer le lancement SaaS et attirer les commerciaux/freelances qui prospectent des artisans.

**État actuel :**
- Hero : démo animée 3 scènes (Scraping → INPI → Scripts) en autoplay, composant `AnimatedDemo` dans `components/landing/AnimatedDemo.tsx`
- Stats hero : 50+ / 100% / 14j / 0€ avec compteurs animés au scroll (composant `AnimatedCounter`)
- Bandeau early adopter : barre fixe violet au sommet, dismissable + localStorage
- Navbar : se décale sous le bandeau automatiquement
- Sticky CTA : barre flottante bas de page après 400px de scroll
- Tableau comparatif : Prospeo vs Excel vs HubSpot (8 critères)
- Timeline "Comment ça marche" : ligne verticale gradient, 3 étapes colorées
- Feature cards : micro-animations hover sur les icônes

**How to apply:** Toute nouvelle section landing doit respecter le dark theme `bg-[#0b0d12]`, les composants `Badge`, `G`, `FCard` existants, et le système `data-reveal` pour les animations au scroll.
