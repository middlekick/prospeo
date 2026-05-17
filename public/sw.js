// Service Worker Prospeo — minimal, conservateur (CRM = données live)
// Objectif : rendre l'app installable (PWA) SANS servir de données périmées.

const CACHE = "prospeo-static-v2";

// Page de repli hors-ligne (inline — pas de précache d'HTML Next à hash variable)
const OFFLINE_HTML = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hors ligne — Prospeo</title>
<style>html,body{margin:0;height:100%;background:#0b0d12;color:#e2e8f0;
font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center}
.b{text-align:center;padding:32px}.d{width:10px;height:10px;border-radius:50%;
background:#00E5FF;display:inline-block;margin-bottom:20px;box-shadow:0 0 16px #00E5FF}
h1{font-size:20px;margin:0 0 8px}p{color:#94a3b8;font-size:14px;margin:0 0 24px}
button{background:#00E5FF;color:#0b0d12;border:0;border-radius:10px;padding:12px 20px;
font-size:14px;font-weight:600;cursor:pointer}</style></head>
<body><div class="b"><span class="d"></span><h1>Connexion perdue</h1>
<p>Prospeo a besoin du réseau pour charger cette page.</p>
<button onclick="location.reload()">Réessayer</button></div></body></html>`;

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
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        // Navigation sans cache → page de repli hors-ligne brandée
        if (request.mode === "navigate") {
          return new Response(OFFLINE_HTML, {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        }
        return Response.error();
      })
  );
});
