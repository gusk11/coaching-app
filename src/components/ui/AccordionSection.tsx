"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  variant?: "default" | "outer";
  className?: string;
}

export function AccordionSection({
  title,
  children,
  defaultOpen = false,
  variant = "default",
  className,
}: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const isOuter = variant === "outer";

  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden",
        isOuter
          ? "bg-[#0f1624] border-[#2a3a52]"
          : "bg-[#141d2e] border-[#1e2d42]",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center justify-between px-4 transition-colors",
          isOuter
            ? "py-4 hover:bg-[#141d2e]"
            : "py-3 hover:bg-[#1a2438]"
        )}
      >
        <span
          className={cn(
            "font-semibold uppercase tracking-widest",
            isOuter
              ? "text-sm text-[#a0b4cc]"
              : "text-xs text-[#8fa3c0]"
          )}
        >
          {title}
        </span>
        {open ? (
          <ChevronDown size={isOuter ? 16 : 14} className="text-[#5a7090]" />
        ) : (
          <ChevronRight size={isOuter ? 16 : 14} className="text-[#5a7090]" />
        )}
      </button>
      {open && (
        <div
          className={cn(
            isOuter
              ? "px-4 pb-4 flex flex-col gap-3"
              : "px-4 pb-4 flex flex-col gap-0"
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
