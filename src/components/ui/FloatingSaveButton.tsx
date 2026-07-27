"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Save, Check } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  onClick: () => void;
  label?: string;
}

export function FloatingSaveButton({ onClick, label = "Speichern" }: Props) {
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = useCallback(() => {
    onClick();
    setSaved(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSaved(false), 1800);
  }, [onClick]);

  if (!mounted) return null;

  return createPortal(
    <motion.button
      type="button"
      onClick={handleClick}
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18 }}
      className={`fixed bottom-5 right-4 z-40 flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-xl border transition-colors ${
        saved
          ? "bg-[#081a10] border-[#10b981]/35 text-[#34d399]"
          : "bg-[#3b82f6] border-[#3b82f6]/80 text-white hover:bg-[#2563eb]"
      }`}
    >
      {saved ? <Check size={15} /> : <Save size={15} />}
      {saved ? "Gespeichert" : label}
    </motion.button>,
    document.body
  );
}
