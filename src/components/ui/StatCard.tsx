"use client";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  label: ReactNode;
  value: string | number | ReactNode;
  unit?: string;
  sub?: string;
  accent?: boolean;
  color?: string;
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, unit, sub, accent, color, icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-[#141d2e] border border-[#1e2d42] p-3 sm:p-4 flex flex-col gap-1 shadow-[0_4px_24px_rgba(0,0,0,0.4)]",
        accent && "border-[#3b82f6]/30 bg-[#141d2e]",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] sm:text-xs font-medium text-[#5a7090] uppercase tracking-widest leading-snug">{label}</span>
        {icon && <span className="text-[#5a7090] shrink-0">{icon}</span>}
      </div>
      <div className={cn("flex items-baseline gap-1 mt-1 min-w-0", color ?? "text-[#f0f4ff]")}>
        <span className="text-xl sm:text-2xl font-bold leading-none min-w-0">{value}</span>
        {unit && <span className="text-sm text-[#8fa3c0] shrink-0">{unit}</span>}
      </div>
      {sub && <p className="text-[10px] sm:text-xs text-[#5a7090] mt-0.5">{sub}</p>}
    </div>
  );
}
