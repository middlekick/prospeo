"use client";

import { useEffect } from "react";

// Enregistre le service worker pour rendre Prospeo installable (PWA)
export default function ServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Enregistrement après le chargement complet (ne ralentit pas le 1er rendu)
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* échec silencieux — la PWA reste fonctionnelle sans cache offline */
      });
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
