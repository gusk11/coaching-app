"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  label: string;
  children: React.ReactNode;
  position?: "top" | "bottom";
}

export function Tooltip({ label, children, position = "top" }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const show = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      x: rect.left + rect.width / 2,
      y: position === "top" ? rect.top : rect.bottom,
    });
    setVisible(true);
  }, [position]);

  const hide = useCallback(() => setVisible(false), []);

  return (
    <>
      <div ref={triggerRef} className="inline-flex" onMouseEnter={show} onMouseLeave={hide}>
        {children}
      </div>
      {mounted && visible && createPortal(
        <span
          role="tooltip"
          className="pointer-events-none fixed z-[9999] whitespace-nowrap rounded-lg bg-[#0a1120] border border-[#1e2d42] px-2 py-1 text-xs text-[#c0d0e8] shadow-lg"
          style={{
            left: coords.x,
            top: position === "top" ? coords.y - 6 : coords.y + 6,
            transform: position === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
          }}
        >
          {label}
        </span>,
        document.body
      )}
    </>
  );
}
