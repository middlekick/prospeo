import type { MetadataRoute } from "next";

// Web App Manifest — rend Prospeo installable en PWA (mobile + desktop)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             "Prospeo — CRM de prospection",
    short_name:       "Prospeo",
    description:      "CRM de prospection commerciale : sourcing, suivi d'appels, RDV, relances.",
    start_url:        "/",
    display:          "standalone",
    background_color: "#0b0d12",
    theme_color:      "#7c3aed",
    orientation:      "portrait-primary",
    lang:             "fr",
    categories:       ["business", "productivity"],
    icons: [
      {
        src:     "/icon.svg",
        sizes:   "any",
        type:    "image/svg+xml",
        purpose: "any",
      },
      {
        src:     "/icon-maskable.svg",
        sizes:   "any",
        type:    "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
