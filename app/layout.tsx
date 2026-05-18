import type { Metadata, Viewport } from "next";
import { syne, dmMono }            from "./fonts/fonts";
import "./globals.css";
import { ToastProvider }        from "@/components/ui/Toast";
import { ConfirmProvider }      from "@/components/ui/ConfirmModal";
import ServiceWorker            from "@/components/layout/ServiceWorker";

// ClerkProvider + chrome CRM scopés au groupe (app), Lenis (smooth scroll)
// scopé au groupe (public) — le CRM garde le scroll natif (sinon Lenis
// casse les conteneurs overflow-auto comme le tableau de leads).

export const metadata: Metadata = {
  title:       "Prospeo — CRM de prospection",
  description: "Le CRM qui réunit sourcing, appels, relances et RDV — pour les commerciaux qui prospectent.",
  manifest:    "/manifest.webmanifest",
  openGraph: {
    title:       "Prospeo — CRM de prospection",
    description: "Trouve. Appelle. Signe. Le CRM pensé pour le terrain.",
    type:        "website",
    locale:      "fr_FR",
  },
  appleWebApp: {
    capable:        true,
    title:          "Prospeo",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon:  "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor:   "#00E5FF",   // cyan électrique (brand)
  width:        "device-width",
  initialScale: 1,
  // Pas de maximumScale/userScalable : bloquer le zoom = échec a11y
  viewportFit:  "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${syne.variable} ${dmMono.variable}`}>
      <body className="bg-[#0A0A0B]">
        <ToastProvider>
          <ConfirmProvider>
            {children}
          </ConfirmProvider>
        </ToastProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
