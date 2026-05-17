"use client";

import { useState, useEffect } from "react";
import Link            from "next/link";
import { usePathname } from "next/navigation";
import { UserButton }  from "@clerk/nextjs";
import { usePlan }     from "@/hooks/usePlan";
import TrialCodeModal  from "@/components/ui/TrialCodeModal";

// ── Icônes SVG ────────────────────────────────────────────────────────────────

const IconLeads = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconDashboard = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="7" height="9" rx="1.5"/>
    <rect x="15" y="3" width="7" height="5" rx="1.5"/>
    <rect x="15" y="12" width="7" height="9" rx="1.5"/>
    <rect x="2" y="16" width="7" height="5" rx="1.5"/>
  </svg>
);

const IconINPI = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const IconScripts = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

const IconScrape = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
);

// ── Navigation ────────────────────────────────────────────────────────────────

const NAV = [
  { href: "/app",             label: "Leads",        Icon: IconLeads,     hint: "⌘1" },
  { href: "/app/dashboard",   label: "Dashboard",    Icon: IconDashboard, hint: "⌘2" },
  { href: "/app/inpi",        label: "INPI / RNE",   Icon: IconINPI,      hint: "⌘3" },
  { href: "/app/scripts",     label: "Scripts",      Icon: IconScripts,   hint: "⌘4" },
  { href: "/app/auto-scrape", label: "Auto-scraping", Icon: IconScrape,   hint: "⌘5" },
];

// ── Composant ─────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname                  = usePathname();
  const { plan, refresh }         = usePlan();
  const [trialOpen, setTrialOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const planLabel = plan === "pro" ? "Pro" : plan === "agency" ? "Agence" : "Free";
  const isPaid    = plan === "pro" || plan === "agency";

  return (
    <>
      {/* Bouton burger mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Ouvrir le menu"
        className="md:hidden fixed top-3 left-3 z-[55] w-9 h-9 rounded-xl
                   bg-[#0d0f18]/90 border border-white/[0.08] backdrop-blur-md
                   flex items-center justify-center text-slate-400 shadow-xl"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 z-[58] bg-black/70 backdrop-blur-sm"
        />
      )}

      {/* Sidebar */}
      <aside className={[
        "fixed left-0 top-0 h-screen w-[220px] flex flex-col",
        "bg-[#080b12] border-r border-white/[0.05]",
        "z-[59] transition-transform duration-300 md:translate-x-0 md:z-50",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}>

        {/* Trait de lumière haut */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

        {/* ── Logo ──────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-[18px] shrink-0">
          {/* Icône P */}
          <div className="relative w-8 h-8 rounded-[10px] shrink-0 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-700" />
            <div className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />
            <span className="relative text-white text-[13px] font-bold tracking-tight">P</span>
          </div>

          <div className="flex flex-col leading-none">
            <span className="text-[13px] font-bold text-white tracking-tight">Prospeo</span>
            <span className="text-[10px] text-slate-600 mt-[3px] tracking-wide font-mono">CRM · prospection</span>
          </div>

          {/* Fermer (mobile) */}
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer"
            className="md:hidden ml-auto w-6 h-6 rounded-lg bg-white/[0.04] flex items-center justify-center text-slate-600 hover:text-slate-300 transition-colors text-xs"
          >
            ✕
          </button>
        </div>

        {/* Séparateur */}
        <div className="mx-4 mb-2 h-px bg-white/[0.04]" />

        {/* ── Navigation ────────────────────────────────────────────────────── */}
        <nav className="flex-1 px-2 space-y-px overflow-y-auto py-1">
          <p className="px-2 pb-2 pt-1 text-[9px] font-semibold tracking-[0.15em] text-slate-700 uppercase">
            Navigation
          </p>

          {NAV.map(({ href, label, Icon, hint }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "group relative flex items-center gap-3 px-3 py-[9px] rounded-xl text-[13px] transition-all duration-150",
                  active
                    ? "bg-violet-500/[0.12] text-slate-100"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]",
                ].join(" ")}
              >
                {/* Barre active gauche */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-violet-400 to-violet-600 shadow-[0_0_8px_rgba(124,58,237,0.6)]" />
                )}

                {/* Icône */}
                <span className={[
                  "shrink-0 transition-colors duration-150",
                  active ? "text-violet-400" : "text-slate-600 group-hover:text-slate-400",
                ].join(" ")}>
                  <Icon />
                </span>

                {/* Label */}
                <span className="flex-1 font-medium tracking-tight">{label}</span>

                {/* Hint raccourci clavier */}
                <span className={[
                  "text-[10px] font-mono transition-opacity duration-150 shrink-0",
                  active ? "text-violet-500/60" : "text-slate-700 group-hover:text-slate-600",
                ].join(" ")}>
                  {hint}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* ── Bas : Cmd+K hint ─────────────────────────────────────────────── */}
        <div className="px-2 pt-2 pb-1">
          <button
            onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px]
                       text-slate-700 hover:text-slate-400 hover:bg-white/[0.03]
                       transition-colors group"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <span className="flex-1 text-left">Recherche rapide</span>
            <span className="flex items-center gap-0.5">
              <kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.07] text-[9px] font-mono leading-none">⌘</kbd>
              <kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.07] text-[9px] font-mono leading-none">K</kbd>
            </span>
          </button>
        </div>

        {/* Séparateur */}
        <div className="mx-4 h-px bg-white/[0.04]" />

        {/* ── Badge plan + compte ───────────────────────────────────────────── */}
        <div className="px-2 pb-4 pt-2 shrink-0 space-y-1">

          {/* Badge plan */}
          {isPaid ? (
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-violet-500/[0.08] border border-violet-500/[0.15]">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.8)]" />
              <span className="text-[11px] font-semibold text-violet-300 tracking-wide">Plan {planLabel}</span>
            </div>
          ) : (
            <button
              onClick={() => setTrialOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                         bg-white/[0.03] border border-white/[0.07]
                         hover:bg-violet-500/[0.07] hover:border-violet-500/[0.18]
                         transition-all text-left group"
            >
              <span className="text-[13px]">🎟️</span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider leading-none group-hover:text-violet-400 transition-colors">
                  Plan Free
                </div>
                <div className="text-[10px] text-slate-700 mt-0.5 group-hover:text-slate-500 transition-colors">
                  Activer un code →
                </div>
              </div>
            </button>
          )}

          {/* UserButton */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer">
            <UserButton
              appearance={{ elements: { avatarBox: "w-[26px] h-[26px]" } }}
            />
            <span className="text-[12px] text-slate-600 font-medium">Mon compte</span>
          </div>
        </div>

        {/* Modal code d'invitation */}
        {trialOpen && (
          <TrialCodeModal
            onSuccess={() => { refresh(); }}
            onClose={() => setTrialOpen(false)}
          />
        )}
      </aside>
    </>
  );
}
