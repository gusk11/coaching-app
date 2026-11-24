"use client";
import { motion } from "framer-motion";

/** Full-area loader: three bouncing dots, faded in after a short delay so fast loads show nothing. */
export function LoadingScreen({ className = "min-h-[60vh]" }: { className?: string }) {
  return (
    <motion.div
      role="status"
      aria-label="Lädt"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className={`flex items-center justify-center gap-2 ${className}`}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"
          animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
        />
      ))}
    </motion.div>
  );
}
