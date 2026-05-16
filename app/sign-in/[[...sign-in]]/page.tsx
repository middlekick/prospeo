import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0b0d12]">
      <div className="flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <span className="text-violet-400 text-lg font-bold">P</span>
          </div>
          <span className="text-xl font-semibold text-slate-100">Prospeo</span>
        </div>
        <p className="text-sm text-slate-500">CRM de prospection commerciale</p>
        {/* Widget Clerk */}
        <SignIn
          appearance={{
            variables: {
              colorBackground:    "#0f1117",
              colorText:          "#e2e8f0",
              colorPrimary:       "#8b5cf6",
              colorInputBackground: "rgba(255,255,255,0.05)",
              colorInputText:     "#e2e8f0",
              borderRadius:       "8px",
            },
            elements: {
              card:              "shadow-2xl border border-white/10",
              headerTitle:       "text-slate-100",
              headerSubtitle:    "text-slate-500",
              formButtonPrimary: "bg-violet-600 hover:bg-violet-500",
              footerActionLink:  "text-violet-400 hover:text-violet-300",
            },
          }}
        />
      </div>
    </div>
  );
}
