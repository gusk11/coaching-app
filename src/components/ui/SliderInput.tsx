"use client";
import { cn } from "@/lib/utils";

interface SliderInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  labelMin?: string;
  labelMax?: string;
  colorMode?: "positive_high" | "negative_high";
  reversed?: boolean;
  noValueColor?: boolean;
  className?: string;
}

const positiveColors = [
  "bg-red-500",
  "bg-orange-400",
  "bg-yellow-400",
  "bg-lime-400",
  "bg-green-400",
];
const negativeColors = [...positiveColors].reverse();

export function SliderInput({
  label,
  value,
  min = 1,
  max = 5,
  step = 1,
  onChange,
  labelMin,
  labelMax,
  colorMode = "positive_high",
  reversed = false,
  noValueColor = false,
  className,
}: SliderInputProps) {
  const colors = colorMode === "negative_high" ? negativeColors : positiveColors;
  const idx = Math.min(Math.max(value - min, 0), colors.length - 1);
  const displayLabelMin = reversed ? labelMax : labelMin;
  const displayLabelMax = reversed ? labelMin : labelMax;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-[#8fa3c0]">{label}</label>
        {noValueColor ? (
          <span className="text-sm font-bold text-[#f0f4ff]">{value}</span>
        ) : (
          <span
            className={cn(
              "text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center text-white",
              colors[idx]
            )}
          >
            {value}
          </span>
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#3b82f6]"
        style={reversed ? { transform: "scaleX(-1)" } : undefined}
      />
      {(displayLabelMin || displayLabelMax) && (
        <div className="flex justify-between text-xs text-[#5a7090]">
          <span>{displayLabelMin}</span>
          <span>{displayLabelMax}</span>
        </div>
      )}
    </div>
  );
}
