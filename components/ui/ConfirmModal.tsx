"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

// â”€â”€ Options d'une confirmation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ConfirmOptions {
  title:         string;
  message?:      string;
  confirmLabel?: string;
  cancelLabel?:  string;
  danger?:       boolean;   // bouton rouge (suppression)
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm doit Ãªtre utilisÃ© dans <ConfirmProvider>");
  return ctx;
}

// â”€â”€ Provider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ open: boolean; opts: ConfirmOptions }>({
    open: false,
    opts: { title: "" },
  });
  const resolver = useRef<((v: boolean) => void) | null>(null);
  const [mounted, setMounted] = useState(false);

  // monter le portal cÃ´tÃ© client
  if (typeof window !== "undefined" && !mounted) setMounted(true);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setState({ open: true, opts });
    return new Promise<boolean>((resolve) => { resolver.current = resolve; });
  }, []);

  const close = useCallback((result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setState(s => ({ ...s, open: false }));
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {mounted && state.open && createPortal(
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => close(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm bg-[#15171f] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className={[
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg",
                  state.opts.danger ? "bg-red-500/15" : "bg-brand-500/15",
                ].join(" ")}>
                  {state.opts.danger ? "âš ï¸" : "â“"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-100">{state.opts.title}</h3>
                  {state.opts.message && (
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed whitespace-pre-line">
                      {state.opts.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 px-5 py-3.5 border-t border-white/[0.06] bg-white/[0.02]">
              <button
                onClick={() => close(false)}
                className="flex-1 h-9 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-xs text-slate-400 hover:text-slate-200 transition-all"
              >
                {state.opts.cancelLabel || "Annuler"}
              </button>
              <button
                onClick={() => close(true)}
                autoFocus
                className={[
                  "flex-1 h-9 rounded-lg text-xs font-semibold transition-all",
                  state.opts.danger
                    ? "bg-red-600 hover:bg-red-500 text-white"
                    : "bg-brand-600 hover:bg-brand-500 text-white",
                ].join(" ")}
              >
                {state.opts.confirmLabel || "Confirmer"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </ConfirmContext.Provider>
  );
}

