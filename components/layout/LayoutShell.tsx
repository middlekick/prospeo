"use client";

/**
 * components/layout/LayoutShell.tsx
 * Wrapper client — masque la Sidebar sur les routes publiques (/landing, /sign-in…).
 * Fond sombre unifié + orbe violet ambiant.
 */

import { usePathname } from "next/navigation";
import Sidebar         from "./Sidebar";

const NO_SIDEBAR_ROUTES = ["/landing", "/sign-in", "/sign-up"];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = NO_SIDEBAR_ROUTES.some(r => pathname.startsWith(r));

  if (hideSidebar) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Orbe violet ambiant en haut de page */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 z-0
                   w-[900px] h-[300px] rounded-full blur-[180px] opacity-[0.05]"
        style={{ background: "radial-gradient(ellipse, #7c3aed 0%, transparent 70%)" }}
      />

      <Sidebar />
      <main className="relative z-10 ml-[220px] min-h-screen">{children}</main>
    </>
  );
}
