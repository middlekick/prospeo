"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link                               from "next/link";
import { usePlan }                        from "@/hooks/usePlan";
import GoogleAdsScriptViewer              from "@/components/scripts/GoogleAdsScriptViewer";
import { useToast }                       from "@/components/ui/Toast";
import { useConfirm }                      from "@/components/ui/ConfirmModal";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Objection { q: string; a: string; }

interface Block {
  id:          string;
  type:        "say" | "pause" | "mindset" | "objections";
  label:       string;
  text?:       string;
  objections?: Objection[];
}

interface Step {
  id:          string;
  emoji?:      string;
  name:        string;
  time?:       string;
  mindset?:    string;
  say?:        string[];    // lignes du speech (séparées par \n dans l'éditeur)
  pause?:      string;
  objections?: Objection[];
}

interface UserScript {
  id:        string;
  type:      "cold_call" | "closing";
  title:     string;
  createdAt: string;
  updatedAt: string;
  blocks?:   Block[];   // cold_call
  steps?:    Step[];    // closing
}

// ─────────────────────────────────────────────────────────────────────────────
// Persistance localStorage
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = "prospeo_scripts";

function loadScripts(): UserScript[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveScripts(scripts: UserScript[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(scripts));
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ─────────────────────────────────────────────────────────────────────────────
// Composants lecture — téléprompter
// ─────────────────────────────────────────────────────────────────────────────

function ObjectionList({ objections }: { objections: Objection[] }) {
  const [open, setOpen] = useState(false);
  const filtered = objections.filter(o => o.q);
  if (!filtered.length) return null;
  return (
    <div className="mt-5">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-400 transition-colors"
      >
        <span className={`transition-transform duration-150 ${open ? "rotate-90" : ""}`}>▶</span>
        Objections ({filtered.length})
      </button>
      {open && (
        <div className="mt-3 space-y-3 pl-4 border-l border-white/[0.08]">
          {filtered.map((obj, i) => (
            <div key={i} className="space-y-1">
              <div className="text-xs text-slate-500 italic">— {obj.q}</div>
              <div className="text-sm text-slate-300 leading-relaxed pl-2">{obj.a}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TeleprompterBlocks({ blocks, showMindset }: { blocks: Block[]; showMindset: boolean }) {
  return (
    <div className="space-y-10">
      {blocks.map((block) => {
        if (block.type === "mindset") {
          if (!showMindset) return null;
          return (
            <div key={block.id} className="px-4 py-3 rounded-lg bg-brand-900/20 border border-brand-500/20">
              <div className="text-xs font-bold tracking-widest text-brand-500/70 mb-1.5">{block.label || "MINDSET"}</div>
              {block.text && <p className="text-sm text-brand-300/80 italic leading-relaxed">{block.text}</p>}
            </div>
          );
        }
        if (block.type === "pause") {
          return (
            <div key={block.id}>
              <div className="text-xs font-bold tracking-widest text-orange-500/50 mb-3">{block.label || "PAUSE"}</div>
              {block.text && (
                <div className="space-y-2">
                  {block.text.split("\n").map((line, j) => {
                    const isArrow = line.startsWith("→");
                    return (
                      <div key={j} className="flex items-start gap-2 text-sm">
                        {isArrow
                          ? <><span className="text-orange-500/50 shrink-0 mt-0.5">→</span><span className="text-slate-500">{line.slice(1).trim()}</span></>
                          : <span className="text-orange-400/70">{line}</span>
                        }
                      </div>
                    );
                  })}
                </div>
              )}
              {block.objections && <ObjectionList objections={block.objections} />}
            </div>
          );
        }
        if (block.type === "objections") {
          return (
            <div key={block.id}>
              <div className="text-xs font-bold tracking-widest text-yellow-500/50 mb-3">{block.label || "OBJECTIONS"}</div>
              {block.objections && <ObjectionList objections={block.objections} />}
            </div>
          );
        }
        // say
        return (
          <div key={block.id}>
            <div className="text-xs font-bold tracking-widest text-cyan-500/50 mb-4">{block.label || "SAY"}</div>
            {block.text && (
              <p className="text-[1.35rem] leading-[1.7] text-white font-light tracking-wide">
                &ldquo;{block.text}&rdquo;
              </p>
            )}
            {block.objections && <ObjectionList objections={block.objections} />}
          </div>
        );
      })}
    </div>
  );
}

function TeleprompterSteps({ steps, showMindset }: { steps: Step[]; showMindset: boolean }) {
  const [current, setCurrent] = useState(0);
  const step = steps[current];

  return (
    <div className="flex h-full min-h-0">
      {/* Sidebar étapes */}
      <nav className="w-48 shrink-0 border-r border-white/[0.06] py-3 overflow-y-auto bg-white/[0.01]">
        {steps.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setCurrent(i)}
            className={[
              "w-full relative flex items-center gap-2.5 px-3 py-2.5 text-left transition-all",
              current === i
                ? "bg-brand-500/15 text-brand-200"
                : "text-slate-600 hover:text-slate-300 hover:bg-white/[0.05]",
            ].join(" ")}
          >
            {current === i && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-r-full bg-gradient-to-b from-brand-400 to-brand-600" />
            )}
            <span className="text-sm shrink-0">{s.emoji || String(i + 1)}</span>
            <span className="text-xs leading-tight">{s.name}</span>
          </button>
        ))}
      </nav>

      {/* Contenu étape */}
      <div className="flex-1 overflow-auto px-10 py-8">
        {step && (
          <>
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-3">
                {step.emoji && <span className="text-2xl">{step.emoji}</span>}
                <div>
                  <h3 className="text-base font-semibold text-slate-200">{step.name}</h3>
                  {step.time && <div className="text-xs text-slate-600 mono mt-0.5">{step.time}</div>}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrent(prev => Math.max(0, prev - 1))}
                  disabled={current === 0}
                  className="h-7 w-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-slate-400 text-sm disabled:opacity-20 transition-all"
                >←</button>
                <span className="text-xs text-slate-600 mono px-1">{current + 1}/{steps.length}</span>
                <button
                  onClick={() => setCurrent(prev => Math.min(steps.length - 1, prev + 1))}
                  disabled={current === steps.length - 1}
                  className="h-7 w-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-slate-400 text-sm disabled:opacity-20 transition-all"
                >→</button>
              </div>
            </div>

            {step.mindset && showMindset && (
              <div className="mb-6 px-4 py-3 rounded-lg bg-brand-900/20 border border-brand-500/20">
                <div className="text-xs font-bold tracking-widest text-brand-500/70 mb-1.5">MINDSET</div>
                <p className="text-sm text-brand-300/80 italic leading-relaxed">{step.mindset}</p>
              </div>
            )}

            {step.say && step.say.filter(Boolean).length > 0 && (
              <div className="space-y-5">
                {step.say.filter(Boolean).map((line, i) => (
                  <p key={i} className="text-[1.35rem] leading-[1.7] text-white font-light tracking-wide">
                    &ldquo;{line}&rdquo;
                  </p>
                ))}
              </div>
            )}

            {step.pause && (
              <div className="mt-6 space-y-2">
                {step.pause.split("\n").map((line, i) => {
                  const isArrow = line.startsWith("→");
                  return (
                    <div key={i} className={`flex items-start gap-2 text-sm ${isArrow ? "text-orange-300/60" : "text-orange-400/80"}`}>
                      {i === 0 && !isArrow && <span className="shrink-0 mt-0.5">⏸</span>}
                      {isArrow
                        ? <><span className="text-orange-500/50 shrink-0">→</span><span className="text-slate-500">{line.slice(1).trim()}</span></>
                        : <span>{line}</span>
                      }
                    </div>
                  );
                })}
              </div>
            )}

            {step.objections && step.objections.length > 0 && (
              <ObjectionList objections={step.objections} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Éditeur de script
// ─────────────────────────────────────────────────────────────────────────────

function BlockEditor({
  block, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast,
}: {
  block: Block;
  onChange: (b: Block) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const typeColors: Record<string, string> = {
    say:        "border-cyan-500/30 bg-cyan-500/[0.04]",
    pause:      "border-orange-500/30 bg-orange-500/[0.04]",
    mindset:    "border-brand-500/30 bg-brand-500/[0.04]",
    objections: "border-yellow-500/30 bg-yellow-500/[0.04]",
  };
  const typeLabel: Record<string, string> = {
    say: "Discours", pause: "Pause / instructions", mindset: "Mindset", objections: "Objections",
  };

  function addObjection() {
    onChange({ ...block, objections: [...(block.objections || []), { q: "", a: "" }] });
  }
  function updateObjection(i: number, field: "q" | "a", val: string) {
    const objs = [...(block.objections || [])];
    objs[i] = { ...objs[i], [field]: val };
    onChange({ ...block, objections: objs });
  }
  function removeObjection(i: number) {
    onChange({ ...block, objections: (block.objections || []).filter((_, j) => j !== i) });
  }

  return (
    <div className={`rounded-xl border ${typeColors[block.type] || "border-white/10 bg-white/[0.02]"} p-4`}>
      {/* En-tête bloc */}
      <div className="flex items-center gap-2 mb-3">
        <select
          value={block.type}
          onChange={e => onChange({ ...block, type: e.target.value as Block["type"] })}
          className="appearance-none h-7 px-2 pr-7 rounded-md bg-[#1a1d27] border border-white/10
                     text-xs text-slate-300 focus:outline-none focus:border-brand-500/50 cursor-pointer [color-scheme:dark]"
        >
          <option value="say">Discours</option>
          <option value="pause">Pause</option>
          <option value="mindset">Mindset</option>
          <option value="objections">Objections</option>
        </select>
        <input
          value={block.label}
          onChange={e => onChange({ ...block, label: e.target.value })}
          placeholder={typeLabel[block.type]}
          className="flex-1 h-7 px-2 rounded-md bg-transparent border border-white/8 text-xs text-slate-300
                     placeholder-slate-600 focus:outline-none focus:border-brand-500/40"
        />
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={onMoveUp} disabled={isFirst} className="h-6 w-6 rounded bg-white/[0.05] text-slate-500 hover:text-slate-200 disabled:opacity-20 text-xs transition-all">↑</button>
          <button onClick={onMoveDown} disabled={isLast} className="h-6 w-6 rounded bg-white/[0.05] text-slate-500 hover:text-slate-200 disabled:opacity-20 text-xs transition-all">↓</button>
          <button onClick={onDelete} className="h-6 w-6 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs transition-all">✕</button>
        </div>
      </div>

      {/* Corps selon le type */}
      {(block.type === "say" || block.type === "pause" || block.type === "mindset") && (
        <textarea
          value={block.text || ""}
          onChange={e => onChange({ ...block, text: e.target.value })}
          placeholder={
            block.type === "say"     ? "Ce que vous dites — utilisez de longues phrases naturelles…" :
            block.type === "pause"   ? "Instructions entre les répliques\n→ Si oui : passer à l'étape suivante\n→ Si non : gérer l'objection" :
                                       "État d'esprit à adopter pendant cette phase…"
          }
          rows={3}
          className="w-full bg-[#13151e] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-slate-200
                     placeholder-slate-700 focus:outline-none focus:border-brand-500/40 resize-y leading-relaxed"
        />
      )}

      {/* Objections */}
      {(block.type === "say" || block.type === "objections") && (
        <div className="mt-3 space-y-2">
          {(block.objections || []).map((obj, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                value={obj.q}
                onChange={e => updateObjection(i, "q", e.target.value)}
                placeholder="Objection du prospect…"
                className="flex-1 h-7 px-2 rounded-md bg-[#13151e] border border-white/8 text-xs text-slate-300
                           placeholder-slate-700 focus:outline-none focus:border-yellow-500/30"
              />
              <input
                value={obj.a}
                onChange={e => updateObjection(i, "a", e.target.value)}
                placeholder="Votre réponse…"
                className="flex-1 h-7 px-2 rounded-md bg-[#13151e] border border-white/8 text-xs text-slate-300
                           placeholder-slate-700 focus:outline-none focus:border-cyan-500/30"
              />
              <button onClick={() => removeObjection(i)} className="h-7 w-7 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs shrink-0 transition-all">✕</button>
            </div>
          ))}
          <button
            onClick={addObjection}
            className="text-xs text-slate-600 hover:text-slate-300 transition-colors flex items-center gap-1"
          >
            + Ajouter une objection
          </button>
        </div>
      )}
    </div>
  );
}

function StepEditor({
  step, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast,
}: {
  step: Step;
  onChange: (s: Step) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  function addObjection() {
    onChange({ ...step, objections: [...(step.objections || []), { q: "", a: "" }] });
  }
  function updateObjection(i: number, field: "q" | "a", val: string) {
    const objs = [...(step.objections || [])];
    objs[i] = { ...objs[i], [field]: val };
    onChange({ ...step, objections: objs });
  }
  function removeObjection(i: number) {
    onChange({ ...step, objections: (step.objections || []).filter((_, j) => j !== i) });
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 space-y-3">
      {/* En-tête étape */}
      <div className="flex items-center gap-2">
        <input
          value={step.emoji || ""}
          onChange={e => onChange({ ...step, emoji: e.target.value })}
          placeholder="🎯"
          className="w-10 h-7 text-center rounded-md bg-white/[0.06] border border-white/8 text-sm focus:outline-none focus:border-brand-500/40"
        />
        <input
          value={step.name}
          onChange={e => onChange({ ...step, name: e.target.value })}
          placeholder="Nom de l'étape…"
          className="flex-1 h-7 px-2 rounded-md bg-transparent border border-white/8 text-sm text-slate-200
                     placeholder-slate-600 focus:outline-none focus:border-brand-500/40 font-medium"
        />
        <input
          value={step.time || ""}
          onChange={e => onChange({ ...step, time: e.target.value })}
          placeholder="⏱ 30s"
          className="w-20 h-7 px-2 rounded-md bg-transparent border border-white/8 text-xs text-slate-500
                     placeholder-slate-700 focus:outline-none focus:border-brand-500/40 mono"
        />
        <div className="flex items-center gap-1">
          <button onClick={onMoveUp} disabled={isFirst} className="h-6 w-6 rounded bg-white/[0.05] text-slate-500 hover:text-slate-200 disabled:opacity-20 text-xs transition-all">↑</button>
          <button onClick={onMoveDown} disabled={isLast} className="h-6 w-6 rounded bg-white/[0.05] text-slate-500 hover:text-slate-200 disabled:opacity-20 text-xs transition-all">↓</button>
          <button onClick={onDelete} className="h-6 w-6 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs transition-all">✕</button>
        </div>
      </div>

      {/* Mindset */}
      <div>
        <label className="text-[10px] font-bold tracking-widest text-brand-500/60 block mb-1">MINDSET (optionnel)</label>
        <input
          value={step.mindset || ""}
          onChange={e => onChange({ ...step, mindset: e.target.value })}
          placeholder="État d'esprit à adopter…"
          className="w-full h-7 px-2 rounded-md bg-[#13151e] border border-white/8 text-xs text-slate-300
                     placeholder-slate-700 focus:outline-none focus:border-brand-500/30"
        />
      </div>

      {/* Ce qu'on dit */}
      <div>
        <label className="text-[10px] font-bold tracking-widest text-cyan-500/60 block mb-1">CE QU&apos;ON DIT</label>
        <textarea
          value={(step.say || []).join("\n")}
          onChange={e => onChange({ ...step, say: e.target.value.split("\n") })}
          placeholder={"Première réplique…\nDeuxième réplique (une par ligne)…"}
          rows={3}
          className="w-full bg-[#13151e] border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-200
                     placeholder-slate-700 focus:outline-none focus:border-cyan-500/30 resize-y leading-relaxed"
        />
        <p className="text-[10px] text-slate-700 mt-1">Une réplique par ligne — chaque ligne devient un paragraphe téléprompter</p>
      </div>

      {/* Pause / instructions */}
      <div>
        <label className="text-[10px] font-bold tracking-widest text-orange-500/60 block mb-1">PAUSE / INSTRUCTIONS (optionnel)</label>
        <textarea
          value={step.pause || ""}
          onChange={e => onChange({ ...step, pause: e.target.value })}
          placeholder={"Attendre la réaction du prospect\n→ Si intéressé : continuer\n→ Sinon : gérer l'objection"}
          rows={2}
          className="w-full bg-[#13151e] border border-white/8 rounded-lg px-3 py-2 text-xs text-slate-400
                     placeholder-slate-700 focus:outline-none focus:border-orange-500/20 resize-y"
        />
      </div>

      {/* Objections */}
      <div>
        <label className="text-[10px] font-bold tracking-widest text-yellow-500/60 block mb-1">OBJECTIONS</label>
        <div className="space-y-2">
          {(step.objections || []).map((obj, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                value={obj.q}
                onChange={e => updateObjection(i, "q", e.target.value)}
                placeholder="Objection…"
                className="flex-1 h-7 px-2 rounded-md bg-[#13151e] border border-white/8 text-xs text-slate-300
                           placeholder-slate-700 focus:outline-none focus:border-yellow-500/30"
              />
              <input
                value={obj.a}
                onChange={e => updateObjection(i, "a", e.target.value)}
                placeholder="Réponse…"
                className="flex-1 h-7 px-2 rounded-md bg-[#13151e] border border-white/8 text-xs text-slate-300
                           placeholder-slate-700 focus:outline-none focus:border-cyan-500/30"
              />
              <button onClick={() => removeObjection(i)} className="h-7 w-7 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs shrink-0">✕</button>
            </div>
          ))}
          <button onClick={addObjection} className="text-xs text-slate-600 hover:text-slate-300 transition-colors flex items-center gap-1">
            + Ajouter une objection
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Vue éditeur complet
// ─────────────────────────────────────────────────────────────────────────────

function ScriptEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: UserScript;
  onSave: (script: UserScript) => void;
  onCancel: () => void;
}) {
  const [title, setTitle]       = useState(initial?.title || "");
  const [type, setType]         = useState<"cold_call" | "closing">(initial?.type || "cold_call");
  const [blocks, setBlocks]     = useState<Block[]>(initial?.blocks || []);
  const [steps, setSteps]       = useState<Step[]>(initial?.steps || []);

  function addBlock(t: Block["type"]) {
    setBlocks(prev => [...prev, { id: genId(), type: t, label: "", text: "", objections: [] }]);
  }
  function updateBlock(id: string, b: Block) {
    setBlocks(prev => prev.map(x => x.id === id ? b : x));
  }
  function removeBlock(id: string) {
    setBlocks(prev => prev.filter(x => x.id !== id));
  }
  function moveBlock(idx: number, dir: -1 | 1) {
    setBlocks(prev => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[idx + dir];
      next[idx + dir] = temp;
      return next;
    });
  }

  function addStep() {
    setSteps(prev => [...prev, { id: genId(), name: "", emoji: "", say: [], objections: [] }]);
  }
  function updateStep(id: string, s: Step) {
    setSteps(prev => prev.map(x => x.id === id ? s : x));
  }
  function removeStep(id: string) {
    setSteps(prev => prev.filter(x => x.id !== id));
  }
  function moveStep(idx: number, dir: -1 | 1) {
    setSteps(prev => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[idx + dir];
      next[idx + dir] = temp;
      return next;
    });
  }

  function handleSave() {
    if (!title.trim()) return;
    const now = new Date().toISOString();
    const script: UserScript = {
      id:        initial?.id || genId(),
      type,
      title:     title.trim(),
      createdAt: initial?.createdAt || now,
      updatedAt: now,
      blocks:    type === "cold_call" ? blocks : undefined,
      steps:     type === "closing"   ? steps  : undefined,
    };
    onSave(script);
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="h-px bg-gradient-to-r from-transparent via-brand-500/25 to-transparent shrink-0" />

      {/* Header éditeur */}
      <header className="flex items-center gap-3 pl-14 md:pl-5 pr-5 py-3 border-b border-white/[0.05] shrink-0 bg-[#080b12]/70 backdrop-blur-md">
        <button onClick={onCancel} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200 transition-colors">
          ← Retour
        </button>
        <div className="w-px h-4 bg-white/10" />
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Titre du script…"
          className="flex-1 bg-transparent text-sm font-semibold text-slate-100 placeholder-slate-600
                     focus:outline-none border-b border-transparent focus:border-brand-500/40 pb-0.5 transition-colors"
        />
        {/* Type selector */}
        <div className="flex gap-1 bg-white/[0.05] border border-white/[0.08] rounded-xl p-1">
          {[["cold_call", "Cold Call"], ["closing", "Closing"]] .map(([val, label]) => (
            <button key={val} onClick={() => setType(val as "cold_call" | "closing")}
              className={[
                "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                type === val
                  ? "bg-brand-500/25 text-brand-200"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]",
              ].join(" ")}>
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={handleSave}
          disabled={!title.trim()}
          className="flex items-center gap-1.5 h-7 px-4 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Enregistrer
        </button>
      </header>

      {/* Corps éditeur */}
      <div className="flex-1 overflow-auto">

        {/* Cold Call — blocs linéaires */}
        {type === "cold_call" && (
          <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-600">Script linéaire — les blocs s&apos;affichent dans l&apos;ordre lors de la lecture</p>
              <span className="text-xs mono text-slate-700">{blocks.length} bloc{blocks.length > 1 ? "s" : ""}</span>
            </div>
            {blocks.map((block, i) => (
              <BlockEditor
                key={block.id}
                block={block}
                onChange={b => updateBlock(block.id, b)}
                onDelete={() => removeBlock(block.id)}
                onMoveUp={() => moveBlock(i, -1)}
                onMoveDown={() => moveBlock(i, 1)}
                isFirst={i === 0}
                isLast={i === blocks.length - 1}
              />
            ))}
            {/* Boutons ajout */}
            <div className="pt-2 flex flex-wrap gap-2">
              {[
                { type: "say" as const,        label: "+ Discours",    color: "border-cyan-500/20 text-cyan-600 hover:text-cyan-300 hover:border-cyan-500/40"     },
                { type: "pause" as const,      label: "+ Pause",       color: "border-orange-500/20 text-orange-600 hover:text-orange-300 hover:border-orange-500/40" },
                { type: "mindset" as const,    label: "+ Mindset",     color: "border-brand-500/20 text-brand-600 hover:text-brand-300 hover:border-brand-500/40" },
                { type: "objections" as const, label: "+ Objections",  color: "border-yellow-500/20 text-yellow-600 hover:text-yellow-300 hover:border-yellow-500/40" },
              ].map(btn => (
                <button key={btn.type} onClick={() => addBlock(btn.type)}
                  className={`h-8 px-4 rounded-lg border text-xs font-medium transition-all ${btn.color}`}>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Closing — étapes */}
        {type === "closing" && (
          <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-600">Script en étapes — navigables via la sidebar lors de la lecture</p>
              <span className="text-xs mono text-slate-700">{steps.length} étape{steps.length > 1 ? "s" : ""}</span>
            </div>
            {steps.map((step, i) => (
              <StepEditor
                key={step.id}
                step={step}
                onChange={s => updateStep(step.id, s)}
                onDelete={() => removeStep(step.id)}
                onMoveUp={() => moveStep(i, -1)}
                onMoveDown={() => moveStep(i, 1)}
                isFirst={i === 0}
                isLast={i === steps.length - 1}
              />
            ))}
            <button
              onClick={addStep}
              className="w-full h-10 rounded-xl border border-dashed border-white/10 text-xs text-slate-600
                         hover:text-slate-300 hover:border-brand-500/30 transition-all"
            >
              + Ajouter une étape
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Vue liste des scripts
// ─────────────────────────────────────────────────────────────────────────────

function ScriptList({
  scripts,
  onOpen,
  onCreate,
  onEdit,
  onDelete,
  onImport,
  onExportAll,
  onOpenGads,
}: {
  scripts: UserScript[];
  onOpen:      (s: UserScript) => void;
  onCreate:    () => void;
  onEdit:      (s: UserScript) => void;
  onDelete:    (id: string) => void;
  onImport:    (file: File) => void;
  onExportAll: () => void;
  onOpenGads:  () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loadingExamples, setLoadingExamples] = useState<string | null>(null);
  const { error: toastError } = useToast();

  async function loadExamples(type: "setting" | "closing") {
    setLoadingExamples(type);
    try {
      const url  = type === "setting" ? "/scripts_setting_exemples.json" : "/scripts_closing_exemples.json";
      const res  = await fetch(url);
      const data = await res.json() as UserScript[];
      const now  = new Date().toISOString();
      const imported = data.map(s => ({ ...s, id: genId(), updatedAt: now }));
      onImport(new File([JSON.stringify(imported)], "exemples.json", { type: "application/json" }));
    } catch {
      toastError("Impossible de charger les exemples");
    } finally {
      setLoadingExamples(null);
    }
  }

  const coldCalls = scripts.filter(s => s.type === "cold_call");
  const closings  = scripts.filter(s => s.type === "closing");

  function ScriptCard({ script }: { script: UserScript }) {
    const isCold = script.type === "cold_call";
    const count  = isCold ? (script.blocks?.length || 0) : (script.steps?.length || 0);
    const suffix = isCold ? "bloc" : "étape";

    function exportSingle(e: React.MouseEvent) {
      e.stopPropagation();
      const blob = new Blob([JSON.stringify(script, null, 2)], { type: "application/json" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${script.title.replace(/\s+/g, "_")}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    return (
      <div
        onClick={() => onOpen(script)}
        className={[
          "group relative flex items-center gap-4 px-4 py-4 rounded-2xl border cursor-pointer transition-all overflow-hidden",
          isCold
            ? "border-cyan-500/[0.12] bg-gradient-to-r from-cyan-500/[0.04] to-transparent hover:border-cyan-500/[0.20] hover:from-cyan-500/[0.07]"
            : "border-brand-500/[0.12] bg-gradient-to-r from-brand-500/[0.04] to-transparent hover:border-brand-500/[0.20] hover:from-brand-500/[0.07]",
        ].join(" ")}
      >
        {/* Icône type avec SVG */}
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
          isCold ? "bg-cyan-500/[0.12] border-cyan-500/[0.20]" : "bg-brand-500/[0.12] border-brand-500/[0.20]"
        }`}>
          {isCold ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.08 6.08l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-400">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-slate-200 group-hover:text-white truncate transition-colors mb-1">
            {script.title}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase tracking-wide ${
              isCold ? "bg-cyan-500/[0.12] text-cyan-400 border border-cyan-500/20" : "bg-brand-500/[0.12] text-brand-400 border border-brand-500/20"
            }`}>
              {isCold ? "Cold Call" : "Closing"}
            </span>
            <span className="text-[11px] text-slate-600 font-mono">{count} {suffix}{count > 1 ? "s" : ""}</span>
            <span className="text-slate-700">·</span>
            <span className="text-[11px] text-slate-700 font-mono">{new Date(script.updatedAt).toLocaleDateString("fr-FR")}</span>
          </div>
        </div>

        {/* Actions (visibles au hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); onEdit(script); }}
            title="Modifier"
            className="h-7 w-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-slate-400 hover:text-slate-200 text-xs transition-all flex items-center justify-center"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button
            onClick={exportSingle}
            title="Exporter"
            className="h-7 w-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-slate-400 hover:text-slate-200 text-xs transition-all flex items-center justify-center"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(script.id); }}
            title="Supprimer"
            className="h-7 w-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs transition-all flex items-center justify-center"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
          </button>
        </div>

        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-slate-700 group-hover:text-slate-400 transition-colors shrink-0"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="h-px bg-gradient-to-r from-transparent via-brand-500/25 to-transparent shrink-0" />

      {/* Header */}
      <header className="flex items-center gap-3 pl-14 md:pl-5 pr-5 py-3 border-b border-white/[0.05] shrink-0 bg-[#080b12]/70 backdrop-blur-md">
        <h1 className="text-sm font-semibold text-slate-100 tracking-tight">Scripts d&apos;appel</h1>
        <span className="text-xs text-slate-700 mono">{scripts.length} script{scripts.length > 1 ? "s" : ""}</span>

        <div className="ml-auto flex items-center gap-2">
          {/* Import JSON */}
          <input ref={fileRef} type="file" accept=".json" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ""; }} />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-white/[0.06] border border-white/[0.08]
                       text-xs text-slate-400 hover:text-slate-200 hover:bg-white/[0.09] transition-all"
          >
            ↑ Importer JSON
          </button>

          {/* Exemples — toujours visibles */}
          <button
            onClick={() => loadExamples("setting")}
            disabled={loadingExamples !== null}
            className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-white/[0.06] border border-white/[0.08]
                       text-xs text-slate-400 hover:text-slate-200 hover:bg-white/[0.09] transition-all disabled:opacity-40"
          >
            {loadingExamples === "setting" ? "…" : "📞 Setting"}
          </button>
          <button
            onClick={() => loadExamples("closing")}
            disabled={loadingExamples !== null}
            className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-white/[0.06] border border-white/[0.08]
                       text-xs text-slate-400 hover:text-slate-200 hover:bg-white/[0.09] transition-all disabled:opacity-40"
          >
            {loadingExamples === "closing" ? "…" : "🤝 Closing"}
          </button>

          {/* Séparateur */}
          <div className="w-px h-4 bg-white/[0.08]" />

          {/* Export tout */}
          {scripts.length > 0 && (
            <button
              onClick={onExportAll}
              className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-white/[0.06] border border-white/[0.08]
                         text-xs text-slate-400 hover:text-slate-200 hover:bg-white/[0.09] transition-all"
            >
              ↓ Exporter tout
            </button>
          )}

          {/* Script Google Ads intégré */}
          <button
            onClick={onOpenGads}
            className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-orange-500/15 border border-orange-500/25
                       text-xs text-orange-300 font-medium hover:bg-orange-500/25 transition-all"
          >
            🎯 Google Ads
          </button>

          {/* Créer */}
          <button
            onClick={onCreate}
            className="flex items-center gap-1.5 h-7 px-4 rounded-lg bg-brand-600 hover:bg-brand-500
                       text-white text-xs font-semibold transition-colors shadow-[0_0_16px_rgba(0,229,255,0.25)]"
          >
            + Nouveau script
          </button>
        </div>
      </header>

      {/* Contenu */}
      <div className="flex-1 overflow-auto px-6 py-6">
        {scripts.length === 0 ? (
          /* État vide */
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-3xl">📋</div>
              <div className="absolute inset-0 rounded-2xl bg-brand-500/08 blur-xl" />
            </div>
            <div className="text-center max-w-sm">
              <h2 className="text-lg font-bold text-slate-200 mb-2">Aucun script</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Créez votre premier script Cold Call ou Closing. Vous pouvez aussi importer un fichier JSON partagé par un autre utilisateur.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={onOpenGads}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500/15 border border-orange-500/25 text-orange-300 text-sm font-semibold transition-all hover:bg-orange-500/25">
                🎯 Script Google Ads
              </button>
              <button onClick={onCreate}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-colors shadow-[0_0_20px_rgba(0,229,255,0.25)]">
                + Créer un script
              </button>
              <button onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/[0.08] text-slate-300 text-sm font-medium transition-all">
                ↑ Importer JSON
              </button>
              <button onClick={() => loadExamples("setting")} disabled={loadingExamples !== null}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/[0.08] text-slate-300 text-sm font-medium transition-all disabled:opacity-50">
                {loadingExamples === "setting" ? "Chargement…" : "📞 Exemples Setting"}
              </button>
              <button onClick={() => loadExamples("closing")} disabled={loadingExamples !== null}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/[0.08] text-slate-300 text-sm font-medium transition-all disabled:opacity-50">
                {loadingExamples === "closing" ? "Chargement…" : "🤝 Exemples Closing"}
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">

            {/* Carte script Google Ads intégré */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                <span className="text-[10px] font-mono tracking-widest text-orange-400/70 uppercase">Formation intégrée</span>
              </div>
              <div
                onClick={onOpenGads}
                className="group relative flex items-center gap-4 px-4 py-4 rounded-2xl border border-orange-500/[0.18]
                           bg-gradient-to-r from-orange-500/[0.06] to-transparent
                           hover:from-orange-500/[0.10] hover:border-orange-500/[0.28] cursor-pointer transition-all overflow-hidden"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-orange-500/[0.12] border border-orange-500/[0.22]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                    <circle cx="12" cy="12" r="10"/>
                    <polygon points="10 8 16 12 10 16 10 8"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-slate-200 group-hover:text-white truncate transition-colors mb-1">
                    Script Google Ads — Setting & Closing
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase tracking-wide bg-orange-500/[0.12] text-orange-400 border border-orange-500/20">
                      10kchallenge
                    </span>
                    <span className="text-[11px] text-slate-600">6 étapes prospection · 8 étapes closing</span>
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-slate-700 group-hover:text-orange-400 transition-colors shrink-0"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </section>

            {/* Cold Call */}
            {coldCalls.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span className="text-[10px] font-mono tracking-widest text-cyan-400/70 uppercase">Cold Call</span>
                  <span className="text-[10px] font-mono text-slate-700 ml-1">{coldCalls.length}</span>
                </div>
                <div className="space-y-2">
                  {coldCalls.map(s => <ScriptCard key={s.id} script={s} />)}
                </div>
              </section>
            )}

            {/* Closing */}
            {closings.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                  <span className="text-[10px] font-mono tracking-widest text-brand-400/70 uppercase">Closing</span>
                  <span className="text-[10px] font-mono text-slate-700 ml-1">{closings.length}</span>
                </div>
                <div className="space-y-2">
                  {closings.map(s => <ScriptCard key={s.id} script={s} />)}
                </div>
              </section>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Vue lecture (téléprompter)
// ─────────────────────────────────────────────────────────────────────────────

function ScriptReader({
  script,
  onBack,
  onEdit,
}: {
  script: UserScript;
  onBack: () => void;
  onEdit: () => void;
}) {
  const [showMindset, setShowMindset] = useState(false);

  return (
    <div className="flex flex-col h-screen">
      <div className="h-px bg-gradient-to-r from-transparent via-brand-500/25 to-transparent shrink-0" />

      {/* Header */}
      <header className="flex items-center gap-3 pl-14 md:pl-5 pr-5 py-3 border-b border-white/[0.05] shrink-0 bg-[#080b12]/70 backdrop-blur-md">
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200 transition-colors">
          ← Scripts
        </button>
        <div className="w-px h-4 bg-white/10" />
        <span className="text-sm font-semibold text-slate-100">{script.title}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
          script.type === "cold_call"
            ? "bg-cyan-500/15 text-cyan-400"
            : "bg-brand-500/15 text-brand-400"
        }`}>
          {script.type === "cold_call" ? "Cold Call" : "Closing"}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowMindset(v => !v)}
            className={[
              "flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs border transition-all",
              showMindset
                ? "bg-brand-500/20 border-brand-500/30 text-brand-300"
                : "bg-white/[0.05] border-white/[0.08] text-slate-600 hover:text-slate-300",
            ].join(" ")}
          >
            💭 Mindset
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs text-slate-400 hover:text-slate-200 hover:bg-white/[0.09] transition-all"
          >
            ✏️ Modifier
          </button>
        </div>
      </header>

      {/* Contenu téléprompter */}
      <div className="flex-1 overflow-auto min-h-0">
        {script.blocks ? (
          <div className="max-w-2xl mx-auto px-8 py-10">
            <div className="flex items-baseline justify-between mb-10">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{script.title}</h2>
              <span className="mono text-xs text-slate-700">{new Date(script.updatedAt).toLocaleDateString("fr-FR")}</span>
            </div>
            <TeleprompterBlocks blocks={script.blocks} showMindset={showMindset} />
          </div>
        ) : script.steps ? (
          <TeleprompterSteps steps={script.steps} showMindset={showMindset} />
        ) : (
          <div className="flex items-center justify-center py-24 text-slate-600 text-sm">
            Ce script est vide — modifiez-le pour ajouter du contenu
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────────────────────

type View = "list" | "read" | "edit" | "gads";

export default function ScriptsPage() {
  const [scripts,  setScripts]  = useState<UserScript[]>([]);
  const [mounted,  setMounted]  = useState(false);
  const [view,     setView]     = useState<View>("list");
  const [selected, setSelected] = useState<UserScript | null>(null);
  const [editing,  setEditing]  = useState<UserScript | undefined>(undefined);
  const { success, error: toastError, info } = useToast();
  const confirm = useConfirm();

  // Chargement localStorage uniquement côté client après le mount
  // (évite le mismatch d'hydratation SSR)
  useEffect(() => {
    setScripts(loadScripts());
    setMounted(true);
  }, []);

  const { plan, loading: planLoading } = usePlan();

  // ── Persistance ─────────────────────────────────────────────────────────
  function persist(updated: UserScript[]) {
    setScripts(updated);
    saveScripts(updated);
  }

  // ── Actions ─────────────────────────────────────────────────────────────
  function handleSave(script: UserScript) {
    const exists = scripts.find(s => s.id === script.id);
    const updated = exists
      ? scripts.map(s => s.id === script.id ? script : s)
      : [...scripts, script];
    persist(updated);
    setSelected(script);
    setView("read");
    success(exists ? "Script mis à jour" : "Script créé");
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      title:        "Supprimer ce script ?",
      confirmLabel: "Supprimer",
      danger:       true,
    });
    if (!ok) return;
    const updated = scripts.filter(s => s.id !== id);
    persist(updated);
    if (selected?.id === id) {
      setSelected(null);
      setView("list");
    }
    info("Script supprimé");
  }

  function handleCreate() {
    setEditing(undefined);
    setView("edit");
  }

  function handleOpenGads() {
    setView("gads");
  }

  function handleEdit(script: UserScript) {
    setEditing(script);
    setView("edit");
  }

  function handleOpen(script: UserScript) {
    setSelected(script);
    setView("read");
  }

  // ── Import JSON ─────────────────────────────────────────────────────────
  const handleImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        // Supporte un script unique ou un tableau
        const incoming: UserScript[] = Array.isArray(parsed) ? parsed : [parsed];
        const now = new Date().toISOString();
        const imported = incoming.map(s => ({
          ...s,
          id:        genId(),  // nouveau id pour éviter les conflits
          createdAt: s.createdAt || now,
          updatedAt: now,
        }));
        const updated = [...scripts, ...imported];
        persist(updated);
        success(`${imported.length} script${imported.length > 1 ? "s" : ""} importé${imported.length > 1 ? "s" : ""}`);
      } catch {
        toastError("Fichier JSON invalide");
      }
    };
    reader.readAsText(file);
  }, [scripts]);

  // ── Export tout ─────────────────────────────────────────────────────────
  function handleExportAll() {
    const blob = new Blob([JSON.stringify(scripts, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "prospeo_scripts.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Attendre le mount pour éviter le flash SSR ──────────────────────────
  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-700 text-sm">
        Chargement…
      </div>
    );
  }

  // ── Plan free ────────────────────────────────────────────────────────────
  if (!planLoading && plan === "free") {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-5 px-6">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center text-3xl z-10 relative">📋</div>
          <div className="absolute inset-0 rounded-2xl bg-brand-500/10 blur-xl" />
        </div>
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-slate-100 mb-2">Scripts d&apos;appel</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Le système de scripts Cold Call et Closing est réservé au plan{" "}
            <span className="text-brand-300 font-medium">Pro</span>.
            Créez, partagez et lisez vos scripts en mode téléprompter.
          </p>
        </div>
        <Link
          href="/#pricing"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-colors shadow-[0_0_20px_rgba(0,229,255,0.3)]"
        >
          Passer Pro — 19 €/mois →
        </Link>
        <p className="text-xs text-slate-700">14 jours gratuits · annulable à tout moment</p>
      </div>
    );
  }

  // ── Routage interne ──────────────────────────────────────────────────────
  if (view === "gads") {
    return <GoogleAdsScriptViewer onBack={() => setView("list")} />;
  }

  if (view === "edit") {
    return (
      <ScriptEditor
        initial={editing}
        onSave={handleSave}
        onCancel={() => setView(selected ? "read" : "list")}
      />
    );
  }

  if (view === "read" && selected) {
    return (
      <ScriptReader
        script={selected}
        onBack={() => setView("list")}
        onEdit={() => handleEdit(selected)}
      />
    );
  }

  return (
    <ScriptList
      scripts={scripts}
      onOpen={handleOpen}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onImport={handleImport}
      onExportAll={handleExportAll}
      onOpenGads={handleOpenGads}
    />
  );
}


