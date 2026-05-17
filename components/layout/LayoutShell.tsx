"use client";

/**
 * components/layout/LayoutShell.tsx
 * Affiche la Sidebar + CommandPalette UNIQUEMENT sur les routes du CRM (/app/*).
 * Les routes publiques (landing "/", /sign-in, /sign-up, 404) sont rendues nues.
 * Fond sombre unifiÃ© + orbe violet ambiant cÃ´tÃ© app.
 */

import { usePathname }  from "next/navigation";
import Sidebar          from "./Sidebar";
import CommandPalette   from "@/components/ui/CommandPalette";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Le CRM vit sous /app â€” partout ailleurs (landing, auth) : pas de chrome app
  const isApp = pathname === "/app" || pathname.startsWith("/app/");

  if (!isApp) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Fond de base unifiÃ© */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-[#080b12]" />

      {/* Orbe violet ambiant */}
      <div
        aria-hidden
        className="pointer-events-none fixed -top-[10%] left-[30%] z-0 w-[800px] h-[500px] rounded-full blur-[200px]"
        style={{ background: "radial-gradient(ellipse, rgba(0,229,255,0.07) 0%, transparent 70%)" }}
      />

      <Sidebar />
      <main className="relative z-10 md:ml-[220px] min-h-screen bg-[#0b0d14]">{children}</main>
      <CommandPalette />
    </>
  );
}

