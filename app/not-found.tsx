import Link from "next/link";

/**
 * Page 404 custom  dark theme cohérent avec le CRM.
 * Pas de sidebar ici, affichée en pleine page.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0b0d12] flex flex-col items-center justify-center gap-6 px-6 text-center">
      {/* Chiffre géant */}
      <div className="relative select-none">
        <span
          className="text-[10rem] font-black leading-none tracking-tighter"
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 60%, #6366f1 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            opacity: 0.9,
          }}
        >
          404
        </span>
        {/* Halo violet derrière */}
        <div
          className="absolute inset-0 -z-10 blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }}
        />
      </div>

      {/* Logo */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <span className="text-violet-400 text-sm font-bold">P</span>
        </div>
        <span className="text-slate-400 text-sm font-medium">Prospeo</span>
      </div>

      {/* Message */}
      <div className="max-w-xs">
        <h1 className="text-xl font-semibold text-slate-100 mb-2">
          Page introuvable
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          Cette page n&apos;existe pas ou a été déplacée.
          Retourne sur les leads pour continuer ta prospection.
        </p>
      </div>

      {/* CTA */}
      <Link
        href="/app"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors mt-2"
      >
        ← Retour aux leads
      </Link>

      {/* Sous-liens */}
      <div className="flex items-center gap-4 text-xs text-slate-700">
        <Link href="/app/dashboard" className="hover:text-slate-500 transition-colors">Dashboard</Link>
        <span>·</span>
        <Link href="/" className="hover:text-slate-500 transition-colors">Accueil</Link>
      </div>
    </div>
  );
}
