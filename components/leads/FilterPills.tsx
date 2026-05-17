"use client";

import { TAGS, TagValue } from "./types";

interface Props {
  active:   TagValue;
  counts:   Record<string, number>;
  onChange: (tag: TagValue) => void;
}

// Couleur par statut (cohÃ©rente avec le reste de l'app)
const TAG_ACCENT: Record<string, { active: string; badge: string }> = {
  tous:          { active: "bg-brand-500/[0.14] border-brand-500/[0.30] text-brand-200",  badge: "text-brand-400" },
  non_appele:    { active: "bg-slate-500/[0.14] border-slate-500/[0.25] text-slate-200",     badge: "text-slate-400" },
  ne_repond_pas: { active: "bg-orange-500/[0.12] border-orange-500/[0.25] text-orange-200",  badge: "text-orange-400" },
  interesse:     { active: "bg-cyan-500/[0.12] border-cyan-500/[0.25] text-cyan-200",        badge: "text-cyan-400" },
  rdv_pris:      { active: "bg-emerald-500/[0.12] border-emerald-500/[0.25] text-emerald-200", badge: "text-emerald-400" },
  pas_interesse: { active: "bg-red-500/[0.10] border-red-500/[0.22] text-red-200",           badge: "text-red-400" },
  rappels:       { active: "bg-amber-500/[0.12] border-amber-500/[0.28] text-amber-200",     badge: "text-amber-400" },
};

const DEFAULT_INACTIVE = "bg-white/[0.03] border-white/[0.07] text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] hover:border-white/[0.12]";

export default function FilterPills({ active, counts, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TAGS.map(({ value, label }) => {
        const isRappel = value === "rappels";
        const isTous   = value === "tous";
        const count    = isTous
          ? Object.entries(counts).filter(([k]) => k !== "rappels").reduce((a, [, b]) => a + b, 0)
          : (counts[value] ?? 0);
        const isActive = active === value;
        const styles   = TAG_ACCENT[value] ?? TAG_ACCENT.tous;

        // Badge pulsÃ© pour rappels non-sÃ©lectionnÃ©s
        const hasPulse = isRappel && count > 0 && !isActive;

        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={[
              "relative px-3 py-[5px] rounded-full text-[12px] font-medium transition-all border",
              isActive ? styles.active : DEFAULT_INACTIVE,
            ].join(" ")}
          >
            {/* Point pulsÃ© */}
            {hasPulse && (
              <span className="absolute -top-[3px] -right-[3px] w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)] animate-pulse" />
            )}

            {label}

            {/* Compteur */}
            <span className={[
              "ml-1.5 text-[10px] font-mono font-medium",
              isActive
                ? styles.badge
                : count > 0 && isRappel
                  ? "text-amber-500"
                  : "text-slate-700",
            ].join(" ")}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

