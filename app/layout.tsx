import type { Metadata, Viewport } from "next";
import { syne, dmMono }            from "./fonts/fonts";
import "./globals.css";
import { ClerkProvider }        from "@clerk/nextjs";
import { frFR }                 from "@clerk/localizations";
import LayoutShell              from "@/components/layout/LayoutShell";
import { ToastProvider }        from "@/components/ui/Toast";
import { ConfirmProvider }      from "@/components/ui/ConfirmModal";
import ServiceWorker            from "@/components/layout/ServiceWorker";
import SmoothScrollProvider     from "@/components/ui/SmoothScrollProvider";

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
    <ClerkProvider
      localization={frFR}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/app"
      signUpFallbackRedirectUrl="/app"
    >
      <html lang="fr" className={`${syne.variable} ${dmMono.variable}`}>
        <body className="bg-[#0A0A0B]">
          <SmoothScrollProvider>
            <ToastProvider>
              <ConfirmProvider>
                <LayoutShell>{children}</LayoutShell>
              </ConfirmProvider>
            </ToastProvider>
          </SmoothScrollProvider>
          <ServiceWorker />
        </body>
      </html>
    </ClerkProvider>
  );
}
