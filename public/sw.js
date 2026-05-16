// Service Worker Prospeo — minimal, conservateur (CRM = données live)
// Objectif : rendre l'app installable (PWA) SANS servir de données périmées.

const CACHE = "prospeo-static-v1";

// Pré-cache des assets statiques uniquement (jamais l'API ni les pages HTML)
const STATIC_ASSETS = ["/icon.svg", "/icon-maskable.svg"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC_ASSETS)).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne JAMAIS mettre en cache : API, auth Clerk, requêtes non-GET, autres origines
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/sign-in") ||
    url.pathname.includes("clerk")
  ) {
    return; // laisse passer au réseau normalement
  }

  // Assets statiques connus → cache-first
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  // Tout le reste (pages, JS, CSS) → network-first, fallback cache si hors-ligne
  event.respondWith(
    fetch(request)
      .then((res) => {
        // Mettre en cache une copie des assets _next statiques
        if (url.pathname.startsWith("/_next/static/")) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});
