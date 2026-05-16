"use client";

import { TAGS, TagValue } from "./types";

interface Props {
  active: TagValue;
  counts: Record<string, number>;
  onChange: (tag: TagValue) => void;
}

export default function FilterPills({ active, counts, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {TAGS.map(({ value, label }) => {
        const isRappel = value === "rappels";
        const isTous   = value === "tous";
        const count    = isTous
          ? Object.entries(counts).filter(([k]) => k !== "rappels").reduce((a, [, b]) => a + b, 0)
          : (counts[value] ?? 0);
        const isActive = active === value;

        // Badge rouge pulsé si rappels en retard
        const hasBadge = isRappel && count > 0 && !isActive;

        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={[
              "relative px-3 py-1 rounded-full text-xs font-medium transition-colors border",
              isActive
                ? isRappel
                  ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300"
                  : "bg-violet-500/20 border-violet-500/50 text-violet-300"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10",
            ].join(" ")}
          >
            {hasBadge && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            )}
            {label}
            <span className={[
              "ml-1.5 mono",
              isActive
                ? isRappel ? "text-yellow-400" : "text-violet-400"
                : count > 0 && isRappel ? "text-yellow-500" : "text-slate-500",
            ].join(" ")}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
