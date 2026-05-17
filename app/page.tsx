"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import Link            from "next/link";
import { useUser }     from "@clerk/nextjs";
import ContactModal    from "@/components/ui/ContactModal";
import AnimatedDemo    from "@/components/landing/AnimatedDemo";
import { useToast }    from "@/components/ui/Toast";
import MagneticButton  from "@/components/ui/MagneticButton";
import Marquee         from "@/components/ui/Marquee";
import GradientBorder  from "@/components/ui/GradientBorder";
import SectionLabel    from "@/components/ui/SectionLabel";

// ─── Stripe ───────────────────────────────────────────────────────────────────
async function startCheckout(
  plan: "pro" | "agency",
  email: string,
  onError: (m: string) => void,
) {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      plan, email,
      successUrl: `${window.location.origin}/app?checkout=success`,
      cancelUrl:  `${window.location.origin}/?cancel`,
    }),
  });
  const data = await res.json() as { url?: string; error?: string };
  if (data.url) window.location.href = data.url;
  else onError(data.error || "Configuration Stripe manquante (STRIPE_PRICE_ID_PRO).");
}

// Lenis est maintenant global via SmoothScrollProvider dans layout.tsx

// ─── Scroll reveal ────────────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const obs = new IntersectionObserver(
      es => es.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("revealed"); obs.unobserve(e.target); }
      }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// ─── Compteur animé ───────────────────────────────────────────────────────────
function Counter({ end, suffix = "", duration = 1800 }: {
  end: number; suffix?: string; duration?: number;
}) {
  const [n, setN]  = useState(0);
  const ref        = useRef<HTMLSpanElement>(null);
  const done       = useRef(false);
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
// Gradient text  cyan électrique (brand)
function G({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand to-brand-dim">
      {children}
    </span>
  );
}

// ─── Eyebrow / kicker ────────────────────────────────────────────────────────
function Eyebrow({ children, cyan }: { children: React.ReactNode; cyan?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full
                     font-mono text-[10px] tracking-widest uppercase
                     ${cyan
                       ? "text-brand-400/80 border border-brand-400/15 bg-brand-500/[0.06]"
                       : "text-brand-300/80 border border-brand-400/15 bg-brand-500/[0.05]"}`}>
      {children}
    </span>
  );
}

// ─── Réseau de nœuds animé ───────────────────────────────────────────────────
function NodeNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dimensions réelles
    const setSize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    setSize();
    window.addEventListener("resize", setSize);

    type Node = { x: number; y: number; vx: number; vy: number; r: number; col: string; phase: number };
    const COLORS = ["0,229,255", "0,184,204", "0,229,255", "0,122,153"];
    const nodes: Node[] = Array.from({ length: 22 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: 1.5 + Math.random() * 2.5,
      col: COLORS[Math.floor(Math.random() * COLORS.length)],
      phase: Math.random() * Math.PI * 2,
    }));

    let raf: number;
    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      const W = canvas!.width, H = canvas!.height;

      // Connexions
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 190) {
            ctx!.beginPath();
            ctx!.moveTo(nodes[i].x, nodes[i].y);
            ctx!.lineTo(nodes[j].x, nodes[j].y);
            const a = (1 - d / 190) * 0.12;
            ctx!.strokeStyle = `rgba(0,229,255,${a})`;
            ctx!.lineWidth = 0.6;
            ctx!.stroke();
          }
        }
      }

      // Nœuds
      nodes.forEach(n => {
        n.phase += 0.018;
        const glow = 0.65 + Math.sin(n.phase) * 0.35;

        // Halo
        const g = ctx!.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 5);
        g.addColorStop(0, `rgba(${n.col},${glow * 0.35})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r * 5, 0, Math.PI * 2);
        ctx!.fillStyle = g;
        ctx!.fill();

        // Core
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${n.col},${glow})`;
        ctx!.fill();

        // Déplacement + rebond
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });

      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", setSize);
    };
  }, []);

  return (
    <canvas ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none opacity-35" />
  );
}

// ─── Carte 3D hero ────────────────────────────────────────────────────────────
const FAKE_LEADS = [
  { nom: "Dupont Plomberie", metier: "Plombier",    badge: "Intéressé",   col: "violet" },
  { nom: "Élec Martin",      metier: "Électricien", badge: "RDV pris",    col: "cyan"   },
  { nom: "Jardins Léa",      metier: "Paysagiste",  badge: "Ne rép. pas", col: "slate"  },
  { nom: "Peinture Sohier",  metier: "Peintre",     badge: "Intéressé",   col: "violet" },
];
const badgeClass = (c: string) =>
  c === "violet" ? "text-brand-400 bg-brand-500/15 border-brand-500/15"
  : c === "cyan" ? "text-brand-400  bg-brand-500/15  border-brand-400/20"
  :                "text-slate-500  bg-slate-500/10  border-slate-500/15";

function HeroCard3D() {
  const wrap   = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotX   = useSpring(mouseY, { stiffness: 80, damping: 18 });
  const rotY   = useSpring(mouseX, { stiffness: 80, damping: 18 });

  function onMove(e: React.MouseEvent) {
    const r = wrap.current!.getBoundingClientRect();
    mouseX.set(((e.clientX - r.left)  / r.width  - 0.5) * 22);
    mouseY.set(-((e.clientY - r.top) / r.height - 0.5) * 18);
  }
  const onLeave = () => { mouseX.set(0); mouseY.set(0); };

  return (
    <div ref={wrap} onMouseMove={onMove} onMouseLeave={onLeave}
         className="relative select-none" style={{ perspective: "1100px" }}>

      {/* Lueur dynamique */}
      <div className="absolute inset-0 -z-10 rounded-3xl blur-[90px] opacity-50 pointer-events-none"
           style={{ background: "radial-gradient(ellipse, rgba(0,229,255,0.35) 0%, rgba(0,229,255,0.12) 55%, transparent 75%)" }} />

      <motion.div style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}>

        {/* ── Interface principale ── */}
        <div className="rounded-2xl border border-white/[0.09] bg-[#090b11]/95 backdrop-blur-md overflow-hidden
                        shadow-[0_40px_100px_-20px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.04)_inset]">

          {/* Barre navigateur */}
          <div className="h-9 flex items-center gap-2 px-4 border-b border-white/[0.06] bg-white/[0.025]">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
            <div className="ml-3 h-5 w-[170px] rounded-md bg-white/[0.04] flex items-center px-2 gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
              <span className="text-[10px] text-slate-600 font-mono">prospeo.app/app</span>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-2 p-3">
            {[
              { l: "Leads totaux", v: "48",  c: "text-slate-100"   },
              { l: "Intéressés",   v: "12",  c: "text-brand-300"  },
              { l: "RDV à venir",  v: "3",   c: "text-brand-400"    },
            ].map(s => (
              <div key={s.l} className="bg-white/[0.03] rounded-xl p-2 border border-white/[0.05] text-center">
                <div className={`text-base font-bold leading-none ${s.c}`}>{s.v}</div>
                <div className="text-[9px] text-slate-600 uppercase tracking-wide mt-1">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Table mini */}
          <div className="px-3 pb-3">
            <div className="grid grid-cols-[1fr_72px_68px] gap-1.5 px-2 pb-1.5 border-b border-white/[0.05]">
              {["Prospect", "Métier", "Statut"].map(h => (
                <span key={h} className="text-[9px] text-slate-600 uppercase tracking-wider">{h}</span>
              ))}
            </div>
            {FAKE_LEADS.map((l, i) => (
              <div key={i}
                   className="grid grid-cols-[1fr_72px_68px] gap-1.5 items-center py-1.5
                              border-b border-white/[0.03] last:border-0 px-2">
                <span className="text-[11px] text-slate-200 font-medium truncate">{l.nom}</span>
                <span className="text-[10px] text-slate-500 truncate">{l.metier}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full border text-center truncate ${badgeClass(l.col)}`}>
                  {l.badge}
                </span>
              </div>
            ))}
          </div>
        </div>

      </motion.div>

      {/* ── Badges orbitaux (CSS pur — cross-browser garanti) ── */}
      <div className="absolute -top-5 -right-4 floaty-1 flex items-center gap-1.5 px-3 py-1.5 rounded-full
                   bg-[#0c0e16]/95 border border-brand-400/25 z-10
                   shadow-[0_0_22px_rgba(0,229,255,0.22)] text-[11px] whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shadow-[0_0_6px_rgba(0,229,255,0.9)]" />
        <span className="text-brand-300 font-medium">RDV pris · 14h30</span>
      </div>

      <div className="absolute -bottom-5 -left-4 floaty-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full
                   bg-[#0c0e16]/95 border border-brand-500/20 z-10
                   shadow-[0_0_20px_rgba(0,229,255,0.20)] text-[11px] whitespace-nowrap">
        <span className="text-xs">✉️</span>
        <span className="text-brand-300 font-medium">Offre envoyée</span>
      </div>

      <div className="absolute top-[38%] -right-12 floaty-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full
                   bg-[#0c0e16]/95 border border-emerald-400/20 z-10
                   shadow-[0_0_16px_rgba(52,211,153,0.14)] text-[10px] whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-emerald-300 font-mono">Session active</span>
      </div>

    </div>
  );
}

// ─── FAQ item ───────────────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div layout
      className="border border-white/[0.06] rounded-xl bg-white/[0.015] overflow-hidden"
      style={{ borderColor: open ? "rgba(0,229,255,0.15)" : "" }}>
      <button onClick={() => setOpen(o => !o)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left group">
        <span className="text-[14px] text-slate-200 font-medium group-hover:text-white transition-colors">{q}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-brand-400 text-lg flex-shrink-0 leading-none">
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
            <p className="px-5 pb-5 text-sm text-slate-500 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Landing() {
  const [email,       setEmail]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactSubj, setContactSubj] = useState("");
  const [emailModal,  setEmailModal]  = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const [showSticky,  setShowSticky]  = useState(false);
  const [annual,      setAnnual]      = useState(false);
  const { isSignedIn } = useUser();
  const { error: toastError } = useToast();

  useScrollReveal();

  useEffect(() => {
    const fn = () => {
      setScrolled(window.scrollY > 24);
      setShowSticky(window.scrollY > 800);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const openContact = (subject = "") => { setContactSubj(subject); setContactOpen(true); };

  const pay = useCallback(async (plan: "pro" | "agency" = "pro") => {
    if (!isSignedIn) {
      window.location.href = `/sign-up?redirect_url=${encodeURIComponent("/#pricing")}`;
      return;
    }
    if (!email) { setEmailModal(true); return; }
    setLoading(true);
    await startCheckout(plan, email, toastError);
    setLoading(false);
  }, [email, isSignedIn, toastError]);

  return (
    <>
      <style>{`
        :root { color-scheme: dark; }
        [data-reveal]{opacity:0;transform:translateY(24px);transition:opacity .75s cubic-bezier(.16,1,.3,1),transform .75s cubic-bezier(.16,1,.3,1)}
        [data-reveal].revealed{opacity:1;transform:none}
        [data-rd="1"]{transition-delay:.07s}[data-rd="2"]{transition-delay:.14s}
        [data-rd="3"]{transition-delay:.21s}[data-rd="4"]{transition-delay:.28s}
        @keyframes aurora{0%,100%{transform:translate3d(-6%,0,0)scale(1)}50%{transform:translate3d(6%,4%,0)scale(1.14)}}
        @keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
        @keyframes floaty1{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes floaty2{0%,100%{transform:translateY(0)}50%{transform:translateY(8px)}}
        @keyframes floaty3{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
        .aurora{animation:aurora 22s ease-in-out infinite}
        .floaty{animation:floaty 7s ease-in-out infinite}
        .floaty-1{animation:floaty1 4s ease-in-out infinite}
        .floaty-2{animation:floaty2 5.5s ease-in-out infinite 1.3s}
        .floaty-3{animation:floaty3 6.5s ease-in-out infinite 2.4s}
        .grain:before{content:"";position:fixed;inset:0;z-index:1;pointer-events:none;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.028'/%3E%3C/svg%3E");
          opacity:.5}
        html{scroll-behavior:auto!important}
      `}</style>

      <div className="grain relative min-h-screen bg-[#0A0A0B] text-slate-300 overflow-x-hidden antialiased">

        {/* ── Atmosphère ────────────────────────────────────────────────────── */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="aurora absolute -top-[25%] left-1/2 -translate-x-1/2 w-[1200px] h-[800px] rounded-full blur-[180px]"
               style={{ background: "radial-gradient(ellipse at center, rgba(0,229,255,0.20) 0%, rgba(0,229,255,0.06) 50%, transparent 70%)" }} />
          <div className="absolute top-[45%] -left-[15%] w-[700px] h-[700px] rounded-full blur-[160px]"
               style={{ background: "radial-gradient(circle, rgba(79,70,229,0.09), transparent 70%)" }} />
          <div className="absolute bottom-0 right-[-5%] w-[600px] h-[500px] rounded-full blur-[150px]"
               style={{ background: "radial-gradient(circle, rgba(0,229,255,0.06), transparent 70%)" }} />
          <div className="absolute inset-0"
               style={{
                 backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px, transparent 1px)",
                 backgroundSize: "72px 72px",
                 maskImage: "radial-gradient(ellipse at 50% 0%, black 0%, transparent 72%)",
               }} />
        </div>

        <div className="relative z-10">

          {/* ══════════════════════════════════════════════════════════════════
              NAV
          ══════════════════════════════════════════════════════════════════ */}
          <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300
            ${scrolled ? "bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-white/[0.06]" : "bg-transparent"}`}>
            <div className="max-w-6xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">

              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-700 flex items-center justify-center shadow-[0_0_18px_rgba(0,229,255,0.5)]">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <span className="text-slate-100 font-semibold tracking-tight text-[15px]">Prospeo</span>
              </Link>

              <div className="hidden md:flex items-center gap-8 text-[13px] text-slate-500">
                {[["#produit","Produit"],["#features","Fonctionnalités"],["#pricing","Tarifs"],["#faq","FAQ"]].map(([h,l]) => (
                  <a key={h} href={h} className="hover:text-slate-200 transition-colors">{l}</a>
                ))}
              </div>

              <div className="flex items-center gap-2.5">
                {isSignedIn ? (
                  <Link href="/app"
                    className="flex items-center gap-1.5 text-[13px] font-medium bg-white text-[#0A0A0B] px-4 py-2 rounded-full hover:bg-slate-200 transition-colors">
                    Ouvrir l&apos;app →
                  </Link>
                ) : (
                  <>
                    <Link href="/sign-in"
                      className="hidden sm:block text-[13px] text-slate-400 hover:text-slate-100 transition-colors px-3">
                      Connexion
                    </Link>
                    <a href="#pricing"
                      className="text-[13px] font-medium bg-white text-[#0A0A0B] px-4 py-2 rounded-full hover:bg-slate-200 transition-colors">
                      Essai gratuit
                    </a>
                  </>
                )}
              </div>
            </div>
          </nav>

          {/* ══════════════════════════════════════════════════════════════════
              §00 — HERO
          ══════════════════════════════════════════════════════════════════ */}
          <section className="relative px-5 sm:px-6 pt-32 sm:pt-40 pb-16 overflow-hidden">

            {/* Réseau de nœuds — fond du hero */}
            <div className="absolute inset-0 pointer-events-none">
              <NodeNetwork />
            </div>

            <div className="relative max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-[1fr_460px] gap-12 lg:gap-20 items-center">

                {/* ── Colonne texte ── */}
                <div>
                  <div data-reveal>
                    <Eyebrow>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      §00 — CRM de prospection · 14 jours offerts
                    </Eyebrow>
                  </div>

                  {/* Headline principal */}
                  <div data-reveal data-rd="1" className="mt-8">
                    <h1 className="text-[clamp(3rem,9vw,5.8rem)] font-bold leading-[0.94] tracking-[-0.04em] text-slate-50">
                      Trouve.<br />
                      Appelle.<br />
                      <G>Signe.</G>
                    </h1>
                  </div>

                  <div data-reveal data-rd="2" className="mt-7">
                    <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-lg">
                      Le CRM qui réunit le sourcing Maps + INPI, le téléprompter d&apos;appel,
                      les relances automatiques et le suivi RDV —
                      dans un seul flux pensé pour le terrain.
                    </p>
                  </div>

                  <div data-reveal data-rd="3" className="mt-8 flex flex-col sm:flex-row gap-3">
<MagneticButton variant="primary" onClick={() => pay("pro")} disabled={loading}>{loading ? "Redirection" : <>«Commencer gratuitement<span className="ml-1">→</span></>}</MagneticButton>
                    <MagneticButton variant="ghost" href="#produit">Voir le produit</MagneticButton>
                  </div>
                  <p data-reveal data-rd="4" className="mt-3 text-xs text-slate-700">
                    Sans carte bancaire · résiliable à tout moment
                  </p>
                </div>

                {/* ── Carte 3D ── */}
                <div data-reveal data-rd="2" className="hidden lg:block">
                  <HeroCard3D />
                </div>
              </div>

              {/* Métriques */}
              <div data-reveal className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center border-t border-white/[0.05] pt-14">
                {[
                  { v: <Counter end={50}  suffix="+" />, l: "leads en 1 clic",       c: "text-slate-100" },
                  { v: <Counter end={100} suffix="%" />, l: "relances tracées",       c: "text-brand-300" },
                  { v: <Counter end={14}  suffix="j" />, l: "d'essai offert",         c: "text-brand-400"   },
                  { v: "0€",                             l: "pour démarrer",          c: "text-slate-100"  },
                ].map((s, i) => (
                  <div key={i}>
                    <div className={`text-2xl sm:text-3xl font-bold tracking-tight ${s.c}`}>{s.v}</div>
                    <div className="text-xs text-slate-600 mt-1">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* §01  MARQUEE */}
          <div className="border-y border-white/[0.05] py-5 overflow-hidden">
            <Marquee speed={38} gap={56} className="opacity-35 hover:opacity-60 transition-opacity duration-700">
              {["Google Maps API", "API RNE / INPI", "Relances auto",
                "Session d'appels", "Scripts téléprompter", "Vue Kanban",
                "Dashboard funnel", "Import CSV", "Enrichissement auto", "Rappels multi-paliers",
              ].map(label => (
                <div key={label} className="flex items-center gap-3">
                  <span className="w-1 h-1 rounded-full" style={{ background: '#00E5FF' }} />
                  <span className="text-[11px] font-mono text-text-mute tracking-wider whitespace-nowrap">{label}</span>
                </div>
              ))}
            </Marquee>
          </div>

          <section id="produit" className="px-5 sm:px-6 py-24 sm:py-32">
            <div className="max-w-5xl mx-auto">
              <div data-reveal className="text-center mb-14">
                <Eyebrow>§02 — Le constat</Eyebrow>
                <h2 className="mt-6 text-3xl sm:text-5xl font-bold text-slate-50 tracking-[-0.02em] leading-tight">
                  Le tableur ne t&apos;a jamais<br />rappelé un seul client.
                </h2>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { t: "Avant",         tone: "bad", items: ["Leads éparpillés dans Excel", "Scripts sur un bout de papier", "Rappels oubliés systématiquement", "Zéro visibilité sur la conversion"] },
                  { t: "Avec Prospeo",  tone: "mid", items: ["Sourcing auto Maps + INPI", "Téléprompter en direct d'appel", "Rappels visuels + alertes auto", "Funnel temps réel"] },
                  { t: "Le résultat",   tone: "good", items: ["2× plus de leads qualifiés", "Meilleur taux de closing", "0 relance oubliée", "Décisions basées sur les données"] },
                ].map((c, i) => (
                  <div key={i} data-reveal data-rd={String(i + 1)}
                    className={`p-7 rounded-2xl border backdrop-blur-sm transition-all
                      ${c.tone === "bad"  ? "border-white/[0.06] bg-white/[0.02]"
                      : c.tone === "mid"  ? "border-brand-500/20 bg-brand-500/[0.05] shadow-[0_0_60px_-20px_rgba(0,229,255,0.45)]"
                      :                     "border-brand-400/20 bg-brand-500/[0.04]"}`}>
                    <div className={`text-[10px] font-mono uppercase tracking-widest mb-5
                      ${c.tone === "bad" ? "text-slate-600" : c.tone === "mid" ? "text-brand-300" : "text-brand-400"}`}>
                      {c.t}
                    </div>
                    <ul className="space-y-3">
                      {c.items.map(it => (
                        <li key={it} className={`flex items-start gap-2.5 text-sm
                          ${c.tone === "bad" ? "text-slate-500" : "text-slate-300"}`}>
                          {c.tone === "bad"
                            ? <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-700" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            : <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-brand-400" viewBox="0 0 12 12" fill="none"><path d="M1.5 6l3.5 3.5 5.5-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          }
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>


          {/* §03  SOCIAL PROOF */}
          <section className="px-5 sm:px-6 py-20 sm:py-28 border-t border-white/[0.05] overflow-hidden">
            <div className="max-w-5xl mx-auto">

              {/* Métriques clés */}
              <div data-reveal className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                {[
                  { v: "50+",    l: "Leads sourcés",          sub: "en moins de 5 min",  accent: "text-brand" },
                  { v: "8 RDV",  l: "Première semaine",       sub: "mode session d'appels", accent: "text-text" },
                  { v: "3 →",    l: "Paliers de relance auto", sub: "J+3, J+7, J+15",    accent: "text-text" },
                  { v: "0",     l: "Pour démarrer",          sub: "14j Pro offerts",    accent: "text-brand" },
                ].map((s, i) => (
                  <div key={i} data-reveal data-rd={String(i+1)}
                    className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex flex-col gap-1">
                    <div className={`text-3xl font-bold tracking-tight ${s.accent}`}>{s.v}</div>
                    <div className="text-sm text-text-dim font-medium">{s.l}</div>
                    <div className="text-[11px] font-mono text-text-mute">{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Témoignage */}
              <div data-reveal
                className="relative p-8 sm:p-12 rounded-3xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[100px] opacity-15 pointer-events-none"
                     style={{ background: "radial-gradient(circle,rgba(0,229,255,0.6),transparent 70%)" }} />
                {/* Quote mark */}
                <div className="text-6xl font-bold text-brand/20 leading-none mb-6 select-none">"</div>
                <blockquote className="text-xl sm:text-2xl font-medium text-text leading-relaxed max-w-2xl">
                  J'enchaîne les leads Maps, le script s'affiche pendant l'appel, et les relances partent seules.
                  <span className="text-brand"> J'ai pris 8 RDV la première semaine.</span>
                </blockquote>
                <div className="mt-8 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand/30 to-brand-deep/30 border border-brand/20 flex items-center justify-center text-brand font-bold text-sm">T</div>
                  <div>
                    <div className="text-sm font-semibold text-text">Commercial indépendant</div>
                    <div className="text-[11px] font-mono text-text-mute">Prospection artisans  Paris</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
              §04 — FEATURES + démo intégrée
          ══════════════════════════════════════════════════════════════════ */}
          <section id="features" className="px-5 sm:px-6 py-24 sm:py-32 border-t border-white/[0.05]">
            <div className="max-w-6xl mx-auto">
              <div data-reveal className="text-center mb-14">
                <Eyebrow>§04 — Fonctionnalités</Eyebrow>
                <h2 className="mt-6 text-3xl sm:text-5xl font-bold text-slate-50 tracking-[-0.02em] leading-tight">
                  Tout le pipeline.<br /><G>Un seul écran.</G>
                </h2>
              </div>

              <div className="flex flex-col gap-4">

                {/* ── Démo animée — pleine largeur, chrome intégré dans le composant ── */}
                <div data-reveal className="relative rounded-3xl border border-white/[0.08] overflow-hidden
                                            shadow-[0_40px_100px_-20px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.04)_inset]">
                  <div className="absolute -inset-x-0 -top-16 h-48 -z-10 blur-[80px] opacity-40 pointer-events-none"
                       style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.40), rgba(0,229,255,0.10) 55%, transparent 75%)" }} />
                  <AnimatedDemo />
                </div>

                {/* ── Grille 3×2 — aucune carte isolée ── */}
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    {
                      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
                      t: "Sourcing automatique",
                      d: "Métier + ville → leads Maps en secondes. INPI pour cibler les entreprises récentes. Enrichissement auto des numéros.",
                      col: "violet", tags: ["Google Maps","INPI / RNE","Auto-scraping 8h"]
                    },
                    {
                      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.63 19.79 19.79 0 01.01 4 2 2 0 012 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9.91A16 16 0 0014.09 17.91l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 18.92v-2z"/></svg>,
                      t: "Mode session d'appels",
                      d: "Plein écran, numéro géant cliquable, script live, résultat en 1 touche. Stats en temps réel.",
                      col: "neutral"
                    },
                    {
                      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                      t: "Recherche INPI",
                      d: "Entreprises créées < 3 mois  les prospects les plus chauds du marché, triés par date de création.",
                      col: "cyan"
                    },
                    {
                      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
                      t: "Scripts téléprompter",
                      d: "Cold call + closing Google Ads. Objections pliables, étapes visibles pendant l'appel.",
                      col: "neutral"
                    },
                    {
                      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
                      t: "Dashboard de conversion",
                      d: "Funnel basé sur les vrais échanges. Taux de décrochage réel, RDV à venir, calendrier mensuel.",
                      col: "neutral"
                    },
                    {
                      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
                      t: "Emails & relances auto",
                      d: "3 templates Gmail, envoi depuis ta propre adresse. Relances multi-paliers J+3 → J+7 → J+15.",
                      col: "neutral"
                    },
                  ].map((f, i) => (
                    <div key={i} data-reveal data-rd={String((i % 3) + 1)}
                      className={`group relative p-7 rounded-3xl border overflow-hidden transition-all
                        ${f.col === "violet" ? "border-brand-500/15 bg-brand-500/[0.05] hover:border-brand-500/30"
                        : f.col === "cyan"   ? "border-brand-400/18  bg-brand-500/[0.04]   hover:border-brand-400/32"
                        :                      "border-white/[0.06]  bg-white/[0.02]      hover:bg-white/[0.04] hover:border-white/[0.12]"}`}>
                      {f.col !== "neutral" && (
                        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity pointer-events-none"
                             style={{ background: "radial-gradient(circle,rgba(0,229,255,0.5),transparent 70%)" }} />
                      )}
                      <div className="relative">
                        <div className={`mb-4 w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110
                          ${f.col !== "neutral" ? "bg-brand/10 text-brand" : "bg-white/[0.04] text-text-mute"}`}>
                          {f.icon}
                        </div>
                        <h3 className="text-[15px] font-semibold text-slate-100 mb-1.5">{f.t}</h3>
                        <p className={`text-sm leading-relaxed ${f.col === "neutral" ? "text-slate-500" : "text-slate-400"}`}>{f.d}</p>
                        {f.tags && (
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {f.tags.map(tag => (
                              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-slate-500">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
              §05 — HOW
          ══════════════════════════════════════════════════════════════════ */}
          <section className="px-5 sm:px-6 py-24 sm:py-32 border-t border-white/[0.05]">
            <div className="max-w-5xl mx-auto">
              <div data-reveal className="text-center mb-16">
                <Eyebrow cyan>§05 — En pratique</Eyebrow>
                <h2 className="mt-6 text-3xl sm:text-5xl font-bold text-slate-50 tracking-[-0.02em] leading-tight">
                  Zéro à ton premier RDV<br /><G>en moins d&apos;une heure.</G>
                </h2>
              </div>
              <div className="grid md:grid-cols-3 gap-5 relative">
                <div className="hidden md:block absolute top-7 left-[16%] right-[16%] h-px
                                bg-gradient-to-r from-brand-500/30 via-brand-500/20 to-brand-500/30" />
                {[
                  { n: "01", t: "Source",    d: "Scrape Maps, importe l'INPI ou un CSV. Leads normalisés, prêts à appeler.", col: "violet" },
                  { n: "02", t: "Appelle",   d: "Lance une session : script affiché, résultat en 1 touche, journal auto.", col: "cyan"   },
                  { n: "03", t: "Convertis", d: "Relances multi-paliers automatiques, emails de suivi, funnel temps réel.", col: "violet" },
                ].map((s, i) => (
                  <div key={i} data-reveal data-rd={String(i + 1)} className="relative text-center md:text-left">
                    <div className={`inline-flex w-14 h-14 rounded-2xl items-center justify-center font-mono font-bold
                                    bg-[#0A0A0B] border relative z-10 mb-5
                                    ${s.col === "cyan"
                                      ? "border-brand-400/30 text-brand-300 shadow-[0_0_28px_-8px_rgba(0,229,255,0.5)]"
                                      : "border-brand-500/25 text-brand-300 shadow-[0_0_28px_-8px_rgba(0,229,255,0.5)]"}`}>
                      {s.n}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-100 mb-2">{s.t}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{s.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
              §06 — COMPARATIF
          ══════════════════════════════════════════════════════════════════ */}
          <section className="px-5 sm:px-6 py-24 sm:py-32 border-t border-white/[0.05]">
            <div className="max-w-4xl mx-auto">
              <div data-reveal className="text-center mb-14">
                <Eyebrow>§06 — Comparatif</Eyebrow>
                <h2 className="mt-6 text-3xl sm:text-4xl font-bold text-slate-50 tracking-[-0.02em]">
                  Pourquoi pas Notion ou HubSpot&nbsp;?
                </h2>
              </div>
              <div data-reveal className="rounded-2xl border border-white/[0.08] overflow-x-auto backdrop-blur-sm bg-white/[0.012]">
                <table className="w-full min-w-[520px]">
                  <thead>
                    <tr className="border-b border-white/[0.07] bg-white/[0.025]">
                      <th className="p-4 text-left text-[11px] text-slate-600 uppercase tracking-widest font-semibold w-[40%]">Critère</th>
                      {[["✦ Prospeo", true], ["Notion CRM", false], ["HubSpot Free", false]].map(([n, h]) => (
                        <th key={n as string} className={`p-4 text-center text-sm font-semibold ${h ? "text-brand-300" : "text-slate-500"}`}>
                          {n as string}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Sourcing leads (Maps + INPI)",   true,      false,      false],
                      ["Téléprompter d'appel en direct", true,      false,      false],
                      ["Relances multi-paliers auto",    true,      false,      true ],
                      ["Journal d'activité automatique", true,      false,      true ],
                      ["Funnel & taux de décrochage",    true,      false,      true ],
                      ["Vue Kanban + session d'appels",  true,      false,      false],
                      ["Import/export CSV",              true,      true,       true ],
                      ["Prix mensuel",                  "19€",     "0-16€",    "0€ (très limité)"],
                      ["Prise en main",                 "< 1h",    "Moyenne",  "Élevée"],
                    ].map((r, i) => (
                      <tr key={i} className={`border-b border-white/[0.05] last:border-0 ${i % 2 ? "bg-white/[0.01]" : ""}`}>
                        <td className="p-3.5 text-sm text-slate-400">{r[0] as string}</td>
                        {[r[1], r[2], r[3]].map((v, j) => (
                          <td key={j} className={`p-3.5 text-center text-sm ${j === 0 ? "bg-brand-500/[0.05]" : ""}`}>
                            {typeof v === "boolean"
                              ? (v
                                  ? <svg className={`w-4 h-4 mx-auto ${j === 0 ? "text-brand-300" : "text-emerald-500/50"}`} viewBox="0 0 12 12" fill="none"><path d="M1.5 6l3.5 3.5 5.5-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  : <svg className="w-4 h-4 mx-auto text-slate-700" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>)
                              : <span className={j === 0 ? "text-brand-200 font-medium" : "text-slate-500"}>{v as string}</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>


          {/* ══════════════════════════════════════════════════════════════════
              §07 — PRICING
          ══════════════════════════════════════════════════════════════════ */}
          <section id="pricing" className="px-5 sm:px-6 py-24 sm:py-32 border-t border-white/[0.05]">
            <div className="max-w-5xl mx-auto">
              <div data-reveal className="text-center mb-12">
                <Eyebrow>§07 — Tarifs</Eyebrow>
                <h2 className="mt-6 text-3xl sm:text-5xl font-bold text-slate-50 tracking-[-0.02em]">
                  Simple. <G>Transparent.</G>
                </h2>

                {/* Toggle mensuel / annuel */}
                <div className="mt-8 flex items-center justify-center gap-3">
                  <span className={`text-sm transition-colors ${!annual ? "text-slate-200" : "text-slate-500"}`}>Mensuel</span>
                  <button
                    onClick={() => setAnnual(a => !a)}
                    className="relative w-12 h-6 rounded-full bg-white/[0.08] border border-white/[0.1] transition-colors"
                    style={{ background: annual ? "rgba(0,229,255,0.15)" : undefined }}>
                    <motion.span
                      className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-brand-400 shadow-[0_0_10px_rgba(0,229,255,0.5)]"
                      animate={{ x: annual ? 24 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                  </button>
                  <span className={`text-sm transition-colors ${annual ? "text-slate-200" : "text-slate-500"}`}>
                    Annuel
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-brand-500/20 text-brand-300">-20%</span>
                  </span>
                </div>

                <div className="mt-8 max-w-sm mx-auto">
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.09] rounded-xl text-center
                               text-slate-200 placeholder-slate-600 text-sm focus:outline-none
                               focus:border-brand-500/50 transition-colors" />
                  <p className="text-xs text-slate-600 mt-2">Saisissez votre email puis choisissez un plan</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-5 items-start">
                {[
                  {
                    name: "Gratuit", monthlyPrice: "0", annualPrice: "0",
                    desc: "Pour découvrir et faire ses premiers appels.",
                    feats: ["100 leads max", "3 scrapings Maps/mois", "Rappels & RDV", "Journal d'activité"],
                    cta: "Créer un compte", onClick: () => { window.location.href = "/sign-up"; }, hl: false,
                  },
                  {
                    name: "Pro", monthlyPrice: "19", annualPrice: "15",
                    desc: "La prospection systématique, sans limite.",
                    feats: ["Leads illimités", "Maps + INPI illimités", "Mode session d'appels", "Scripts téléprompter", "Dashboard + funnel", "Emails & relances auto", "Import / Export CSV"],
                    cta: "Commencer 14j gratuit", onClick: () => pay("pro"), hl: true,
                  },
                  {
                    name: "Agence", monthlyPrice: "49", annualPrice: "39",
                    desc: "Pour les équipes à fort volume.",
                    feats: ["Tout Pro inclus", "5 utilisateurs", "Leads partagés", "Onboarding dédié", "Support prioritaire"],
                    cta: "Nous contacter", onClick: () => openContact("Plan Agence Prospeo"), hl: false,
                  },
                ].map(p => {
                  const displayPrice = annual ? p.annualPrice : p.monthlyPrice;
                  const card = (
                    <div key={p.name} data-reveal
                      className={`relative flex flex-col p-7 rounded-3xl transition-all ${p.hl ? "bg-gradient-to-b from-brand-500/[0.06] to-transparent md:-mt-3 md:pb-10" : "border border-white/[0.07] bg-white/[0.02]"}`}>
                      {p.hl && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full
                                         text-[11px] font-semibold bg-white text-[#0A0A0B]">
                          Le plus populaire
                        </span>
                      )}
                      <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{p.name}</div>
                      <div className="mt-3 flex items-end gap-1.5">
                        <motion.span
                          key={displayPrice}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-4xl font-bold text-slate-50">
                          {displayPrice}€
                        </motion.span>
                        {displayPrice !== "0" && (
                          <span className="text-slate-500 mb-1 text-sm">/mois
                            {annual && <span className="ml-1 text-[10px] text-brand-400 font-mono">· annuel</span>}
                          </span>
                        )}
                      </div>
                      {annual && p.monthlyPrice !== "0" && (
                        <p className="text-[11px] text-slate-600 mt-0.5 font-mono">
                          soit {parseInt(p.annualPrice) * 12}€/an — économie {(parseInt(p.monthlyPrice) - parseInt(p.annualPrice)) * 12}€
                        </p>
                      )}
                      <p className="mt-2 text-sm text-slate-500">{p.desc}</p>
                      <ul className="mt-6 space-y-2.5 flex-1">
                        {p.feats.map(f => (
                          <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                            <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-brand-400" viewBox="0 0 12 12" fill="none"><path d="M1.5 6l3.5 3.5 5.5-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button onClick={p.onClick} disabled={loading && p.hl}
                        className={`mt-7 w-full py-3 rounded-full text-sm font-semibold transition-all ${p.hl ? "bg-white text-[#0A0A0B] hover:bg-slate-200 disabled:opacity-50" : "border border-white/[0.12] text-slate-200 hover:bg-white/[0.05]"}`}>
                        {loading && p.hl ? "Redirection" : p.cta}
                      </button>
                    </div>
                  );
                  return p.hl ? (
                    <GradientBorder key={p.name} rounded="rounded-3xl" speed={6000}
                      innerClass="bg-transparent" className="md:-mt-3">
                      {card}
                    </GradientBorder>
                  ) : card;
                })}
              </div>
              <p data-reveal className="text-center text-xs text-slate-600 mt-10">
                14 jours gratuits sur Pro · sans carte bancaire · résiliable à tout moment
              </p>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
              §08 — FAQ
          ══════════════════════════════════════════════════════════════════ */}
          <section id="faq" className="px-5 sm:px-6 py-24 sm:py-32 border-t border-white/[0.05]">
            <div className="max-w-2xl mx-auto">
              <div data-reveal className="text-center mb-14">
                <Eyebrow>§08 — FAQ</Eyebrow>
                <h2 className="mt-6 text-3xl sm:text-4xl font-bold text-slate-50 tracking-[-0.02em]">
                  Questions directes.
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

          {/* ══════════════════════════════════════════════════════════════════
              §09 — CTA FINAL
          ══════════════════════════════════════════════════════════════════ */}
          <section className="px-5 sm:px-6 py-28 sm:py-44 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[1000px] h-[550px] rounded-full blur-[180px] opacity-50"
                   style={{ background: "radial-gradient(ellipse, rgba(0,229,255,0.25) 0%, rgba(0,229,255,0.08) 50%, transparent 70%)" }} />
            </div>
            <div data-reveal className="relative max-w-2xl mx-auto text-center">
              <p className="font-mono text-[10px] text-slate-600 uppercase tracking-[0.18em] mb-6">§09 — Commence maintenant</p>
              <h2 className="text-4xl sm:text-6xl font-bold text-slate-50 tracking-[-0.03em] leading-[1.04]">
                Prospecte comme<br /><G>un closer.</G>
              </h2>
              <p className="mt-6 text-slate-400">Structure ta prospection. Mesure tes résultats. Signe plus.</p>
              <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="flex-1 px-4 py-3.5 bg-white/[0.04] border border-white/[0.09] rounded-full
                             text-center sm:text-left text-slate-200 placeholder-slate-600 text-sm
                             focus:outline-none focus:border-brand-500/50 transition-colors" />
                <MagneticButton variant="primary" onClick={() => pay("pro")} disabled={loading}>
                  {loading ? "" : "Commencer →"}
                </MagneticButton>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
              FOOTER
          ══════════════════════════════════════════════════════════════════ */}
          <footer className="relative border-t border-white/[0.05] px-5 sm:px-6 pt-16 pb-10 overflow-hidden">
            {/* Glow top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent" />
            <div className="max-w-6xl mx-auto">
              {/* Main footer grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">

                {/* Brand */}
                <div className="col-span-2 md:col-span-1">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.25)]">
                      <span className="text-bg text-sm font-bold">P</span>
                    </div>
                    <span className="text-text font-semibold tracking-tight">Prospeo</span>
                  </div>
                  <p className="text-xs text-text-mute leading-relaxed max-w-[200px]">
                    CRM de prospection pour commerciaux indépendants et artisans.
                  </p>
                  <div className="mt-5 flex items-center gap-3">
                    {/* LinkedIn SVG */}
                    <a href="https://linkedin.com" target="_blank" rel="noopener"
                       className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-text-mute hover:text-brand hover:border-brand/25 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
                    </a>
                    {/* Mail SVG */}
                    <button onClick={() => openContact()}
                       className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-text-mute hover:text-brand hover:border-brand/25 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    </button>
                  </div>
                </div>

                {/* Produit */}
                <div>
                  <div className="text-[10px] font-mono text-text-mute uppercase tracking-widest mb-4">Produit</div>
                  <div className="space-y-3">
                    {[["#features","Fonctionnalités"],["#pricing","Tarifs"],["#faq","FAQ"],["#produit","Démo"]].map(([h,l]) => (
                      <a key={h} href={h} className="block text-sm text-text-mute hover:text-text transition-colors">{l}</a>
                    ))}
                  </div>
                </div>

                {/* Compte */}
                <div>
                  <div className="text-[10px] font-mono text-text-mute uppercase tracking-widest mb-4">Compte</div>
                  <div className="space-y-3">
                    <Link href="/sign-in" className="block text-sm text-text-mute hover:text-text transition-colors">Connexion</Link>
                    <Link href="/sign-up" className="block text-sm text-text-mute hover:text-text transition-colors">Créer un compte</Link>
                    <Link href="/app"     className="block text-sm text-text-mute hover:text-text transition-colors">Ouvrir l&apos;app</Link>
                  </div>
                </div>

                {/* Legal */}
                <div>
                  <div className="text-[10px] font-mono text-text-mute uppercase tracking-widest mb-4">Légal</div>
                  <div className="space-y-3">
                    <button onClick={() => openContact("Mentions légales")}
                      className="block text-sm text-text-mute hover:text-text transition-colors">Mentions légales</button>
                    <button onClick={() => openContact("Confidentialité")}
                      className="block text-sm text-text-mute hover:text-text transition-colors">Confidentialité</button>
                    <button onClick={() => openContact()}
                      className="block text-sm text-text-mute hover:text-text transition-colors">Contact</button>
                  </div>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="mt-14 pt-8 border-t border-white/[0.04]
                              flex flex-col sm:flex-row justify-between gap-2 items-center">
                <span className="text-[11px] font-mono text-text-mute">© 2026 Prospeo  Tous droits réservés</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  <span className="text-[11px] font-mono text-text-mute">Système opérationnel</span>
                </div>
                <span className="text-[11px] font-mono text-text-mute">Conçu par Téo Mikulic</span>
              </div>
            </div>
          </footer>

        </div>{/* /relative z-10 */}

        {/* ── Sticky CTA ────────────────────────────────────────────────────── */}
        <div className={`fixed bottom-0 inset-x-0 z-40 transition-all duration-500
          ${showSticky ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}>
          <div className="mx-auto max-w-xl mb-4 px-4">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#111114]/95 border border-brand-500/15 backdrop-blur-xl
                            shadow-[0_0_40px_rgba(0,229,255,0.18),0_8px_32px_rgba(0,0,0,0.6)]">
              <span className="text-sm text-slate-300 font-medium flex-1 min-w-0 truncate">
                Essai 14 jours — gratuit
              </span>
              <button onClick={() => pay("pro")} disabled={loading}
                className="px-4 py-2 rounded-full bg-white text-[#0A0A0B] text-xs font-semibold
                           hover:bg-slate-200 transition-all disabled:opacity-50 whitespace-nowrap">
                {loading ? "…" : "Commencer →"}
              </button>
              <button onClick={() => setShowSticky(false)}
                className="text-slate-600 hover:text-slate-400 text-xl leading-none">×</button>
            </div>
          </div>
        </div>

        {/* ── Modals ────────────────────────────────────────────────────────── */}
        {contactOpen && (
          <ContactModal defaultSubject={contactSubj} onClose={() => setContactOpen(false)} />
        )}

        {emailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
               onClick={() => setEmailModal(false)}>
            <div className="bg-[#111114] border border-white/10 rounded-2xl p-8 max-w-sm w-full"
                 onClick={e => e.stopPropagation()}>
              <h3 className="text-slate-100 font-semibold mb-2">Votre email</h3>
              <p className="text-slate-500 text-sm mb-4">Pour démarrer votre essai gratuit de 14 jours.</p>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="vous@exemple.com" autoFocus
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl
                           text-slate-200 placeholder-slate-600 text-sm mb-3
                           focus:outline-none focus:border-brand-500/50 transition-colors" />
              <button onClick={() => { setEmailModal(false); pay(); }} disabled={!email}
                className="w-full py-3 bg-white text-[#0A0A0B] disabled:opacity-40
                           rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">
                Continuer →
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}



