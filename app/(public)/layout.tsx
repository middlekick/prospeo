/**
 * app/(public)/layout.tsx
 * Layout du groupe public : landing "/" (+ ancienne URL /landing).
 * Aucun import Clerk ni LayoutShell/Sidebar → clerk-js totalement absent
 * du bundle de la landing. Reprend juste le rideau de transition + <main>.
 */

import { Curtain, PageFade } from "@/components/ui/PageTransition";

export default function PublicGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Curtain />
      <main>
        <PageFade>{children}</PageFade>
      </main>
    </>
  );
}
