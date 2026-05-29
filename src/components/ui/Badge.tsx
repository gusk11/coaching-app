import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "accent";
  className?: string;
}

const variants = {
  default: "bg-[#1e2d42] text-[#8fa3c0]",
  success: "bg-[#064e3b] text-[#10b981]",
  warning: "bg-[#451a03] text-[#f59e0b]",
  danger: "bg-[#450a0a] text-[#ef4444]",
  accent: "bg-[#1d4ed8]/20 text-[#60a5fa]",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}
