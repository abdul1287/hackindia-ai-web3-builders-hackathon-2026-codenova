import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "../utils/cn";

let toastDispatch = null;

export function showToast(toast) {
  if (toastDispatch) {
    toastDispatch(toast);
  } else {
    console.log("Toast:", toast);
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastDispatch = (toast) => {
      const id = Date.now() + Math.random().toString(36).substring(2, 6);
      const newToast = { id, ...toast };
      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    return () => {
      toastDispatch = null;
    };
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const type = toast.type || "success";
        const configs = {
          success: {
            bg: "bg-slate-900 text-white border-slate-800",
            icon: CheckCircle2,
            iconColor: "text-emerald-400",
          },
          info: {
            bg: "bg-slate-900 text-white border-slate-800",
            icon: Info,
            iconColor: "text-blue-400",
          },
          error: {
            bg: "bg-rose-950 text-white border-rose-900",
            icon: AlertCircle,
            iconColor: "text-rose-400",
          },
          warning: {
            bg: "bg-amber-950 text-white border-amber-900",
            icon: AlertTriangle,
            iconColor: "text-amber-400",
          },
        };

        const current = configs[type] || configs.success;
        const Icon = current.icon;

        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto rounded-xl p-3.5 shadow-xl border flex items-start gap-3 transform transition-all duration-200 animate-in slide-in-from-bottom-5",
              current.bg
            )}
          >
            <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", current.iconColor)} />
            <div className="flex-1 min-w-0">
              {toast.title && (
                <h4 className="text-xs font-semibold tracking-wide uppercase text-slate-300">
                  {toast.title}
                </h4>
              )}
              <p className="text-xs font-medium text-slate-100 leading-snug">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
