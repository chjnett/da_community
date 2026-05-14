import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType, durationMs?: number) => void;
  success: (message: string, durationMs?: number) => void;
  error: (message: string, durationMs?: number) => void;
  info: (message: string, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(item => item.id !== id));
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = "info", durationMs = 2600) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts(prev => [...prev, { id, type, message }]);
      window.setTimeout(() => remove(id), durationMs);
    },
    [remove],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message, durationMs) => show(message, "success", durationMs),
      error: (message, durationMs) => show(message, "error", durationMs),
      info: (message, durationMs) => show(message, "info", durationMs),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-3 left-1/2 -translate-x-1/2 z-[120] w-full max-w-[430px] px-4">
        <div className="space-y-2">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-xl px-3 py-2 shadow-lg border text-sm font-semibold flex items-center gap-2 ${
                toast.type === "error"
                  ? "bg-red-50 text-red-600 border-red-100"
                  : toast.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-white text-gray-700 border-gray-100"
              }`}
            >
              {toast.type === "error" ? (
                <AlertCircle className="w-4 h-4" />
              ) : toast.type === "success" ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Info className="w-4 h-4" />
              )}
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

