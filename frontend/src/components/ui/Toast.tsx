"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "info" | "warning" | "error";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed top-14 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex items-start space-x-3 p-3.5 rounded-lg shadow-2xl border text-xs transition-all animate-in slide-in-from-top-2 bg-[#161e2e]"
            style={{
              borderColor:
                toast.type === "success"
                  ? "#059669"
                  : toast.type === "error"
                  ? "#dc2626"
                  : toast.type === "warning"
                  ? "#d97706"
                  : "#2563eb",
            }}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {toast.type === "success" && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              {toast.type === "error" && (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
              {toast.type === "warning" && (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
              {toast.type === "info" && (
                <Info className="w-4 h-4 text-blue-400" />
              )}
            </div>

            {/* Message Body */}
            <div className="flex-1">
              {toast.title && (
                <p className="font-bold text-white mb-0.5">{toast.title}</p>
              )}
              <p className="text-gray-200 leading-snug">{toast.message}</p>
            </div>

            {/* Dismiss */}
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
              className="text-gray-400 hover:text-white shrink-0 p-0.5 rounded hover:bg-[#1e293b] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
