import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider }  from "@clerk/nextjs";
import { frFR }           from "@clerk/localizations";
import LayoutShell        from "@/components/layout/LayoutShell";
import { ToastProvider }  from "@/components/ui/Toast";
import { ConfirmProvider } from "@/components/ui/ConfirmModal";

export const metadata: Metadata = {
  title: "Prospeo — CRM",
  description: "CRM de prospection commerciale",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider localization={frFR}>
      <html lang="fr">
        <body className="bg-[#0b0d12]">
          <ToastProvider>
            <ConfirmProvider>
              <LayoutShell>{children}</LayoutShell>
            </ConfirmProvider>
          </ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
