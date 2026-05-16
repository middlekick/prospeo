"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link          from "next/link";
import { useUser }   from "@clerk/nextjs";
import ContactModal  from "@/components/ui/ContactModal";
import AnimatedDemo  from "@/components/landing/AnimatedDemo";
import { useToast }  from "@/components/ui/Toast";

// ─── Stripe ──────────────────────────────────────────────────────────────────
async function startCheckout(plan: "pro" | "agency", email: string, onError: (m: string) => void) {
  const res = await fetch("/api/checkout", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      plan, email,
      successUrl: `${window.location.origin}/app?checkout=success`,
      cancelUrl:  `${window.location.origin}/#pricing`,
    }),
  });
  const data = await res.json() as { url?: string; error?: string };
  if (data.url) window.location.href = data.url;
  else onError(data.error || "Configuration Stripe manquante (STRIPE_PRICE_ID_PRO).");
}

// ─── Scroll reveal ────────────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const obs = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("revealed"); obs.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// ─── Compteur animé ───────────────────────────────────────────────────────────
function Counter({ end, suffix = "", duration = 1700 }: { end: number; suffix?: string; duration?: number }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || done.current) return;
      done.current = true;
      const t0 = Date.now();
      const tick = () => {
        const p = Math.min((Date.now() - t0) / duration, 1);
        setN(Math.round((1 - Math.pow(1 - p, 3)) * end));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{n}{suffix}</span>;
}

// ─── Gradient text ────────────────────────────────────────────────────────────
function G({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-gradient-to-br from-violet-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
      {children}
    </span>
  );
}

// ─── Eyebrow ──────────────────────────────────────────────────────────────────
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium tracking-widest uppercase
                     text-violet-300/80 border border-violet-400/15 bg-violet-500/[0.06]">
      {children}
    </span>
  );
}

export default function Landing() {
  const [email,       setEmail]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactSubj, setContactSubj] = useState("");
  const [emailModal,  setEmailModal]  = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const [showSticky,  setShowSticky]  = useState(false);
  const { isSignedIn } = useUser();
  const { error: toastError } = useToast();

  useScrollReveal();

  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 24); setShowSticky(window.scrollY > 720); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function openContact(subject = "") { setContactSubj(subject); setContactOpen(true); }

  const pay = useCallback(async (plan: "pro" | "agency" = "pro") => {
    if (!isSignedIn) { window.location.href = `/sign-up?redirect_url=${encodeURIComponent("/#pricing")}`; return; }
    if (!email) { setEmailModal(true); return; }
    setLoading(true);
    await startCheckout(plan, email, toastError);
    setLoading(false);
  }, [email, isSignedIn, toastError]);

  return (
    <>
      <style>{`
        [data-reveal]{opacity:0;transform:translateY(28px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
        [data-reveal].revealed{opacity:1;transform:none}
        [data-rd="1"]{transition-delay:.08s}[data-rd="2"]{transition-delay:.16s}
        [data-rd="3"]{transition-delay:.24s}[data-rd="4"]{transition-delay:.32s}
        @keyframes auroraMove{0%,100%{transform:translate3d(-6%,0,0) scale(1)}50%{transform:translate3d(6%,3%,0) scale(1.12)}}
        @keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .aurora{animation:auroraMove 18s ease-in-out infinite}
        .floaty{animation:floaty 7s ease-in-out infinite}
        .grain:before{content:"";position:fixed;inset:0;z-index:1;pointer-events:none;opacity:.4;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")}
      `}</style>

      <div className="grain relative min-h-screen bg-[#060608] text-slate-300 overflow-x-hidden antialiased">

        {/* ── Fond atmosphérique ─────────────────────────────────────────── */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="aurora absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1100px] h-[700px] rounded-full blur-[160px]"
               style={{ background: "radial-gradient(ellipse at center, rgba(124,58,237,0.22), transparent 65%)" }} />
          <div className="absolute top-[40%] -left-[10%] w-[600px] h-[600px] rounded-full blur-[150px]"
               style={{ background: "radial-gradient(circle, rgba(79,70,229,0.10), transparent 70%)" }} />
          <div className="absolute bottom-0 right-0 w-[600px] h-[500px] rounded-full blur-[150px]"
               style={{ background: "radial-gradient(circle, rgba(168,85,247,0.08), transparent 70%)" }} />
          <div className="absolute inset-0"
               style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.022) 1px,transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(ellipse at 50% 0%, black, transparent 75%)" }} />
        </div>

        <div className="relative z-10">

          {/* ── Nav ──────────────────────────────────────────────────────── */}
          <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300
            ${scrolled ? "bg-[#060608]/80 backdrop-blur-xl border-b border-white/[0.06]" : "bg-transparent"}`}>
            <div className="max-w-6xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.5)]">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <span className="text-slate-100 font-semibold tracking-tight text-[15px]">Prospeo</span>
              </Link>
              <div className="hidden md:flex items-center gap-9 text-[13px] text-slate-500">
                {[["#produit","Produit"],["#features","Fonctionnalités"],["#pricing","Tarifs"],["#faq","FAQ"]].map(([h,l])=>(
                  <a key={h} href={h} className="hover:text-slate-200 transition-colors">{l}</a>
                ))}
              </div>
              <div className="flex items-center gap-2.5">
                {isSignedIn ? (
                  <Link href="/app"
                    className="flex items-center gap-1.5 text-[13px] font-medium bg-white text-[#0b0d12] px-4 py-2 rounded-full hover:bg-slate-200 transition-colors">
                    Ouvrir l&apos;app →
                  </Link>
                ) : (
                  <>
                    <Link href="/sign-in" className="hidden sm:block text-[13px] text-slate-400 hover:text-slate-100 transition-colors px-3">
                      Connexion
                    </Link>
                    <a href="#pricing"
                      className="text-[13px] font-medium bg-white text-[#0b0d12] px-4 py-2 rounded-full hover:bg-slate-200 transition-colors">
                      Essai gratuit
                    </a>
                  </>
                )}
              </div>
            </div>
          </nav>

          {/* ── Hero ─────────────────────────────────────────────────────── */}
          <section className="relative px-5 sm:px-6 pt-36 sm:pt-44 pb-20">
            <div className="max-w-5xl mx-auto text-center">
              <div data-reveal>
                <Eyebrow>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  CRM de prospection · 14 jours offerts
                </Eyebrow>
              </div>

              <h1 data-reveal data-rd="1"
                className="mt-7 text-[clamp(2.6rem,8vw,5.5rem)] font-bold leading-[0.98] tracking-[-0.03em] text-slate-50">
                Trouve. Appelle.
                <br />
                <G>Signe.</G>
              </h1>

              <p data-reveal data-rd="2"
                className="mt-7 text-base sm:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
                Le CRM qui réunit le sourcing de leads, le téléprompter d&apos;appel,
                le suivi des RDV et les relances — dans un seul flux pensé pour
                le terrain. De la donnée brute au deal signé.
              </p>

              <div data-reveal data-rd="3" className="mt-9 flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button onClick={() => pay("pro")} disabled={loading}
                  className="group relative w-full sm:w-auto px-7 py-3.5 rounded-full bg-white text-[#0b0d12] text-sm font-semibold
                             transition-all hover:scale-[1.02] disabled:opacity-50
                             shadow-[0_0_40px_rgba(124,58,237,0.35)]">
                  {loading ? "Redirection…" : "Commencer gratuitement"}
                  <span className="ml-1.5 inline-block transition-transform group-hover:translate-x-0.5">→</span>
                </button>
                <a href="#produit"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full border border-white/15 text-slate-300 text-sm font-medium
                             hover:bg-white/[0.04] hover:border-white/25 transition-all">
                  Voir le produit
                </a>
              </div>
              <p data-reveal data-rd="4" className="mt-4 text-xs text-slate-600">
                Sans carte bancaire · résiliable à tout moment
              </p>
            </div>

            {/* Démo produit encadrée — cinématique */}
            <div data-reveal data-rd="2" className="relative max-w-5xl mx-auto mt-16 sm:mt-20">
              <div className="absolute -inset-x-10 -top-10 bottom-0 -z-10 blur-3xl opacity-60"
                   style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.30), transparent 60%)" }} />
              <div className="floaty rounded-2xl border border-white/[0.08] bg-[#0b0d12]/80 backdrop-blur-sm overflow-hidden
                              shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.04)_inset]">
                <div className="h-9 flex items-center gap-2 px-4 border-b border-white/[0.06] bg-white/[0.02]">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
                  <span className="ml-3 text-[11px] text-slate-600 font-mono">prospeo.app/app</span>
                </div>
                <AnimatedDemo />
              </div>
            </div>

            {/* Métriques */}
            <div data-reveal className="max-w-3xl mx-auto mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {[
                { v: <Counter end={50} suffix="+" />, l: "leads en 1 clic" },
                { v: <Counter end={100} suffix="%" />, l: "relances tracées" },
                { v: <Counter end={14} suffix="j" />, l: "d'essai offert" },
                { v: "0€", l: "pour démarrer" },
              ].map((s, i) => (
                <div key={i}>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">{s.v}</div>
                  <div className="text-xs text-slate-600 mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Problème → Solution ──────────────────────────────────────── */}
          <section id="produit" className="px-5 sm:px-6 py-24 sm:py-32">
            <div className="max-w-5xl mx-auto">
              <div data-reveal className="text-center mb-16">
                <Eyebrow>Le constat</Eyebrow>
                <h2 className="mt-6 text-3xl sm:text-5xl font-bold text-slate-50 tracking-[-0.02em] leading-tight">
                  Le tableur ne t&apos;a jamais<br />rappelé un seul client.
                </h2>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { t: "Avant", tone: "bad", items: ["Leads éparpillés dans Excel", "Scripts sur un bout de papier", "Rappels oubliés", "Zéro visibilité conversion"] },
                  { t: "Avec Prospeo", tone: "mid", items: ["Sourcing auto Maps + INPI", "Téléprompter en direct", "Rappels visuels + alertes", "Funnel temps réel"] },
                  { t: "Le résultat", tone: "good", items: ["2× plus de leads qualifiés", "Meilleur taux de closing", "0 relance oubliée", "Décisions sur données"] },
                ].map((c, i) => (
                  <div key={i} data-reveal data-rd={String(i + 1)}
                    className={`p-7 rounded-2xl border backdrop-blur-sm transition-all
                      ${c.tone === "bad"  ? "border-white/[0.06] bg-white/[0.02]"
                      : c.tone === "mid"  ? "border-violet-400/25 bg-violet-500/[0.07] shadow-[0_0_60px_-20px_rgba(124,58,237,0.5)]"
                      :                     "border-emerald-400/20 bg-emerald-500/[0.05]"}`}>
                    <div className={`text-xs font-semibold uppercase tracking-widest mb-5
                      ${c.tone === "bad" ? "text-slate-600" : c.tone === "mid" ? "text-violet-300" : "text-emerald-300"}`}>
                      {c.t}
                    </div>
                    <ul className="space-y-3">
                      {c.items.map(it => (
                        <li key={it} className={`flex items-start gap-2.5 text-sm ${c.tone === "bad" ? "text-slate-500" : "text-slate-300"}`}>
                          <span className={c.tone === "bad" ? "text-slate-700" : c.tone === "mid" ? "text-violet-400" : "text-emerald-400"}>
                            {c.tone === "bad" ? "✕" : "✓"}
                          </span>
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Fonctionnalités (bento) ──────────────────────────────────── */}
          <section id="features" className="px-5 sm:px-6 py-24 sm:py-32 border-t border-white/[0.05]">
            <div className="max-w-6xl mx-auto">
              <div data-reveal className="text-center mb-16">
                <Eyebrow>Fonctionnalités</Eyebrow>
                <h2 className="mt-6 text-3xl sm:text-5xl font-bold text-slate-50 tracking-[-0.02em] leading-tight">
                  Tout le pipeline.<br /><G>Un seul écran.</G>
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Grande carte */}
                <div data-reveal className="md:col-span-2 md:row-span-2 group relative p-8 rounded-3xl border border-white/[0.08]
                                bg-gradient-to-br from-violet-500/[0.09] to-transparent overflow-hidden
                                hover:border-violet-400/30 transition-all">
                  <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full blur-3xl opacity-40 group-hover:opacity-70 transition-opacity"
                       style={{ background: "radial-gradient(circle,rgba(124,58,237,0.4),transparent 70%)" }} />
                  <div className="relative">
                    <div className="text-3xl mb-5">🗺️</div>
                    <h3 className="text-xl font-semibold text-slate-50 mb-2">Sourcing automatique</h3>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                      Métier + ville → un tableau de leads qualifiés en quelques secondes
                      via Google Maps. Plus l&apos;accès à l&apos;INPI/RNE pour cibler les
                      entreprises récemment créées, avec enrichissement automatique des numéros.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {["Google Maps", "INPI / RNE", "Enrichissement", "Auto-scraping 8h"].map(t => (
                        <span key={t} className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-slate-400">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {[
                  { i: "📞", t: "Mode session d'appels", d: "Enchaîne les leads en plein écran : numéro géant, script affiché, résultat en 1 touche." },
                  { i: "📋", t: "Scripts téléprompter", d: "Cold call & closing en direct. Objections et étapes visibles pendant l'appel." },
                  { i: "📊", t: "Dashboard réel", d: "Seuls les vrais contacts comptent. Funnel, taux de décrochage, RDV à venir." },
                  { i: "✉️", t: "Emails & relances", d: "3 templates, envoi depuis ton Gmail, relances multi-paliers automatiques." },
                ].map((f, i) => (
                  <div key={i} data-reveal data-rd={String((i % 2) + 1)}
                    className="group p-7 rounded-3xl border border-white/[0.07] bg-white/[0.02]
                               hover:bg-white/[0.04] hover:border-white/15 transition-all">
                    <div className="text-2xl mb-4 transition-transform group-hover:scale-110">{f.i}</div>
                    <h3 className="text-[15px] font-semibold text-slate-100 mb-1.5">{f.t}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{f.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Comment ça marche ────────────────────────────────────────── */}
          <section className="px-5 sm:px-6 py-24 sm:py-32 border-t border-white/[0.05]">
            <div className="max-w-5xl mx-auto">
              <div data-reveal className="text-center mb-16">
                <Eyebrow>En pratique</Eyebrow>
                <h2 className="mt-6 text-3xl sm:text-5xl font-bold text-slate-50 tracking-[-0.02em] leading-tight">
                  Zéro à ton premier RDV<br /><G>en moins d&apos;une heure.</G>
                </h2>
              </div>
              <div className="grid md:grid-cols-3 gap-5 relative">
                <div className="hidden md:block absolute top-7 left-[16%] right-[16%] h-px bg-gradient-to-r from-violet-500/40 via-violet-500/20 to-violet-500/40" />
                {[
                  { n: "01", t: "Source", d: "Scrape Maps, importe l'INPI ou un CSV. Leads normalisés, prêts à appeler." },
                  { n: "02", t: "Appelle", d: "Lance une session : script affiché, résultat en 1 touche, journal auto." },
                  { n: "03", t: "Convertis", d: "Relances multi-paliers automatiques, emails de suivi, funnel temps réel." },
                ].map((s, i) => (
                  <div key={i} data-reveal data-rd={String(i + 1)} className="relative text-center md:text-left">
                    <div className="inline-flex w-14 h-14 rounded-2xl items-center justify-center font-mono font-bold
                                    bg-[#0b0d12] border border-violet-400/30 text-violet-300 mb-5 relative z-10
                                    shadow-[0_0_30px_-8px_rgba(124,58,237,0.6)]">
                      {s.n}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-100 mb-2">{s.t}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{s.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Témoignage spotlight ─────────────────────────────────────── */}
          <section className="px-5 sm:px-6 py-24 sm:py-36 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[800px] h-[400px] rounded-full blur-[140px] opacity-50"
                   style={{ background: "radial-gradient(ellipse,rgba(124,58,237,0.2),transparent 65%)" }} />
            </div>
            <div data-reveal className="relative max-w-3xl mx-auto text-center">
              <div className="flex justify-center gap-1 mb-8">
                {Array(5).fill(0).map((_, i) => <span key={i} className="text-amber-400">★</span>)}
              </div>
              <blockquote className="text-2xl sm:text-4xl font-medium text-slate-100 leading-[1.3] tracking-[-0.01em]">
                « Sur la semaine de test, le client a généré{" "}
                <G>12 000 €</G> de CA. Sur les 3 mois suivants,{" "}
                <G>150 000 €</G> — pour 3 000 € de budget Google. »
              </blockquote>
              <div className="mt-10 flex items-center justify-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center text-white font-bold">T</div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-slate-100">Téo Mikulic</div>
                  <div className="text-xs text-slate-500">Acquisition · Google Ads pour artisans</div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Comparatif ───────────────────────────────────────────────── */}
          <section className="px-5 sm:px-6 py-24 sm:py-32 border-t border-white/[0.05]">
            <div className="max-w-4xl mx-auto">
              <div data-reveal className="text-center mb-14">
                <Eyebrow>Comparatif</Eyebrow>
                <h2 className="mt-6 text-3xl sm:text-4xl font-bold text-slate-50 tracking-[-0.02em]">
                  Pourquoi pas Excel ou HubSpot&nbsp;?
                </h2>
              </div>
              <div data-reveal className="rounded-2xl border border-white/[0.08] overflow-hidden backdrop-blur-sm bg-white/[0.015]">
                <div className="grid grid-cols-4 border-b border-white/[0.08] bg-white/[0.03]">
                  <div className="p-4 text-[11px] text-slate-600 uppercase tracking-widest font-semibold">Critère</div>
                  {[["Prospeo", true], ["Excel", false], ["HubSpot", false]].map(([n, h]) => (
                    <div key={n as string} className={`p-4 text-center text-sm font-semibold ${h ? "text-violet-300" : "text-slate-500"}`}>
                      {h && "✦ "}{n as string}
                    </div>
                  ))}
                </div>
                {[
                  ["Sourcing intégré (Maps + INPI)", true, false, false],
                  ["Téléprompter d'appel", true, false, false],
                  ["Relances multi-paliers auto", true, false, true],
                  ["Journal d'activité auto", true, false, true],
                  ["Dashboard de conversion", true, false, true],
                  ["Prix mensuel", "19€", "0€", "0€ (limité)"],
                  ["Prise en main", "Minutes", "Minutes", "Élevée"],
                ].map((r, i) => (
                  <div key={i} className={`grid grid-cols-4 border-b border-white/[0.05] last:border-0 ${i % 2 ? "bg-white/[0.012]" : ""}`}>
                    <div className="p-3.5 text-sm text-slate-400">{r[0] as string}</div>
                    {[r[1], r[2], r[3]].map((v, j) => (
                      <div key={j} className={`p-3.5 flex justify-center items-center text-sm ${j === 0 ? "bg-violet-500/[0.07]" : ""}`}>
                        {typeof v === "boolean"
                          ? (v ? <span className={j === 0 ? "text-violet-300 font-bold" : "text-emerald-500/60"}>✓</span> : <span className="text-slate-700">✕</span>)
                          : <span className={j === 0 ? "text-violet-200 font-medium" : "text-slate-500"}>{v as string}</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Artisans ─────────────────────────────────────────────────── */}
          <section className="px-5 sm:px-6 py-24">
            <div data-reveal className="max-w-5xl mx-auto rounded-3xl border border-violet-400/15 overflow-hidden
                            bg-gradient-to-br from-violet-500/[0.07] to-transparent p-8 sm:p-14">
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div>
                  <Eyebrow>Pour les artisans</Eyebrow>
                  <h2 className="mt-6 text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight leading-tight">
                    Artisan&nbsp;? On s&apos;occupe<br /><G>de vos clients.</G>
                  </h2>
                  <p className="mt-4 text-slate-400 text-sm leading-relaxed">
                    Campagne Google Ads locale, premiers devis dès la première semaine.
                    Vous ne payez que le budget publicitaire, directement à Google —
                    aucun frais d&apos;agence sur la semaine de test.
                  </p>
                  <button onClick={() => openContact("Intéressé par une campagne Google Ads")}
                    className="mt-7 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#0b0d12]
                               text-sm font-semibold hover:bg-slate-200 transition-colors">
                    Contacter Téo →
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[["🔨","Plombiers"],["⚡","Électriciens"],["🌿","Paysagistes"],["🎨","Peintres"],["🧱","Maçons"],["🏠","Couvreurs"]].map(([ic, lb]) => (
                    <div key={lb} className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                      <span className="text-lg">{ic}</span><span className="text-sm text-slate-300">{lb}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Tarifs ───────────────────────────────────────────────────── */}
          <section id="pricing" className="px-5 sm:px-6 py-24 sm:py-32 border-t border-white/[0.05]">
            <div className="max-w-5xl mx-auto">
              <div data-reveal className="text-center mb-12">
                <Eyebrow>Tarifs</Eyebrow>
                <h2 className="mt-6 text-3xl sm:text-5xl font-bold text-slate-50 tracking-[-0.02em]">
                  Simple. <G>Transparent.</G>
                </h2>
                <div className="mt-8 max-w-sm mx-auto">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.09] rounded-xl text-center
                               text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
                  <p className="text-xs text-slate-600 mt-2">Saisissez votre email puis choisissez un plan</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-5 items-start">
                {[
                  { name: "Gratuit", price: "0€", desc: "Pour découvrir et faire ses premiers appels.",
                    feats: ["100 leads max", "3 scrapings Maps/mois", "Rappels & RDV", "Journal d'activité"],
                    cta: "Créer un compte", onClick: () => { window.location.href = "/sign-up"; }, hl: false },
                  { name: "Pro", price: "19€", desc: "La prospection systématique, sans limite.",
                    feats: ["Leads illimités", "Maps + INPI illimités", "Mode session d'appels", "Scripts téléprompter", "Dashboard + funnel", "Emails & relances auto", "Import / Export CSV"],
                    cta: "Commencer 14j gratuit", onClick: () => pay("pro"), hl: true },
                  { name: "Agence", price: "49€", desc: "Pour les équipes à fort volume.",
                    feats: ["Tout Pro inclus", "5 utilisateurs", "Leads partagés", "Onboarding dédié", "Support prioritaire"],
                    cta: "Nous contacter", onClick: () => openContact("Plan Agence Prospeo"), hl: false },
                ].map(p => (
                  <div key={p.name} data-reveal
                    className={`relative flex flex-col p-7 rounded-3xl border transition-all
                      ${p.hl ? "border-violet-400/40 bg-gradient-to-b from-violet-500/[0.12] to-transparent shadow-[0_0_80px_-20px_rgba(124,58,237,0.6)] md:-mt-3 md:pb-10"
                             : "border-white/[0.08] bg-white/[0.02]"}`}>
                    {p.hl && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-semibold bg-white text-[#0b0d12]">
                        Le plus populaire
                      </span>
                    )}
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{p.name}</div>
                    <div className="mt-3 flex items-end gap-1">
                      <span className="text-4xl font-bold text-slate-50">{p.price}</span>
                      {p.price !== "0€" && <span className="text-slate-500 mb-1 text-sm">/mois</span>}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{p.desc}</p>
                    <ul className="mt-6 space-y-2.5 flex-1">
                      {p.feats.map(f => (
                        <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="text-violet-400 mt-0.5">✓</span>{f}
                        </li>
                      ))}
                    </ul>
                    <button onClick={p.onClick} disabled={loading && p.hl}
                      className={`mt-7 w-full py-3 rounded-full text-sm font-semibold transition-all
                        ${p.hl ? "bg-white text-[#0b0d12] hover:bg-slate-200 disabled:opacity-50"
                               : "border border-white/15 text-slate-200 hover:bg-white/[0.05]"}`}>
                      {loading && p.hl ? "Redirection…" : p.cta}
                    </button>
                  </div>
                ))}
              </div>
              <p data-reveal className="text-center text-xs text-slate-600 mt-10">
                14 jours gratuits sur Pro · sans carte bancaire · résiliable à tout moment
              </p>
            </div>
          </section>

          {/* ── FAQ ──────────────────────────────────────────────────────── */}
          <section id="faq" className="px-5 sm:px-6 py-24 sm:py-32 border-t border-white/[0.05]">
            <div className="max-w-2xl mx-auto">
              <div data-reveal className="text-center mb-14">
                <Eyebrow>FAQ</Eyebrow>
                <h2 className="mt-6 text-3xl sm:text-4xl font-bold text-slate-50 tracking-[-0.02em]">
                  Questions fréquentes
                </h2>
              </div>
              <div data-reveal className="space-y-1">
                {[
                  { q: "Faut-il une carte bancaire pour l'essai ?", a: "Non. L'essai de 14 jours ne demande aucune carte. Vous n'êtes débité qu'à la fin si vous continuez." },
                  { q: "Mes données sont-elles sécurisées ?", a: "Oui. Chaque compte est totalement isolé — vous ne voyez que vos leads. Stockage PostgreSQL (Neon) chiffré SSL." },
                  { q: "Puis-je importer mes leads existants ?", a: "Oui : CSV avec auto-détection des colonnes, import INPI, ou scraping Google Maps direct." },
                  { q: "Comment marche le scraping Google Maps ?", a: "Métier + ville → Prospeo interroge Maps et remplit le tableau (nom, tel, site, adresse). Doublons filtrés automatiquement." },
                  { q: "Puis-je annuler à tout moment ?", a: "Oui, sans frais. Annulation depuis l'espace client, accès conservé jusqu'à la fin de la période payée." },
                  { q: "Les emails partent depuis mon Gmail ?", a: "Oui, via un mot de passe applicatif. Meilleure délivrabilité et confiance car ils partent de votre adresse." },
                ].map((f, i) => <FAQItem key={i} {...f} />)}
              </div>
            </div>
          </section>

          {/* ── CTA final ────────────────────────────────────────────────── */}
          <section className="px-5 sm:px-6 py-28 sm:py-40 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[900px] h-[450px] rounded-full blur-[150px] opacity-60"
                   style={{ background: "radial-gradient(ellipse,rgba(124,58,237,0.28),transparent 60%)" }} />
            </div>
            <div data-reveal className="relative max-w-2xl mx-auto text-center">
              <h2 className="text-4xl sm:text-6xl font-bold text-slate-50 tracking-[-0.03em] leading-[1.05]">
                Prospecte comme<br /><G>un closer.</G>
              </h2>
              <p className="mt-6 text-slate-400">Structure ta prospection. Mesure tes résultats. Signe plus.</p>
              <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="flex-1 px-4 py-3.5 bg-white/[0.04] border border-white/[0.09] rounded-full text-center sm:text-left
                             text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
                <button onClick={() => pay("pro")} disabled={loading}
                  className="px-7 py-3.5 rounded-full bg-white text-[#0b0d12] text-sm font-semibold
                             hover:scale-[1.02] transition-all disabled:opacity-50 shadow-[0_0_40px_rgba(124,58,237,0.4)] whitespace-nowrap">
                  {loading ? "…" : "Commencer →"}
                </button>
              </div>
            </div>
          </section>

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <footer className="border-t border-white/[0.05] px-5 sm:px-6 py-14">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-10">
              <div className="max-w-xs">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">P</span>
                  </div>
                  <span className="text-slate-100 font-semibold">Prospeo</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Le CRM des prospecteurs terrain et des artisans. Trouve, appelle, signe.
                </p>
              </div>
              <div className="flex gap-14 sm:gap-20">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Produit</div>
                  <div className="space-y-2.5">
                    {[["#features","Fonctionnalités"],["#pricing","Tarifs"],["#faq","FAQ"]].map(([h,l])=>(
                      <a key={h} href={h} className="block text-sm text-slate-600 hover:text-slate-300 transition-colors">{l}</a>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Compte</div>
                  <div className="space-y-2.5">
                    <Link href="/sign-in" className="block text-sm text-slate-600 hover:text-slate-300 transition-colors">Connexion</Link>
                    <Link href="/app" className="block text-sm text-slate-600 hover:text-slate-300 transition-colors">Ouvrir l&apos;app</Link>
                    <button onClick={() => openContact()} className="block text-sm text-slate-600 hover:text-slate-300 transition-colors">Contact</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row justify-between gap-2 text-xs text-slate-700">
              <span>© 2026 Prospeo. Tous droits réservés.</span>
              <span>Conçu par Téo Mikulic</span>
            </div>
          </footer>
        </div>

        {/* Sticky CTA */}
        <div className={`fixed bottom-0 inset-x-0 z-40 transition-all duration-500 ${showSticky ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}>
          <div className="mx-auto max-w-xl mb-4 px-4">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0d0f15]/95 border border-violet-400/20 backdrop-blur-xl
                            shadow-[0_0_40px_rgba(124,58,237,0.2),0_8px_32px_rgba(0,0,0,0.5)]">
              <span className="text-sm text-slate-300 font-medium flex-1 min-w-0 truncate">Essai 14 jours gratuit</span>
              <button onClick={() => pay("pro")} disabled={loading}
                className="px-4 py-2 rounded-full bg-white text-[#0b0d12] text-xs font-semibold hover:bg-slate-200 transition-all disabled:opacity-50 whitespace-nowrap">
                {loading ? "…" : "Commencer →"}
              </button>
              <button onClick={() => setShowSticky(false)} className="text-slate-600 hover:text-slate-400 text-lg leading-none">×</button>
            </div>
          </div>
        </div>

        {contactOpen && <ContactModal defaultSubject={contactSubj} onClose={() => setContactOpen(false)} />}

        {emailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setEmailModal(false)}>
            <div className="bg-[#0d0f15] border border-white/10 rounded-2xl p-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-slate-100 font-semibold mb-2">Votre email</h3>
              <p className="text-slate-500 text-sm mb-4">Pour démarrer votre essai gratuit de 14 jours.</p>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" autoFocus
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-slate-200 placeholder-slate-600 text-sm mb-3 focus:outline-none focus:border-violet-500/50 transition-colors" />
              <button onClick={() => { setEmailModal(false); pay(); }} disabled={!email}
                className="w-full py-3 bg-white text-[#0b0d12] disabled:opacity-40 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">
                Continuer →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── FAQ item ─────────────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/[0.06] rounded-xl bg-white/[0.015] overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left group">
        <span className="text-[15px] text-slate-200 font-medium group-hover:text-white transition-colors">{q}</span>
        <span className={`text-slate-500 text-lg flex-shrink-0 transition-transform duration-200 ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && <p className="px-5 pb-5 -mt-1 text-sm text-slate-500 leading-relaxed">{a}</p>}
    </div>
  );
}
