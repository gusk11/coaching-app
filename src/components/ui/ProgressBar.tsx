"use client";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercent?: boolean;
  className?: string;
  color?: string;
}

export function ProgressBar({ value, label, showPercent, className, color }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {(label || showPercent) && (
        <div className="flex justify-between text-xs">
          {label && <span className="text-[#8fa3c0]">{label}</span>}
          {showPercent && <span className="text-[#f0f4ff] font-medium">{pct}%</span>}
        </div>
      )}
      <div className="h-2 rounded-full bg-[#1e2d42] overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color ?? "bg-[#3b82f6]")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
