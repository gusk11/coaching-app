"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type ToastType = "success" | "error";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

const TOAST_EVENT = "coachOS:toast";
const TOAST_DURATION_MS = 3500;

export function showToast(message: string, type: ToastType = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, { detail: { message, type } })
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    function handler(e: Event) {
      const { message, type } = (
        e as CustomEvent<{ message: string; type: ToastType }>
      ).detail;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, TOAST_DURATION_MS);
    }

    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed top-4 right-4 left-4 sm:left-auto sm:w-80 z-[200] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl pointer-events-auto ${
              toast.type === "error"
                ? "bg-[#1a0808] border-[#ef4444]/35 text-[#f87171]"
                : "bg-[#081a10] border-[#10b981]/35 text-[#34d399]"
            }`}
          >
            {toast.type === "error" ? (
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
            ) : (
              <CheckCircle size={15} className="shrink-0 mt-0.5" />
            )}
            <p className="text-sm leading-snug flex-1">{toast.message}</p>
            <button
              onClick={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
              className="ml-auto shrink-0 opacity-50 hover:opacity-100 transition-opacity"
              aria-label="Benachrichtigung schließen"
            >
              <X size={13} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}
