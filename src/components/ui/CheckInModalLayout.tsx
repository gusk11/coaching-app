"use client";
import React from "react";
import { cn } from "@/lib/utils";

const _positiveColors = [
  "bg-red-500",
  "bg-orange-400",
  "bg-yellow-400",
  "bg-lime-400",
  "bg-green-400",
];
const _negativeColors = [..._positiveColors].reverse();

export function ReadOnlySlider({
  label,
  value,
  min = 1,
  max = 5,
  colorMode = "positive_high",
  noValueColor = false,
}: {
  label: string;
  value: number | null | undefined;
  min?: number;
  max?: number;
  colorMode?: "positive_high" | "negative_high";
  noValueColor?: boolean;
}) {
  if (value == null) {
    return (
      <div className="flex items-center justify-between py-2.5 border-b border-[#1e2d42] last:border-0 gap-3">
        <span className="text-sm font-medium text-[#8fa3c0]">{label}</span>
        <span className="text-sm text-[#5a7090]">–</span>
      </div>
    );
  }
  const colors = colorMode === "negative_high" ? _negativeColors : _positiveColors;
  const idx = Math.min(Math.max(value - min, 0), colors.length - 1);
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div className="py-3 border-b border-[#1e2d42] last:border-0">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-[#8fa3c0]">{label}</span>
        {noValueColor ? (
          <span className="text-sm font-bold text-[#f0f4ff]">{value}</span>
        ) : (
          <span className={cn("text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center text-white", colors[idx])}>
            {value}
          </span>
        )}
      </div>
      <div className="h-2 rounded-full bg-[#0f1624]">
        <div
          className={cn("h-full rounded-full", noValueColor ? "bg-[#3b82f6]" : colors[idx])}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function CheckInSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-2">{title}</p>
      <div className="rounded-xl bg-[#141d2e] border border-[#1e2d42] px-4 py-1">
        {children}
      </div>
    </section>
  );
}

export function CheckInRow({
  label,
  value,
  labelWidth = "w-40",
}: {
  label: string;
  value: React.ReactNode;
  labelWidth?: string;
}) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-[#1e2d42] last:border-0 gap-3">
      <span className={`text-xs text-[#5a7090] flex-shrink-0 ${labelWidth}`}>{label}</span>
      <span className="text-xs text-[#f0f4ff] text-right break-words">{value ?? "–"}</span>
    </div>
  );
}

export function MacroChip({
  label,
  value,
  unit = "g",
  color,
}: {
  label: string;
  value: number;
  unit?: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-2">
      <span className={`text-sm font-semibold ${color ?? "text-[#f0f4ff]"}`}>
        {Math.round(value)}{unit}
      </span>
      <span className="text-[10px] text-[#5a7090]">{label}</span>
    </div>
  );
}
