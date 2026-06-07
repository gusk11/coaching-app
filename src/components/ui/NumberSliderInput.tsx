"use client";
import { cn } from "@/lib/utils";

interface NumberSliderInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  sliderStep?: number;
  unit?: string;
  onChange: (v: number) => void;
  className?: string;
}

export function NumberSliderInput({
  label,
  value,
  min = 0,
  max = 100,
  sliderStep = 1,
  unit,
  onChange,
  className,
}: NumberSliderInputProps) {
  const clampedSliderValue = Math.min(Math.max(value, min), max);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-[#8fa3c0]">{label}</label>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            step="any"
            value={value}
            onChange={(e) => {
              const v = e.target.valueAsNumber;
              if (!isNaN(v)) onChange(v);
            }}
            className="w-20 text-right bg-[#0f1624] border border-[#1e2d42] rounded-lg px-2 py-1 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
          />
          {unit && <span className="text-xs text-[#5a7090]">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={sliderStep}
        value={clampedSliderValue}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#3b82f6]"
      />
    </div>
  );
}
