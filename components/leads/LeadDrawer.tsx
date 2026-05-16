"use client";

import { useState, useEffect } from "react";
import { Lead, TAG_COLORS, TAG_OPTIONS, RDV_STATUT_COLORS } from "./types";
import { Activity } from "@/lib/db";
import { toWhatsAppUrl } from "@/lib/phone";
import { usePlan } from "@/hooks/usePlan";
import UpgradeGate from "@/components/ui/UpgradeGate";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmModal";
import VoiceButton from "@/components/ui/VoiceButton";

interface Props {
  lead: Lead | null;
  onClose: () => void;
  onSaved: (updated: Lead) => void;
  onDeleted: (lead: Lead) => void;
}

const RDV_STATUTS = [
  { value: "",           label: "—"          },
  { value: "en_attente", label: "En attente" },
  { value: "confirme",   label: "Confirmé"   },
  { value: "annule",     label: "Annulé"     },
  { value: "effectue",   label: "Effectué"   },
];

const ADS_TYPES = ["", "Leads", "Appels", "Trafic", "Visibilité"];

// ── Icônes et couleurs du journal ─────────────────────────────────────────────

const ACTIVITY_ICONS: Record<string, string> = {
  statut: "🔄",
  email:  "📧",
  note:   "💬",
  appel:  "📞",
};

const ACTIVITY_COLORS: Record<string, string> = {
  statut: "text-violet-400",
  email:  "text-cyan-400",
  note:   "text-slate-400",
  appel:  "text-green-400",
};

function formatActivityDate(iso: string): string {
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const date      = iso.slice(0, 10);
  const time      = iso.slice(11, 16);
  if (date === today)     return `Aujourd'hui · ${time}`;
  if (date === yesterday) return `Hier · ${time}`;
  return `${new Date(date + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · ${time}`;
}

// ── Panel email inline ────────────────────────────────────────────────────────

type EmailTemplate = "offre" | "rdv_confirmation" | "rdv_rappel";

const EMAIL_TEMPLATES: { value: EmailTemplate; label: string; icon: string; desc: string }[] = [
  { value: "offre",            icon: "🚀", label: "Offre semaine gratuite", desc: "Présente la semaine de test Google Ads"       },
  { value: "rdv_confirmation", icon: "✅", label: "Confirmation RDV",       desc: "Confirme la date et l'heure de l'échange"    },
  { value: "rdv_rappel",       icon: "⏰", label: "Rappel J-1",             desc: "Rappel la veille du RDV"                     },
];

interface EmailPanelProps {
  lead: Lead;
  onClose: () => void;
  onSent: (activity: Activity) => void;
}

function EmailPanel({ lead, onClose, onSent }: EmailPanelProps) {
  const [template, setTemplate] = useState<EmailTemplate>("offre");
  const [to,       setTo]       = useState(lead.ads_email || "");
  const [sending,  setSending]  = useState(false);
  const [error,    setError]    = useState("");

  async function send() {
    if (!to.trim()) { setError("Entrez l'adresse email du contact."); return; }
    if (template === "offre" && !lead.site) { setError("Ce lead n'a pas de site web (requis pour le template Offre)."); return; }
    if (template === "rdv_confirmation" && !lead.rdv_date) { setError("Aucune date de RDV renseignée."); return; }

    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template,
          to:            to.trim(),
          nomEntreprise: lead.nom,
          prenom:        lead.ads_prenom || "là",
          urlSite:       lead.site,
          rdvDate:       lead.rdv_date,
          rdvHeure:      lead.rdv_heure,
          leadNom:       lead.nom,
          leadTelephone: lead.telephone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur envoi");

      // Activité synthétique pour mise à jour immédiate du journal
      const labels: Record<string, string> = {
        offre:            "Offre semaine gratuite envoyée",
        rdv_confirmation: "Confirmation RDV envoyée",
        rdv_rappel:       "Rappel J-1 envoyé",
      };
      onSent({
        id:      Date.now().toString(),
        date:    new Date().toISOString().slice(0, 16),
        type:    "email",
        content: labels[template],
        meta:    to.trim(),
      });
      onClose();
      // Toast succès géré par le parent via onSent
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border-b border-white/8 bg-cyan-500/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-cyan-300">Envoyer un email</span>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
      </div>

      {/* Sélecteur de template */}
      <div className="grid grid-cols-3 gap-2">
        {EMAIL_TEMPLATES.map(t => (
          <button
            key={t.value}
            onClick={() => setTemplate(t.value)}
            className={[
              "flex flex-col items-center gap-1 px-2 py-2 rounded-lg border text-center transition-colors",
              template === t.value
                ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                : "bg-white/3 border-white/8 text-slate-500 hover:text-slate-300 hover:bg-white/5",
            ].join(" ")}
          >
            <span className="text-base">{t.icon}</span>
            <span className="text-xs font-medium leading-tight">{t.label}</span>
            <span className="text-xs text-slate-600 leading-tight hidden">{t.desc}</span>
          </button>
        ))}
      </div>

      {/* Description du template sélectionné */}
      <p className="text-xs text-slate-600 italic">
        {EMAIL_TEMPLATES.find(t => t.value === template)?.desc}
      </p>

      {/* Champ email */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Destinataire</label>
        <input
          type="email"
          value={to}
          onChange={e => setTo(e.target.value)}
          placeholder="contact@entreprise.fr"
          className="input-base w-full"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        onClick={send}
        disabled={sending}
        className="w-full h-8 rounded-md bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition-colors disabled:opacity-40"
      >
        {sending ? "Envoi…" : "Envoyer"}
      </button>
    </div>
  );
}

// ── Journal d'activité ────────────────────────────────────────────────────────

interface JournalProps {
  lead: Lead;
  activities: Activity[];
  onAdded: (a: Activity) => void;
}

function Journal({ lead, activities, onAdded }: JournalProps) {
  const [note,    setNote]    = useState("");
  const [saving,  setSaving]  = useState(false);

  async function addNote() {
    const text = note.trim();
    if (!text) return;
    setSaving(true);
    try {
      const res = await fetch("/api/leads/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: lead.nom, telephone: lead.telephone, type: "note", content: text }),
      });
      const data = await res.json();
      if (res.ok && data.activity) {
        onAdded(data.activity as Activity);
        setNote("");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Saisie rapide */}
      <div className="flex gap-2">
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addNote()}
          placeholder="Ajouter une note rapide…"
          className="input-base flex-1 text-xs"
        />
        <VoiceButton
          onTranscript={t => setNote(prev => (prev ? prev + " " : "") + t)}
          className="h-8 w-8 rounded-md border border-white/8"
        />
        <button
          onClick={addNote}
          disabled={saving || !note.trim()}
          className="h-8 px-3 rounded-md bg-white/8 hover:bg-white/12 text-slate-400 text-xs disabled:opacity-30 transition-colors"
        >
          +
        </button>
      </div>

      {/* Timeline */}
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-700 gap-2">
          <span className="text-xl">📋</span>
          <p className="text-xs text-center">Aucune activité enregistrée.<br/>Les changements de statut apparaîtront ici.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Ligne verticale */}
          <div className="absolute left-[7px] top-2 bottom-0 w-px bg-white/8" />

          <div className="space-y-3 pl-5">
            {activities.map((a) => (
              <div key={a.id} className="relative">
                {/* Dot */}
                <div className={`absolute -left-5 top-1 w-3.5 h-3.5 rounded-full bg-[#0f1117] border-2 flex items-center justify-center text-[8px] ${
                  a.type === "statut" ? "border-violet-500" :
                  a.type === "email"  ? "border-cyan-500"   :
                  a.type === "appel"  ? "border-green-500"  : "border-slate-600"
                }`}>
                </div>
                <div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className={`text-xs font-medium ${ACTIVITY_COLORS[a.type] || "text-slate-400"}`}>
                      {ACTIVITY_ICONS[a.type]} {a.content}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-700">{formatActivityDate(a.date)}</span>
                    {a.meta && a.type === "email" && (
                      <span className="text-xs text-slate-700">· {a.meta}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Drawer principal ──────────────────────────────────────────────────────────

export default function LeadDrawer({ lead, onClose, onSaved, onDeleted }: Props) {
  const [form,       setForm]       = useState<Lead | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [tab,        setTab]        = useState<"suivi" | "ads" | "rdv">("suivi");
  const [newService, setNewService] = useState("");
  const [emailOpen,  setEmailOpen]  = useState(false);
  // Copie locale des activités pour mise à jour immédiate sans recharger
  const [activities, setActivities] = useState<Activity[]>([]);
  const { plan, loading: planLoading } = usePlan();
  const { success, error: toastError } = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    if (lead) {
      setForm({ ...lead });
      setTab("suivi");
      setEmailOpen(false);
      setActivities([...(lead.activities || [])]);
    }
  }, [lead]);

  if (!lead || !form) return null;

  function set<K extends keyof Lead>(key: K, value: Lead[K]) {
    setForm(prev => prev ? { ...prev, [key]: value } : prev);
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      const res  = await fetch("/api/leads/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur sauvegarde");

      // Utiliser le lead retourné par l'API directement (pas de re-fetch global)
      if (data.lead) {
        const updatedActivities = Array.isArray(data.lead.activities)
          ? (data.lead.activities as unknown as Activity[])
          : [];
        setActivities(updatedActivities);
        onSaved({ ...form, activities: updatedActivities, rappel: data.lead.rappel ?? form.rappel });
      } else {
        onSaved(form);
      }
      success("Lead sauvegardé");
    } catch (e) {
      toastError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteLead() {
    if (!lead) return;
    const ok = await confirm({
      title:        `Supprimer "${lead.nom}" ?`,
      message:      "Le lead et son journal d'activité seront définitivement supprimés.",
      confirmLabel: "Supprimer",
      danger:       true,
    });
    if (!ok) return;
    try {
      const res = await fetch("/api/leads/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: lead.nom, telephone: lead.telephone }),
      });
      if (!res.ok) throw new Error("Erreur suppression");
      onDeleted(lead);
      success("Lead supprimé");
    } catch (e) {
      toastError((e as Error).message);
    }
  }

  function addService() {
    if (!form) return;
    const s = newService.trim();
    if (!s || form.ads_services.includes(s)) return;
    set("ads_services", [...form.ads_services, s]);
    setNewService("");
  }

  function removeService(s: string) {
    if (!form) return;
    set("ads_services", form.ads_services.filter(x => x !== s));
  }

  function handleActivityAdded(a: Activity) {
    setActivities(prev => [a, ...prev]);
  }

  const tagCls = TAG_COLORS[form.tag] || "bg-slate-700 text-slate-300";

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 h-screen w-full sm:w-[480px] bg-[#0f1117] border-l border-white/8 z-50 flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/8">
          <div>
            <h2 className="text-base font-semibold text-slate-100">{form.nom}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{form.metier} · {form.emplacement}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Bouton email — masqué si plan free */}
            {!planLoading && (plan === "pro" || plan === "agency") ? (
              <button
                onClick={() => setEmailOpen(v => !v)}
                title="Envoyer un email"
                className={[
                  "h-8 px-3 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5",
                  emailOpen
                    ? "bg-cyan-600/30 text-cyan-300 border-cyan-500/30"
                    : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10",
                ].join(" ")}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
                </svg>
                Email
              </button>
            ) : !planLoading ? (
              <a
                href="/#pricing"
                title="Fonctionnalité Pro — Passer Pro"
                className="h-8 px-3 rounded-md text-xs font-medium border border-white/10 bg-white/5 text-slate-600 flex items-center gap-1.5 cursor-pointer hover:bg-white/10 transition-colors"
              >
                🔒 Email
              </a>
            ) : null}
            {/* Bouton WhatsApp */}
            {form.telephone && (
              <a
                href={toWhatsAppUrl(form.telephone)}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 px-3 rounded-md bg-green-600/20 text-green-400 text-xs font-medium border border-green-500/20 hover:bg-green-600/30 transition-colors flex items-center gap-1.5"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Appeler
              </a>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 transition-colors flex items-center justify-center">
              ✕
            </button>
          </div>
        </div>

        {/* Panel email (inline) */}
        {emailOpen && (
          <EmailPanel
            lead={form}
            onClose={() => setEmailOpen(false)}
            onSent={(a) => { handleActivityAdded(a); setEmailOpen(false); success("Email envoyé ✓"); }}
          />
        )}

        {/* Infos rapides */}
        <div className="flex items-center gap-3 px-5 py-2.5 border-b border-white/5 text-xs text-slate-500 mono flex-wrap">
          {form.telephone && <span>{form.telephone}</span>}
          {form.site && (
            <a href={form.site} target="_blank" rel="noopener noreferrer"
               className="text-violet-400 hover:underline truncate max-w-[200px]">
              {form.site.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/8">
          {(["suivi", "ads", "rdv"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                "flex-1 py-2.5 text-xs font-medium capitalize transition-colors",
                tab === t
                  ? "text-violet-400 border-b-2 border-violet-500"
                  : "text-slate-500 hover:text-slate-300",
              ].join(" ")}
            >
              {t === "suivi" ? "Suivi" : t === "ads" ? "Google Ads" : "RDV"}
            </button>
          ))}
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ── Onglet Suivi ── */}
          {tab === "suivi" && (
            <>
              <Field label="Statut">
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      onClick={() => set("tag", o.value)}
                      className={[
                        "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                        form.tag === o.value
                          ? `${tagCls} border-current`
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200",
                      ].join(" ")}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Rappel">
                <input type="date" value={form.rappel} onChange={e => set("rappel", e.target.value)}
                  className="input-base w-40" />
              </Field>

              <Field label="Note">
                <textarea value={form.note} onChange={e => set("note", e.target.value)}
                  rows={3}
                  className="input-base w-full resize-none" />
              </Field>

              {/* ── Journal d'activité ── */}
              <div className="pt-2 border-t border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400">Journal d&apos;activité</span>
                  {activities.length > 0 && (
                    <span className="text-xs text-slate-700 mono">{activities.length} entrée{activities.length > 1 ? "s" : ""}</span>
                  )}
                </div>
                <Journal
                  lead={form}
                  activities={activities}
                  onAdded={handleActivityAdded}
                />
              </div>
            </>
          )}

          {/* ── Onglet Google Ads ── */}
          {tab === "ads" && (
            <UpgradeGate feature="ads" plan={plan} loading={planLoading} blur>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Prénom client">
                  <input value={form.ads_prenom} onChange={e => set("ads_prenom", e.target.value)} className="input-base w-full" />
                </Field>
                <Field label="Nom client">
                  <input value={form.ads_nomclient} onChange={e => set("ads_nomclient", e.target.value)} className="input-base w-full" />
                </Field>
                <Field label="Entreprise">
                  <input value={form.ads_entreprise} onChange={e => set("ads_entreprise", e.target.value)} className="input-base w-full" />
                </Field>
                <Field label="Téléphone">
                  <input value={form.ads_tel} onChange={e => set("ads_tel", e.target.value)} className="input-base w-full mono" />
                </Field>
                <Field label="Email">
                  <input type="email" value={form.ads_email} onChange={e => set("ads_email", e.target.value)} className="input-base w-full" />
                </Field>
                <Field label="Statut">
                  <input value={form.ads_statut} onChange={e => set("ads_statut", e.target.value)} className="input-base w-full" />
                </Field>
                <Field label="Zone">
                  <input value={form.ads_zone} onChange={e => set("ads_zone", e.target.value)} className="input-base w-full" />
                </Field>
                <Field label="Rayon">
                  <input value={form.ads_rayon} onChange={e => set("ads_rayon", e.target.value)} className="input-base w-full" />
                </Field>
                <Field label="Budget">
                  <input value={form.ads_budget} onChange={e => set("ads_budget", e.target.value)} className="input-base w-full mono" />
                </Field>
                <Field label="Type de campagne">
                  <select value={form.ads_type} onChange={e => set("ads_type", e.target.value)} className="input-base w-full">
                    {ADS_TYPES.map(t => <option key={t} value={t}>{t || "—"}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Services">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.ads_services.map(s => (
                    <span key={s} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-900/40 text-violet-300 text-xs">
                      {s}
                      <button onClick={() => removeService(s)} className="hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newService} onChange={e => setNewService(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addService())}
                    placeholder="Ajouter un service…"
                    className="input-base flex-1" />
                  <button onClick={addService} className="px-3 py-1 rounded-md bg-violet-600/30 text-violet-300 text-xs hover:bg-violet-600/50">+</button>
                </div>
              </Field>

              <Field label="Notes Ads">
                <textarea value={form.ads_notes} onChange={e => set("ads_notes", e.target.value)}
                  rows={3} className="input-base w-full resize-none" />
              </Field>
            </UpgradeGate>
          )}

          {/* ── Onglet RDV ── */}
          {tab === "rdv" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date">
                  <input type="date" value={form.rdv_date} onChange={e => set("rdv_date", e.target.value)} className="input-base w-full" />
                </Field>
                <Field label="Heure">
                  <input type="time" value={form.rdv_heure} onChange={e => set("rdv_heure", e.target.value)} className="input-base w-full mono" />
                </Field>
              </div>

              <Field label="Statut RDV">
                <div className="flex flex-wrap gap-2">
                  {RDV_STATUTS.filter(s => s.value).map(s => {
                    const cls = RDV_STATUT_COLORS[s.value] || "";
                    return (
                      <button key={s.value} onClick={() => set("rdv_statut", s.value)}
                        className={[
                          "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                          form.rdv_statut === s.value ? `${cls} border-current` : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200",
                        ].join(" ")}>
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Lieu">
                <input value={form.rdv_lieu} onChange={e => set("rdv_lieu", e.target.value)} className="input-base w-full" />
              </Field>

              <Field label="Notes RDV">
                <textarea value={form.rdv_notes} onChange={e => set("rdv_notes", e.target.value)}
                  rows={3} className="input-base w-full resize-none" />
              </Field>

              {/* Raccourcis email RDV */}
              {(form.rdv_date || form.rdv_heure) && (
                <div className="pt-3 border-t border-white/5">
                  <p className="text-xs text-slate-600 mb-2">Envoyer un email lié au RDV :</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEmailOpen(true)}
                      className="flex items-center gap-1.5 h-7 px-3 rounded-md bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10 text-xs transition-colors"
                    >
                      ✅ Confirmer le RDV
                    </button>
                    <button
                      onClick={() => setEmailOpen(true)}
                      className="flex items-center gap-1.5 h-7 px-3 rounded-md bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10 text-xs transition-colors"
                    >
                      ⏰ Rappel J-1
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/8">
          <button onClick={deleteLead}
            className="px-3 py-1.5 rounded-md text-xs text-red-400 hover:bg-red-900/20 transition-colors">
            Supprimer
          </button>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs text-slate-400 hover:bg-white/5 transition-colors">
              Annuler
            </button>
            <button onClick={save} disabled={saving}
              className="px-4 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-xs font-medium text-white transition-colors">
              {saving ? "Sauvegarde…" : "Sauvegarder"}
            </button>
          </div>
        </div>
      </aside>

      <style jsx>{`
        .input-base {
          height: 32px;
          padding: 0 10px;
          border-radius: 6px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 13px;
          color: #e2e8f0;
          outline: none;
          transition: border-color 0.15s;
          font-family: inherit;
        }
        .input-base:focus { border-color: rgba(139,92,246,0.5); }
        textarea.input-base { height: auto; padding: 8px 10px; }
        select.input-base option { background: #1a1d27; }
      `}</style>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      {children}
    </div>
  );
}
