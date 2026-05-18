/**
 * app/(app)/layout.tsx
 * Layout du groupe authentifié : CRM (/app/**), /sign-in, /sign-up.
 * Porte ClerkProvider + le chrome LayoutShell — clerk-js n'est donc chargé
 * QUE pour ces routes, jamais pour la landing publique.
 * (Les route groups n'affectent pas les URLs.)
 */

import { ClerkProvider } from "@clerk/nextjs";
import { frFR }          from "@clerk/localizations";
import LayoutShell       from "@/components/layout/LayoutShell";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      localization={frFR}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/app"
      signUpFallbackRedirectUrl="/app"
    >
      <LayoutShell>{children}</LayoutShell>
    </ClerkProvider>
  );
}
