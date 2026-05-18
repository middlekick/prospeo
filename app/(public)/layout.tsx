/**
 * app/(public)/layout.tsx
 * Layout du groupe public : landing "/" (+ ancienne URL /landing).
 * Aucun import Clerk ni LayoutShell/Sidebar → clerk-js totalement absent
 * du bundle de la landing. Smooth scroll (Lenis) ici UNIQUEMENT — le CRM
 * garde le scroll natif (Lenis casse les conteneurs overflow-auto).
 */

import { Curtain, PageFade } from "@/components/ui/PageTransition";
import SmoothScrollProvider  from "@/components/ui/SmoothScrollProvider";

export default function PublicGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScrollProvider>
      <Curtain />
      <main>
        <PageFade>{children}</PageFade>
      </main>
    </SmoothScrollProvider>
  );
}
