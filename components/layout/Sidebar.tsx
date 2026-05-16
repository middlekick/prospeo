"use client";

import { useState }    from "react";
import Link            from "next/link";
import { usePathname } from "next/navigation";
import { UserButton }  from "@clerk/nextjs";
import { usePlan }     from "@/hooks/usePlan";
import TrialCodeModal  from "@/components/ui/TrialCodeModal";

const NAV = [
  {
    href:  "/",
    label: "Leads",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href:  "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="7" height="9" rx="1"/>
        <rect x="15" y="3" width="7" height="5" rx="1"/>
        <rect x="15" y="12" width="7" height="9" rx="1"/>
        <rect x="2" y="16" width="7" height="5" rx="1"/>
      </svg>
    ),
  },
  {
    href:  "/inpi",
    label: "INPI / RNE",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href:  "/scripts",
    label: "Scripts",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    href:  "/auto-scrape",
    label: "Auto-scraping",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname           = usePathname();
  const { plan, refresh }  = usePlan();
  const [trialOpen, setTrialOpen] = useState(false);

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] flex flex-col
                      bg-[#0d0f18] border-r border-white/[0.06] z-50">

      {/* Ligne gradient haut */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 shrink-0">
        <div className="relative w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-600/80 to-violet-800/80 border border-violet-500/40" />
          <span className="relative text-white text-sm font-bold tracking-tight">P</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-100 tracking-tight leading-none">Prospeo</span>
          <span className="text-[10px] text-slate-600 tracking-wide mt-0.5">CRM · prospection</span>
        </div>
      </div>

      {/* Séparateur */}
      <div className="mx-4 mb-3 h-px bg-white/[0.05]" />

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        <p className="px-2 pb-1 text-[10px] font-semibold tracking-widest text-slate-700 uppercase">
          Navigation
        </p>
        {NAV.map(({ href, icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={[
                "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150",
                active
                  ? "bg-violet-500/[0.15] text-violet-200"
                  : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.05]",
              ].join(" ")}
            >
              {/* Accent barre gauche */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-violet-400 to-violet-600" />
              )}

              {/* Icône */}
              <span className={[
                "shrink-0 transition-colors",
                active ? "text-violet-300" : "text-slate-600 group-hover:text-slate-300",
              ].join(" ")}>
                {icon}
              </span>

              {/* Label */}
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bas — plan badge + user */}
      <div className="px-2 pb-4 pt-2 shrink-0 border-t border-white/[0.05] mt-2 space-y-1">

        {/* Badge plan */}
        {plan === "free" ? (
          <button
            onClick={() => setTrialOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl
                       bg-violet-500/[0.08] border border-violet-500/20 hover:bg-violet-500/[0.14]
                       transition-all text-left group"
          >
            <span className="text-sm">🎟️</span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-violet-400/80 uppercase tracking-wider leading-none">Plan Free</div>
              <div className="text-[10px] text-slate-600 mt-0.5 group-hover:text-violet-400/60 transition-colors">Entrer un code →</div>
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/[0.08] border border-violet-500/20">
            <span className="text-sm">⚡</span>
            <div className="text-[10px] font-bold text-violet-300 uppercase tracking-wider">Plan {plan === "pro" ? "Pro" : "Agence"}</div>
          </div>
        )}

        {/* UserButton */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors">
          <UserButton
            appearance={{
              elements: { avatarBox: "w-7 h-7" },
            }}
          />
          <span className="text-xs text-slate-500 font-medium">Mon compte</span>
        </div>
      </div>

      {/* Modal code d'invitation */}
      {trialOpen && (
        <TrialCodeModal
          onSuccess={() => { refresh(); }}
          onClose={() => setTrialOpen(false)}
        />
      )}

      {/* Ligne gradient bas */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
    </aside>
  );
}
