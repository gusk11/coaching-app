"use client";
import React from "react";

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
