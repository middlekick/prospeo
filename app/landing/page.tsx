"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link          from "next/link";
import { useUser }   from "@clerk/nextjs";
import ContactModal  from "@/components/ui/ContactModal";
import AnimatedDemo  from "@/components/landing/AnimatedDemo";
import { useToast }  from "@/components/ui/Toast";

// ─── Stripe ──────────────────────────────────────────────────────────────────
async function startCheckout(plan: "pro" | "agency", email: string, onError: (msg: string) => void) {
  const res  = await fetch("/api/checkout", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      plan, email,
      successUrl: `${window.location.origin}/?checkout=success`,
      cancelUrl:  `${window.location.origin}/landing`,
    }),
  });
  const data = await res.json() as { url?: string; error?: string };
  if (data.url) window.location.href = data.url;
  else onError(data.error || "Price ID manquant — configurez STRIPE_PRICE_ID_PRO dans .env");
}

// ─── Hook : animations au scroll ─────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("revealed"); obs.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// ─── Curseur lumineux ─────────────────────────────────────────────────────────
function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf: number;
    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let cx = tx, cy = ty;
    const onMove = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY; };
    window.addEventListener("mousemove", onMove);
    const tick = () => {
      cx += (tx - cx) * 0.065; cy += (ty - cy) * 0.065;
      if (ref.current) ref.current.style.transform = `translate(${cx - 350}px,${cy - 350}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed top-0 left-0 z-0 w-[700px] h-[700px] rounded-full"
      style={{ background: "radial-gradient(circle, rgba(124,58,237,0.09) 0%, rgba(99,40,220,0.04) 45%, transparent 70%)", willChange: "transform" }} />
  );
}

// ─── Compteur animé au scroll ─────────────────────────────────────────────────
function AnimatedCounter({ end, suffix = "", duration = 1600 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref  = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || done.current) return;
      done.current = true;
      const start = Date.now();
      const tick = () => {
        const p = Math.min((Date.now() - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setCount(Math.round(eased * end));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ─── Composants ──────────────────────────────────────────────────────────────
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
                     bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-5">
      {children}
    </span>
  );
}
function G({ children }: { children: React.ReactNode }) {
  return <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">{children}</span>;
}

// Feature card avec glow + animation icône au hover
function FCard({ icon, title, desc, color = "violet", iconAnim = "" }: { icon: string; title: string; desc: string; color?: string; iconAnim?: string }) {
  const hover: Record<string, string> = {
    violet: "group-hover:shadow-[0_0_40px_rgba(124,58,237,0.18)] group-hover:border-violet-500/35",
    cyan:   "group-hover:shadow-[0_0_40px_rgba(6,182,212,0.15)]  group-hover:border-cyan-500/30",
    emerald:"group-hover:shadow-[0_0_40px_rgba(52,211,153,0.15)] group-hover:border-emerald-500/30",
    amber:  "group-hover:shadow-[0_0_40px_rgba(251,191,36,0.15)] group-hover:border-amber-500/30",
    indigo: "group-hover:shadow-[0_0_40px_rgba(99,102,241,0.18)] group-hover:border-indigo-500/35",
    pink:   "group-hover:shadow-[0_0_40px_rgba(236,72,153,0.15)] group-hover:border-pink-500/30",
  };
  const iconBg: Record<string, string> = {
    violet: "bg-violet-500/12 text-violet-300",
    cyan:   "bg-cyan-500/12    text-cyan-300",
    emerald:"bg-emerald-500/12 text-emerald-300",
    amber:  "bg-amber-500/12   text-amber-300",
    indigo: "bg-indigo-500/12  text-indigo-300",
    pink:   "bg-pink-500/12    text-pink-300",
  };
  return (
    <div className={`group p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03]
                    hover:bg-white/[0.055] transition-all duration-500 ${hover[color]}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-5 ${iconBg[color]} transition-transform duration-300 ${iconAnim}`}>
        {icon}
      </div>
      <h3 className="text-slate-100 font-semibold mb-2 text-[15px]">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

// Plan tarifaire
function PlanCard({
  name, price, desc, features, highlight, cta, email, onPay, loading,
}: {
  name: string; price: string; desc: string; features: string[];
  highlight?: boolean; cta: string; email: string;
  onPay: () => void; loading: boolean;
}) {
  return (
    <div className={`relative flex flex-col p-8 rounded-2xl border transition-all duration-300
      ${highlight
        ? "border-violet-500/50 bg-gradient-to-b from-violet-500/12 to-transparent shadow-[0_0_80px_rgba(124,58,237,0.22)]"
        : "border-white/[0.09] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"}`}>
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 rounded-full text-xs font-semibold bg-violet-600 text-white">
            ✦ Le plus populaire
          </span>
        </div>
      )}
      <div className="mb-6">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">{name}</div>
        <div className="flex items-end gap-1">
          <span className="text-4xl font-bold text-slate-100">{price}</span>
          {price !== "Gratuit" && <span className="text-slate-500 mb-1">/mois</span>}
        </div>
        <p className="text-sm text-slate-500 mt-2">{desc}</p>
      </div>
      <ul className="space-y-2.5 mb-8 flex-1">
        {features.map(f => (
          <li key={f} className={`flex items-start gap-2 text-sm ${f.startsWith("✗") ? "text-slate-600" : "text-slate-300"}`}>
            <span className={f.startsWith("✗") ? "text-slate-700 mt-0.5" : "text-violet-400 mt-0.5"}>
              {f.startsWith("✗") ? "✗" : "✓"}
            </span>
            {f.replace("✗ ", "")}
          </li>
        ))}
      </ul>
      <button
        onClick={onPay}
        disabled={loading || (price !== "0 €" && !email)}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors
          ${highlight
            ? "bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40"
            : "bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 hover:border-white/20 disabled:opacity-40"}`}
      >
        {loading ? "Redirection…" : cta}
      </button>
    </div>
  );
}

// FAQ item
function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.06] py-5 cursor-pointer group" onClick={() => setOpen(o => !o)}>
      <div className="flex items-center justify-between gap-4">
        <span className="text-slate-200 font-medium text-[15px] group-hover:text-white transition-colors">{q}</span>
        <span className={`text-slate-500 text-lg transition-transform duration-200 flex-shrink-0 ${open ? "rotate-45" : ""}`}>+</span>
      </div>
      {open && <p className="text-slate-500 text-sm leading-relaxed mt-4">{a}</p>}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [email,          setEmail]          = useState("");
  const [loading,        setLoading]        = useState(false);
  const { error: toastError } = useToast();
  const [modal,          setModal]          = useState(false);
  const [contactOpen,    setContactOpen]    = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [bandeauVisible, setBandeauVisible] = useState(false);
  const [showSticky,     setShowSticky]     = useState(false);
  const { isSignedIn } = useUser();

  useScrollReveal();

  // Bandeau early adopter — persisté via localStorage
  useEffect(() => {
    if (!localStorage.getItem("bandeau-dismissed")) setBandeauVisible(true);
  }, []);

  // Sticky CTA — apparaît après 400px de scroll
  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function openContact(subject = "") {
    setContactSubject(subject);
    setContactOpen(true);
  }

  const pay = useCallback(async (plan: "pro" | "agency" = "pro") => {
    // Si pas connecté → redirection vers sign-up, retour sur landing#pricing après
    if (!isSignedIn) {
      window.location.href = `/sign-up?redirect_url=${encodeURIComponent("/landing#pricing")}`;
      return;
    }
    if (!email) { setModal(true); return; }
    setLoading(true);
    await startCheckout(plan, email, toastError);
    setLoading(false);
  }, [email, isSignedIn]);

  return (
    <>
      {/* Bandeau early adopter */}
      {bandeauVisible && (
        <div className="fixed top-0 left-0 right-0 z-[60] h-9 flex items-center justify-center gap-3
                        bg-gradient-to-r from-violet-950/90 via-violet-900/90 to-violet-950/90
                        border-b border-violet-500/20 backdrop-blur-md text-xs">
          <span className="text-violet-300 font-medium">
            ✦ Offre early adopter — accès à vie à tarif fondateur pour les 50 premiers
          </span>
          <span className="text-violet-500">·</span>
          <span className="text-violet-400 font-semibold">23 places restantes</span>
          <button onClick={() => { localStorage.setItem("bandeau-dismissed","1"); setBandeauVisible(false); }}
            className="absolute right-4 text-violet-600 hover:text-violet-400 transition-colors text-base leading-none">
            ×
          </button>
        </div>
      )}

      {/* CSS scroll reveal */}
      <style>{`
        [data-reveal]{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease}
        [data-reveal].revealed{opacity:1;transform:none}
        [data-reveal-delay="1"]{transition-delay:.1s}
        [data-reveal-delay="2"]{transition-delay:.2s}
        [data-reveal-delay="3"]{transition-delay:.3s}
        [data-reveal-delay="4"]{transition-delay:.4s}
        [data-reveal-delay="5"]{transition-delay:.5s}
        @keyframes pulse-border{0%,100%{opacity:.4}50%{opacity:.8}}
        .animate-pulse-border{animation:pulse-border 3s ease-in-out infinite}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .animate-float{animation:float 6s ease-in-out infinite}
      `}</style>

      <div className="min-h-screen bg-[#0b0d12] text-slate-300 overflow-x-hidden">
        <CursorGlow />

        {/* Grille fond */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0"
          style={{
            backgroundImage:`linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)`,
            backgroundSize:"56px 56px",
          }}/>

        <div className="relative z-10">

          {/* ── Navbar ────────────────────────────────────────────────────── */}
          <nav className={`fixed left-0 right-0 z-50 border-b border-white/[0.05] bg-[#0b0d12]/75 backdrop-blur-2xl transition-[top] duration-300 ${bandeauVisible ? "top-9" : "top-0"}`}>
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/20 flex items-center justify-center">
                  <span className="text-violet-400 font-bold text-sm">P</span>
                </div>
                <span className="text-slate-100 font-semibold tracking-tight">Prospeo</span>
              </div>
              <div className="hidden md:flex items-center gap-8 text-sm text-slate-500">
                {[["#fonctionnalites","Fonctionnalités"],["#pourquoi","Pourquoi Prospeo"],["#pricing","Tarifs"],["#faq","FAQ"]].map(([href,label])=>(
                  <a key={href} href={href} className="hover:text-slate-300 transition-colors">{label}</a>
                ))}
              </div>
              <div className="flex items-center gap-3">
                {isSignedIn ? (
                  <Link
                    href="/"
                    className="hidden md:flex items-center gap-1.5 text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                  >
                    Accéder au CRM →
                  </Link>
                ) : (
                  <Link href="/sign-in" className="text-sm text-slate-500 hover:text-slate-300 transition-colors hidden md:block">Connexion</Link>
                )}
                {!isSignedIn && (
                  <a href="#pricing" className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg transition-colors font-medium">
                    Essai gratuit
                  </a>
                )}
              </div>
            </div>
          </nav>

          {/* ── Hero ──────────────────────────────────────────────────────── */}
          <section className="pt-36 pb-28 px-6 relative">
            <div className="absolute inset-0 flex justify-center pointer-events-none overflow-hidden">
              <div className="mt-16 w-[900px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]"/>
            </div>

            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <div data-reveal className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                                           text-xs font-medium bg-white/[0.04] border border-white/[0.08]
                                           text-slate-400 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                  Disponible maintenant — 14 jours d&apos;essai gratuit
                </div>

                <h1 data-reveal data-reveal-delay="1"
                  className="text-5xl md:text-[64px] font-bold text-slate-100 leading-[1.1] mb-6 tracking-tight">
                  Le CRM qui transforme<br />
                  <G>vos appels en clients</G>
                </h1>

                <p data-reveal data-reveal-delay="2"
                  className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed mb-10">
                  Prospeo centralise leads, scripts d&apos;appel, RDV et emails dans un outil
                  pensé pour la prospection terrain. De la source au deal signé.
                </p>

                <div data-reveal data-reveal-delay="3"
                  className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md mx-auto">
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="flex-1 w-full px-4 py-3 bg-white/[0.04] border border-white/[0.09] rounded-xl
                               text-slate-200 placeholder-slate-600 text-sm
                               focus:outline-none focus:border-violet-500/50 transition-colors"/>
                  <button onClick={() => pay("pro")} disabled={loading}
                    className="w-full sm:w-auto px-6 py-3 bg-violet-600 hover:bg-violet-500
                               disabled:opacity-50 text-white rounded-xl text-sm font-semibold
                               transition-all whitespace-nowrap
                               shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.45)]">
                    {loading ? "Redirection…" : "Commencer gratuitement →"}
                  </button>
                </div>
                <p data-reveal data-reveal-delay="4" className="text-xs text-slate-600 mt-3">
                  Sans engagement · 14 jours gratuits · résiliable à tout moment
                </p>
              </div>

              {/* Démo animée flottante */}
              <div data-reveal data-reveal-delay="2" className="animate-float">
                <AnimatedDemo />
              </div>

              {/* Stats animées sous le mockup */}
              <div data-reveal className="flex flex-wrap justify-center gap-8 mt-14 text-center">
                {[
                  { end: 50,  suffix: "+",  label: "leads qualifiés en 1 clic" },
                  { end: 100, suffix: "%",  label: "relances tracées automatiquement" },
                  { end: 14,  suffix: "j",  label: "d'essai sans engagement" },
                  { end: 0,   suffix: "€",  label: "pour commencer" },
                ].map(s=>(
                  <div key={s.label} className="px-5">
                    <div className="text-xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                      {s.end === 0 ? "0€" : <AnimatedCounter end={s.end} suffix={s.suffix} />}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Pourquoi ──────────────────────────────────────────────────── */}
          <section id="pourquoi" className="py-20 border-y border-white/[0.05] bg-white/[0.022]">
            <div className="max-w-5xl mx-auto px-6">
              <div data-reveal className="text-center mb-14">
                <Badge>✦ Pourquoi Prospeo</Badge>
                <h2 className="text-3xl font-bold text-slate-100 tracking-tight">
                  Fini le tableur qui ne vous rappelle jamais.
                </h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {icon:"🗂️", t:"Avant Prospeo",
                   items:["Leads éparpillés dans Excel","Scripts sur papier","Rappels oubliés","Aucune visibilité sur les conversions"],
                   bad:true},
                  {icon:"⚡", t:"Ce qui change",
                   items:["Sourcing automatique (Maps + INPI)","Téléprompter intégré en direct","Rappels visuels + alertes","Dashboard de conversion temps réel"],
                   bad:false},
                  {icon:"🎯", t:"Le résultat",
                   items:["2× plus de leads qualifiés","Scripts rôdés = meilleur taux","0 relance oubliée","Décisions basées sur des données"],
                   bad:false},
                ].map((col,i)=>(
                  <div key={i} data-reveal data-reveal-delay={String(i+1)}
                    className={`p-6 rounded-2xl border ${col.bad
                      ? "border-red-500/20 bg-red-500/[0.06]"
                      : i===1 ? "border-violet-500/30 bg-violet-500/[0.08]" : "border-emerald-500/25 bg-emerald-500/[0.06]"}`}>
                    <div className="text-2xl mb-3">{col.icon}</div>
                    <h3 className={`font-semibold mb-4 text-sm uppercase tracking-wider
                      ${col.bad ? "text-red-400" : i===1 ? "text-violet-400" : "text-emerald-400"}`}>
                      {col.t}
                    </h3>
                    <ul className="space-y-2">
                      {col.items.map(item=>(
                        <li key={item} className={`flex items-start gap-2 text-sm ${col.bad ? "text-slate-500" : "text-slate-300"}`}>
                          <span className={`mt-0.5 flex-shrink-0 ${col.bad ? "text-red-500/50" : i===1 ? "text-violet-400" : "text-emerald-400"}`}>
                            {col.bad ? "✗" : "✓"}
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Fonctionnalités ───────────────────────────────────────────── */}
          <section id="fonctionnalites" className="py-24 px-6">
            <div className="max-w-6xl mx-auto">
              <div data-reveal className="text-center mb-16">
                <Badge>✦ Fonctionnalités</Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-100 tracking-tight mb-4">
                  Tout ce dont vous avez besoin.<br/><G>Rien de superflu.</G>
                </h2>
                <p className="text-slate-500 max-w-xl mx-auto text-sm">
                  Prospeo a été construit par un prospecteur terrain, pour des prospecteurs terrain.
                  Chaque fonctionnalité répond à un besoin concret du cold call quotidien.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {icon:"🗺️",title:"Scraping Google Maps",color:"violet",  iconAnim:"group-hover:rotate-12",
                   desc:"Trouvez des leads qualifiés en secondes. Métier + ville → tableau rempli automatiquement avec nom, téléphone et site."},
                  {icon:"🏛️",title:"Base INPI / RNE",     color:"indigo",  iconAnim:"group-hover:scale-110",
                   desc:"Accédez aux entreprises récemment créées. Filtres par département, code NAF, ancienneté. Import direct avec enrichissement auto."},
                  {icon:"📋",title:"Scripts téléprompter", color:"cyan",    iconAnim:"group-hover:-translate-y-1",
                   desc:"Cold call et closing en plein écran. Objections, mindset, étapes de closing — tout visible pendant l'appel, sans quitter l'écran."},
                  {icon:"📊",title:"Dashboard métriques",  color:"emerald", iconAnim:"group-hover:scale-110",
                   desc:"Suivez vos vrais indicateurs. Seuls les contacts réels comptent — pas les leads importés. Funnel, graphiques, RDV à venir."},
                  {icon:"📅",title:"RDV & rappels",        color:"amber",   iconAnim:"group-hover:rotate-6",
                   desc:"Rappels en retard surlignés en rouge. RDV planifiés et suivis. Alertes visuelles pour ne plus jamais rater une relance."},
                  {icon:"✉️",title:"Emails de prospection",color:"pink",    iconAnim:"group-hover:translate-x-1",
                   desc:"3 templates prêts : offre semaine gratuite, confirmation RDV, rappel J-1. Envoi depuis votre Gmail + log automatique dans le journal."},
                ].map((f,i)=>(
                  <div key={i} data-reveal data-reveal-delay={String((i%3)+1)}>
                    <FCard {...f} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Comparatif ───────────────────────────────────────────────── */}
          <section className="py-24 px-6 border-t border-white/[0.05]">
            <div className="max-w-4xl mx-auto">
              <div data-reveal className="text-center mb-14">
                <Badge>✦ Comparatif</Badge>
                <h2 className="text-3xl font-bold text-slate-100 tracking-tight mb-3">
                  Pourquoi pas Excel ou HubSpot ?
                </h2>
                <p className="text-slate-500 text-sm max-w-lg mx-auto">
                  Prospeo est le seul outil pensé de A à Z pour la prospection terrain d&apos;artisans et TPE locales.
                </p>
              </div>
              <div data-reveal className="rounded-2xl border border-white/[0.08] overflow-hidden">
                {/* En-tête */}
                <div className="grid grid-cols-4 bg-white/[0.04] border-b border-white/[0.08]">
                  <div className="p-4 text-xs text-slate-600 uppercase tracking-wider font-semibold">Fonctionnalité</div>
                  {[
                    { name: "Prospeo", highlight: true },
                    { name: "Excel",   highlight: false },
                    { name: "HubSpot", highlight: false },
                  ].map(col => (
                    <div key={col.name} className={`p-4 text-center text-sm font-semibold ${col.highlight ? "text-violet-300" : "text-slate-500"}`}>
                      {col.highlight && <span className="mr-1.5">✦</span>}{col.name}
                    </div>
                  ))}
                </div>
                {/* Lignes */}
                {[
                  ["Sourcing leads intégré (Maps + INPI)", true,  false, false],
                  ["Scripts d'appel téléprompter",        true,  false, false],
                  ["Rappels automatiques J+3",            true,  false, true ],
                  ["Journal d'activité automatique",      true,  false, true ],
                  ["Import / Export CSV",                 true,  true,  true ],
                  ["Dashboard analytique",                true,  false, true ],
                  ["Prix mensuel",                        "19€", "0€",  "0€ (limité)"],
                  ["Complexité d'utilisation",            "Faible","Faible","Élevée"],
                ].map((row, i) => (
                  <div key={i} className={`grid grid-cols-4 border-b border-white/[0.05] last:border-0 ${i % 2 === 0 ? "" : "bg-white/[0.015]"}`}>
                    <div className="p-3.5 text-sm text-slate-400">{row[0] as string}</div>
                    {[row[1], row[2], row[3]].map((val, j) => (
                      <div key={j} className={`p-3.5 flex justify-center items-center text-sm ${j === 0 ? "bg-violet-500/[0.06]" : ""}`}>
                        {typeof val === "boolean" ? (
                          val
                            ? <span className={`font-bold ${j === 0 ? "text-violet-400" : "text-emerald-500/60"}`}>✓</span>
                            : <span className="text-slate-700">✗</span>
                        ) : (
                          <span className={`font-medium ${j === 0 ? "text-violet-300" : "text-slate-500"}`}>{val as string}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Comment ça marche ─────────────────────────────────────────── */}
          <section className="py-20 border-y border-white/[0.05] bg-white/[0.022] px-6">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <div>
                  <div data-reveal><Badge>✦ Comment ça marche</Badge></div>
                  <h2 data-reveal className="text-3xl font-bold text-slate-100 mb-10 tracking-tight">
                    De zéro à votre premier<br/><G>RDV en moins d&apos;une heure</G>
                  </h2>
                  {/* Timeline animée */}
                  <div className="relative">
                    {/* Ligne verticale */}
                    <div className="absolute left-5 top-5 bottom-5 w-px bg-gradient-to-b from-violet-500/60 via-violet-500/20 to-transparent" />
                    <div className="space-y-10">
                      {[
                        {n:"01", t:"Sourcez vos leads",       color:"text-violet-400", bg:"bg-violet-500/10 border-violet-500/25",
                         d:"Scrapez Google Maps, importez depuis l'INPI ou chargez un CSV. Leads normalisés et prêts à appeler en quelques secondes."},
                        {n:"02", t:"Appelez avec le script",   color:"text-cyan-400",   bg:"bg-cyan-500/10 border-cyan-500/25",
                         d:"Ouvrez le téléprompter, appelez. Statut mis à jour en un clic. Chaque changement est loggé automatiquement dans le journal."},
                        {n:"03", t:"Relancez et convertissez", color:"text-emerald-400",bg:"bg-emerald-500/10 border-emerald-500/25",
                         d:"Rappels J+3 créés automatiquement. Emails de suivi en un clic. Le dashboard vous montre votre funnel en temps réel."},
                      ].map((s,i)=>(
                        <div key={i} data-reveal data-reveal-delay={String(i+1)} className="flex gap-5 relative">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-xs font-mono z-10 ${s.bg} ${s.color}`}>
                            {s.n}
                          </div>
                          <div className="pt-1.5">
                            <h3 className="text-slate-100 font-semibold mb-1.5">{s.t}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">{s.d}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Témoignage */}
                <div data-reveal className="p-8 rounded-2xl bg-white/[0.045] border border-white/[0.10]"
                  style={{boxShadow:"inset 0 1px 0 rgba(255,255,255,0.07), 0 0 40px rgba(124,58,237,0.06)"}}>
                  <div className="flex gap-1 mb-5">
                    {Array(5).fill(0).map((_,i)=><span key={i} className="text-amber-400 text-sm">★</span>)}
                  </div>
                  <blockquote className="text-slate-200 text-lg font-medium leading-relaxed mb-6">
                    &ldquo;Sur la semaine de test, le client a généré{" "}
                    <span className="text-emerald-400 font-bold">12 000 € de CA</span>.
                    Sur les 3 mois suivants,{" "}
                    <span className="text-emerald-400 font-bold">150 000 €</span>{" "}
                    pour seulement 3 000 € de budget Google.&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3 pt-5 border-t border-white/[0.06]">
                    <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/20
                                    flex items-center justify-center text-violet-400 font-bold text-sm">T</div>
                    <div>
                      <div className="text-sm font-semibold text-slate-200">Téo Mikulic</div>
                      <div className="text-xs text-slate-600">Acquisition client · Google Ads pour artisans</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Artisans ──────────────────────────────────────────────────── */}
          <section className="py-24 px-6">
            <div className="max-w-5xl mx-auto">
              <div data-reveal className="rounded-3xl border border-violet-500/15 overflow-hidden"
                style={{background:"linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(79,70,229,0.03) 100%)"}}>
                <div className="p-10 md:p-14">
                  <div className="grid md:grid-cols-2 gap-10 items-center">
                    <div>
                      <Badge>✦ Pour les artisans</Badge>
                      <h2 className="text-3xl font-bold text-slate-100 mb-4 tracking-tight">
                        Vous êtes artisan ?<br/><G>On s&apos;occupe de vos clients.</G>
                      </h2>
                      <p className="text-slate-400 leading-relaxed mb-6 text-sm">
                        Je lance votre campagne Google Ads locale et vous recevez vos premiers
                        devis dès la première semaine. Vous payez uniquement le budget publicitaire
                        directement à Google — aucun frais d&apos;agence sur la semaine de test.
                      </p>
                      <ul className="space-y-2 mb-8">
                        {["Semaine de test sans frais d'agence","Budget moyen : 100 € (10-15 €/jour)","Résultats mesurables dès J+3","Zéro engagement après la semaine test"].map(it=>(
                          <li key={it} className="flex items-start gap-2 text-sm text-slate-400">
                            <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>{it}
                          </li>
                        ))}
                      </ul>
                      <button onClick={() => openContact("Intéressé par une campagne Google Ads")}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white/[0.05] hover:bg-white/[0.09]
                                   border border-white/[0.09] hover:border-white/20 rounded-xl text-sm
                                   font-medium text-slate-200 transition-all">
                        ✉ Contacter Téo directement
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[["🔨","Plombiers"],["⚡","Électriciens"],["🌿","Paysagistes"],["🎨","Peintres"],["🧱","Maçons"],["🏠","Couvreurs"]].map(([ic,lb])=>(
                        <div key={lb} className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.05] border border-white/[0.09] hover:bg-white/[0.09] transition-colors">
                          <span className="text-xl">{ic}</span>
                          <span className="text-sm text-slate-300">{lb}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Tarifs ────────────────────────────────────────────────────── */}
          <section id="pricing" className="py-24 px-6 border-t border-white/[0.05] bg-gradient-to-b from-violet-950/20 to-transparent">
            <div className="max-w-5xl mx-auto">
              <div data-reveal className="text-center mb-16">
                <Badge>✦ Tarifs</Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-100 tracking-tight mb-4">
                  Simple. <G>Transparent.</G>
                </h2>
                <p className="text-slate-500 text-sm">Commencez gratuitement. Évoluez selon vos besoins.</p>
              </div>

              {/* Input email centralisé */}
              <div data-reveal className="max-w-sm mx-auto mb-10">
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.09] rounded-xl
                             text-slate-200 placeholder-slate-600 text-sm text-center
                             focus:outline-none focus:border-violet-500/50 transition-colors"/>
                <p className="text-xs text-slate-600 mt-2 text-center">Saisissez votre email puis choisissez un plan</p>
              </div>

              <div data-reveal className="grid md:grid-cols-3 gap-5">
                <PlanCard
                  name="Gratuit" price="0 €" email={email}
                  desc="Pour découvrir l'outil et faire vos premiers appels."
                  features={[
                    "100 leads maximum",
                    "3 scrapings Google Maps/mois",
                    "Gestion des rappels & RDV",
                    "Journal d'activité",
                    "✗ Import / Export CSV",
                    "✗ Recherche INPI / RNE",
                    "✗ Emails de prospection",
                    "✗ Dashboard analytics",
                    "✗ Scripts téléprompter",
                  ]}
                  cta="Créer un compte gratuit"
                  onPay={()=>{ window.location.href="/sign-up"; }}
                  loading={false}
                />
                <PlanCard
                  name="Pro" price="19 €" email={email} highlight
                  desc="L'outil complet pour une prospection systématique."
                  features={[
                    "Leads illimités",
                    "Scraping Google Maps illimité",
                    "Accès INPI / RNE illimité",
                    "Enrichissement automatique",
                    "Emails illimités (3 templates)",
                    "Dashboard analytics + funnel",
                    "Scripts téléprompter",
                    "Import / Export CSV",
                    "Support prioritaire",
                  ]}
                  cta="Commencer 14j gratuit"
                  onPay={() => pay("pro")} loading={loading}
                />
                <PlanCard
                  name="Agence" price="49 €" email={email}
                  desc="Pour les équipes et agences à fort volume."
                  features={[
                    "Tout Pro inclus",
                    "Multi-utilisateurs (5 comptes)",
                    "Leads partagés en équipe",
                    "Onboarding dédié",
                    "Support téléphonique",
                    "SLA garanti",
                  ]}
                  cta="Nous contacter"
                  onPay={() => openContact("Plan Agence Prospeo")}
                  loading={false}
                />
              </div>

              <p data-reveal className="text-center text-xs text-slate-600 mt-8">
                14 jours gratuits sur Pro · Sans engagement · Résiliable à tout moment
              </p>
            </div>
          </section>

          {/* ── FAQ ───────────────────────────────────────────────────────── */}
          <section id="faq" className="py-24 px-6 border-t border-white/[0.05] bg-white/[0.022]">
            <div className="max-w-2xl mx-auto">
              <div data-reveal className="text-center mb-14">
                <Badge>✦ FAQ</Badge>
                <h2 className="text-3xl font-bold text-slate-100 tracking-tight">Questions fréquentes</h2>
              </div>
              <div data-reveal>
                {[
                  {q:"Est-ce que je dois entrer ma carte bancaire pour l'essai ?",
                   a:"Non. L'essai de 14 jours ne nécessite pas de carte bancaire. Vous n'êtes débité qu'à la fin de la période d'essai si vous choisissez de continuer."},
                  {q:"Mes données sont-elles sécurisées ?",
                   a:"Oui. Chaque compte Prospeo est totalement isolé — vous ne voyez que vos propres leads. Les données sont stockées sur PostgreSQL (Neon) avec chiffrement SSL."},
                  {q:"Puis-je importer mes leads existants ?",
                   a:"Absolument. Prospeo accepte les fichiers CSV avec auto-détection des colonnes. Vous pouvez aussi importer depuis l'INPI ou scraper Google Maps directement."},
                  {q:"Comment fonctionne le scraping Google Maps ?",
                   a:"Vous entrez un métier et une ville, Prospeo interroge Google Maps via SerpAPI et remplit votre tableau avec nom, téléphone, site et adresse. Les doublons sont automatiquement filtrés."},
                  {q:"Puis-je annuler à tout moment ?",
                   a:"Oui, sans frais ni pénalité. Vous pouvez annuler depuis votre espace client à n'importe quel moment. Vous conservez l'accès jusqu'à la fin de la période payée."},
                  {q:"Les emails sont-ils envoyés depuis mon propre Gmail ?",
                   a:"Oui. Prospeo utilise votre compte Gmail via un mot de passe applicatif. Les emails arrivent depuis votre adresse, ce qui améliore la délivrabilité et la confiance."},
                ].map((item,i)=>(
                  <div key={i} data-reveal data-reveal-delay={String(Math.min(i+1,5))}><FAQ {...item}/></div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CTA final ─────────────────────────────────────────────────── */}
          <section className="py-28 px-6 relative overflow-hidden">
            <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
              <div className="w-[600px] h-[300px] bg-violet-600/8 rounded-full blur-3xl animate-pulse-border"/>
            </div>
            <div data-reveal className="max-w-2xl mx-auto text-center relative">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-100 mb-4 tracking-tight">
                Prêt à prospecter<br/><G>comme un pro ?</G>
              </h2>
              <p className="text-slate-500 mb-10">
                Rejoignez Prospeo. Structurez votre prospection. Mesurez vos résultats.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="flex-1 px-4 py-3 bg-white/[0.04] border border-white/[0.09] rounded-xl
                             text-slate-200 placeholder-slate-600 text-sm
                             focus:outline-none focus:border-violet-500/50 transition-colors"/>
                <button onClick={() => pay("pro")} disabled={loading}
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50
                             text-white rounded-xl text-sm font-semibold transition-all whitespace-nowrap
                             shadow-[0_0_24px_rgba(124,58,237,0.35)] hover:shadow-[0_0_40px_rgba(124,58,237,0.5)]">
                  {loading ? "…" : "Commencer →"}
                </button>
              </div>
            </div>
          </section>

          {/* ── Footer ────────────────────────────────────────────────────── */}
          <footer className="border-t border-white/[0.05] py-12 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
                <div className="max-w-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/20 flex items-center justify-center">
                      <span className="text-violet-400 text-xs font-bold">P</span>
                    </div>
                    <span className="text-slate-200 font-semibold">Prospeo</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    CRM de prospection commerciale pour les prospecteurs terrain et les artisans.
                  </p>
                </div>
                <div className="flex gap-16">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Produit</div>
                    <div className="space-y-2">
                      {[["#fonctionnalites","Fonctionnalités"],["#pricing","Tarifs"],["#faq","FAQ"]].map(([h,l])=>(
                        <a key={h} href={h} className="block text-sm text-slate-600 hover:text-slate-400 transition-colors">{l}</a>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Compte</div>
                    <div className="space-y-2">
                      <Link href="/sign-in" className="block text-sm text-slate-600 hover:text-slate-400 transition-colors">Connexion</Link>
                      <Link href="/sign-up" className="block text-sm text-slate-600 hover:text-slate-400 transition-colors">Inscription</Link>
                      <button onClick={() => openContact()} className="block text-sm text-slate-600 hover:text-slate-400 transition-colors text-left">Contact</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-8 border-t border-white/[0.04]">
                <span className="text-xs text-slate-700">© 2025 Prospeo. Tous droits réservés.</span>
                <span className="text-xs text-slate-700">Fait avec ☕ par Téo Mikulic</span>
              </div>
            </div>
          </footer>

        </div>

        {/* Sticky CTA */}
        <div className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-500 ${showSticky ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}>
          <div className="mx-auto max-w-2xl mb-4 px-4">
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#0f1117]/95 border border-violet-500/25 backdrop-blur-xl
                            shadow-[0_0_40px_rgba(124,58,237,0.25),0_8px_32px_rgba(0,0,0,0.4)]">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-violet-400 font-bold text-xs">P</span>
                </div>
                <div className="min-w-0">
                  <span className="text-slate-200 font-semibold text-sm">Prospeo</span>
                  <span className="text-slate-600 text-xs ml-2 hidden sm:inline">· Essai 14 jours gratuit</span>
                </div>
              </div>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="hidden sm:block flex-1 px-3 py-2 bg-white/[0.04] border border-white/[0.09] rounded-lg
                           text-slate-200 placeholder-slate-600 text-xs
                           focus:outline-none focus:border-violet-500/50 transition-colors max-w-[200px]" />
              <button onClick={() => pay("pro")} disabled={loading}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl
                           text-xs font-semibold transition-all whitespace-nowrap
                           shadow-[0_0_16px_rgba(124,58,237,0.4)] hover:shadow-[0_0_24px_rgba(124,58,237,0.55)]">
                {loading ? "…" : "Commencer →"}
              </button>
              <button onClick={() => setShowSticky(false)} className="text-slate-700 hover:text-slate-500 transition-colors ml-1 text-lg leading-none flex-shrink-0">×</button>
            </div>
          </div>
        </div>

        {/* Modal contact */}
        {contactOpen && (
          <ContactModal
            defaultSubject={contactSubject}
            onClose={() => setContactOpen(false)}
          />
        )}

        {/* Modal email */}
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={()=>setModal(false)}>
            <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-8 max-w-sm w-full"
              onClick={e=>e.stopPropagation()}>
              <h3 className="text-slate-100 font-semibold mb-2">Votre email</h3>
              <p className="text-slate-500 text-sm mb-4">Pour démarrer votre essai gratuit de 14 jours.</p>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="vous@exemple.com" autoFocus
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl
                           text-slate-200 placeholder-slate-600 text-sm mb-3
                           focus:outline-none focus:border-violet-500/50 transition-colors"/>
              <button onClick={()=>{setModal(false);pay();}} disabled={!email}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-40
                           text-white rounded-xl text-sm font-semibold transition-colors">
                Continuer →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
