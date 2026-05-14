"use client";

/**
 * Themed confirmation dialog — replaces the unstyled native
 * `window.confirm()` used in admin Delete / Destroy actions.
 *
 * Usage:
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: "Delete this block?", danger: true }))) return;
 *
 * Wrap the admin shell once with <ConfirmProvider>. Every nested
 * component can call useConfirm() to open the dialog. The promise
 * resolves true on confirm, false on cancel / backdrop click /
 * Escape key.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ConfirmOptions = {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** When true the confirm button renders red (Delete / Destroy actions). */
  danger?: boolean;
};

type Resolver = (value: boolean) => void;

const ConfirmContext = createContext<
  (opts: ConfirmOptions) => Promise<boolean>
>(() => Promise.resolve(false));

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<Resolver | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    setOpts(options);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback((result: boolean) => {
    setOpen(false);
    const r = resolverRef.current;
    resolverRef.current = null;
    if (r) r(result);
  }, []);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter") close(true);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {open && opts ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close"
            onClick={() => close(false)}
            className="absolute inset-0 bg-black/45 backdrop-blur-sm cursor-default"
          />
          {/* Card */}
          <div className="relative bg-white rounded-md shadow-2xl border border-black/5 max-w-sm w-full p-6 animate-fade-in">
            <h2
              id="confirm-title"
              className="text-base text-ink mb-2"
              style={{ fontWeight: 600 }}
            >
              {opts.title}
            </h2>
            {opts.body ? (
              <p className="text-sm text-ink/70 leading-relaxed mb-6">
                {opts.body}
              </p>
            ) : (
              <div className="h-1" />
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => close(false)}
                className="px-4 py-2 text-sm text-ink/70 hover:text-ink transition-colors"
              >
                {opts.cancelLabel ?? "Cancel"}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => close(true)}
                className={
                  opts.danger
                    ? "px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
                    : "px-4 py-2 text-sm rounded bg-navy text-white hover:bg-navy-dark transition-colors font-medium"
                }
              >
                {opts.confirmLabel ?? (opts.danger ? "Delete" : "Confirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}
