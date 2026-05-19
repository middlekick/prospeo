/**
 * app/opengraph-image.tsx
 * Image Open Graph dynamique (1200×630) générée à la volée par next/og.
 * Convention App Router : sert d'og:image / twitter:image par défaut pour
 * tout le site (aperçu lors des partages LinkedIn, X, etc.).
 */

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Prospeo — CRM de prospection";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "90px",
          background:
            "radial-gradient(900px 500px at 75% 0%, rgba(0,229,255,0.18), transparent 60%), #0a0d12",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo + nom */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 48 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg,#1ae9ff,#0090b3)",
              color: "#06121a",
              fontSize: 38,
              fontWeight: 800,
            }}
          >
            P
          </div>
          <span style={{ color: "#e2e8f0", fontSize: 30, fontWeight: 700 }}>Prospeo</span>
        </div>

        {/* Claim */}
        <div style={{ display: "flex", fontSize: 84, fontWeight: 800, lineHeight: 1.05 }}>
          <span style={{ color: "#f8fafc" }}>Trouve. Appelle.&nbsp;</span>
          <span style={{ color: "#1ae9ff" }}>Signe.</span>
        </div>

        <div style={{ color: "#94a3b8", fontSize: 30, marginTop: 32, maxWidth: 900 }}>
          Le CRM qui réunit sourcing, appels, relances et RDV — pour les
          commerciaux qui prospectent.
        </div>

        {/* Pied */}
        <div style={{ color: "#475569", fontSize: 22, marginTop: 56, display: "flex" }}>
          prospeo-six.vercel.app
        </div>
      </div>
    ),
    { ...size },
  );
}
