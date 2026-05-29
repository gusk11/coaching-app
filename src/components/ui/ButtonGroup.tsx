"use client";
import { cn } from "@/lib/utils";

interface Option<T> {
  label: string;
  value: T;
}

interface ButtonGroupProps<T> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}

export function ButtonGroup<T extends string | number>({
  options,
  value,
  onChange,
  className,
}: ButtonGroupProps<T>) {
  return (
    <div className={cn("flex gap-1.5 flex-wrap", className)}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
            value === o.value
              ? "bg-[#3b82f6] border-[#3b82f6] text-white"
              : "bg-[#0f1624] border-[#1e2d42] text-[#8fa3c0] hover:border-[#3b82f6]/50 hover:text-[#f0f4ff]"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
