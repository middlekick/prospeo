"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Types
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id:      string;
  type:    ToastType;
  message: string;
  duration?: number; // ms, dÃ©faut 4000
}

interface ToastContextValue {
  toast:   (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  error:   (message: string) => void;
  warning: (message: string) => void;
  info:    (message: string) => void;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Context
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit Ãªtre utilisÃ© dans un ToastProvider");
  return ctx;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Composant Toast individuel
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ICONS: Record<ToastType, string> = {
  success: "âœ“",
  error:   "âœ•",
  warning: "âš ",
  info:    "i",
};

const STYLES: Record<ToastType, { bar: string; icon: string; iconBg: string; border: string }> = {
  success: {
    bar:    "bg-emerald-500",
    icon:   "text-emerald-400",
    iconBg: "bg-emerald-500/15",
    border: "border-emerald-500/20",
  },
  error: {
    bar:    "bg-red-500",
    icon:   "text-red-400",
    iconBg: "bg-red-500/15",
    border: "border-red-500/20",
  },
  warning: {
    bar:    "bg-amber-500",
    icon:   "text-amber-400",
    iconBg: "bg-amber-500/15",
    border: "border-amber-500/20",
  },
  info: {
    bar:    "bg-brand-500",
    icon:   "text-brand-400",
    iconBg: "bg-brand-500/15",
    border: "border-brand-500/20",
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const s = STYLES[toast.type];
  const duration = toast.duration ?? 4000;

  // Slide-in au mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, duration);
    return () => clearTimeout(t);
  }, [toast.id, duration, onRemove]);

  function dismiss() {
    setVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  }

  return (
    <div
      className={[
        "relative flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl",
        "bg-[#151720] backdrop-blur-sm min-w-[280px] max-w-[380px]",
        "transition-all duration-300 cursor-pointer select-none",
        s.border,
        visible
          ? "opacity-100 translate-x-0"
          : "opacity-0 translate-x-8",
      ].join(" ")}
      onClick={dismiss}
    >
      {/* Barre colorÃ©e gauche */}
      <div className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full ${s.bar}`} />

      {/* IcÃ´ne */}
      <div className={`w-6 h-6 rounded-full ${s.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
        <span className={`text-xs font-bold ${s.icon}`}>{ICONS[toast.type]}</span>
      </div>

      {/* Message */}
      <p className="text-sm text-slate-200 leading-relaxed flex-1 pr-1">{toast.message}</p>

      {/* Bouton fermer */}
      <button
        onClick={e => { e.stopPropagation(); dismiss(); }}
        className="text-slate-600 hover:text-slate-300 transition-colors shrink-0 mt-0.5 text-xs"
      >
        âœ•
      </button>

      {/* Barre de progression */}
      <ProgressBar duration={duration} type={toast.type} />
    </div>
  );
}

function ProgressBar({ duration, type }: { duration: number; type: ToastType }) {
  const s = STYLES[type];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // DÃ©marrer Ã  100% et rÃ©duire Ã  0% sur la durÃ©e
    el.style.width = "100%";
    el.style.transition = `width ${duration}ms linear`;
    const t = requestAnimationFrame(() => { el.style.width = "0%"; });
    return () => cancelAnimationFrame(t);
  }, [duration]);

  return (
    <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-white/5 rounded-full overflow-hidden">
      <div ref={ref} className={`h-full rounded-full opacity-40 ${s.bar}`} />
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Provider + Container
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const add = useCallback((message: string, type: ToastType = "info", duration?: number) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    setToasts(prev => {
      // Max 4 toasts simultanÃ©s â€” supprimer le plus ancien si besoin
      const next = prev.length >= 4 ? prev.slice(1) : prev;
      return [...next, { id, type, message, duration }];
    });
  }, []);

  const value: ToastContextValue = {
    toast:   add,
    success: (msg) => add(msg, "success"),
    error:   (msg) => add(msg, "error"),
    warning: (msg) => add(msg, "warning"),
    info:    (msg) => add(msg, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Portail toasts â€” coin bas-droit */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

