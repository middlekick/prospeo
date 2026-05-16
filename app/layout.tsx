import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClerkProvider }  from "@clerk/nextjs";
import { frFR }           from "@clerk/localizations";
import LayoutShell        from "@/components/layout/LayoutShell";
import { ToastProvider }  from "@/components/ui/Toast";
import { ConfirmProvider } from "@/components/ui/ConfirmModal";
import ServiceWorker      from "@/components/layout/ServiceWorker";

export const metadata: Metadata = {
  title: "Prospeo — CRM",
  description: "CRM de prospection commerciale",
  manifest: "/manifest.webmanifest",
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
  themeColor:           "#7c3aed",
  width:                "device-width",
  initialScale:         1,
  maximumScale:         1,
  viewportFit:          "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      localization={frFR}
      signInFallbackRedirectUrl="/app"
      signUpFallbackRedirectUrl="/app"
    >
      <html lang="fr">
        <body className="bg-[#0b0d12]">
          <ToastProvider>
            <ConfirmProvider>
              <LayoutShell>{children}</LayoutShell>
            </ConfirmProvider>
          </ToastProvider>
          <ServiceWorker />
        </body>
      </html>
    </ClerkProvider>
  );
}
