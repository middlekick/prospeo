import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider }  from "@clerk/nextjs";
import { frFR }           from "@clerk/localizations";
import LayoutShell        from "@/components/layout/LayoutShell";

export const metadata: Metadata = {
  title: "Prospeo — CRM",
  description: "CRM de prospection commerciale",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider localization={frFR}>
      <html lang="fr">
        <body className="bg-[#0b0d12]">
          <LayoutShell>{children}</LayoutShell>
        </body>
      </html>
    </ClerkProvider>
  );
}
