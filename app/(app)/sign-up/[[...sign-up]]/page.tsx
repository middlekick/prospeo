import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

const CLERK_APPEARANCE = {
  variables: {
    colorBackground:      "#0f1117",
    colorText:            "#e2e8f0",
    colorTextSecondary:   "#94a3b8",
    colorPrimary:         "#8b5cf6",
    colorDanger:          "#ef4444",
    colorInputBackground: "rgba(255,255,255,0.05)",
    colorInputText:       "#e2e8f0",
    borderRadius:         "12px",
    fontSize:             "14px",
  },
  elements: {
    card:                     "shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_32px_80px_rgba(0,0,0,0.6)] bg-[#0f1117] border-0",
    headerTitle:              "text-slate-100 font-semibold",
    headerSubtitle:           "text-slate-500 text-sm",
    socialButtonsBlockButton: "border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition-colors",
    dividerLine:              "bg-white/[0.08]",
    dividerText:              "text-slate-600 text-xs",
    formFieldLabel:           "text-slate-400 text-xs",
    formFieldInput:           "border-white/[0.10] bg-white/[0.04] text-slate-200 focus:border-brand-500/60",
    formButtonPrimary:        "bg-brand-600 hover:bg-brand-500 text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-colors",
    footerActionLink:         "text-brand-400 hover:text-brand-300 transition-colors",
    identityPreviewText:      "text-slate-300",
    identityPreviewEditButton:"text-brand-400 hover:text-brand-300",
  },
};

export default function SignUpPage() {
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#050508] overflow-hidden">
      {/* Fond */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full blur-[160px]"
             style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.16), transparent 65%)" }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 w-full px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-[0_0_18px_rgba(124,58,237,0.5)]">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="text-slate-100 font-semibold text-[17px] tracking-tight">Prospeo</span>
        </Link>

        <SignUp appearance={CLERK_APPEARANCE} />
      </div>
    </div>
  );
}
