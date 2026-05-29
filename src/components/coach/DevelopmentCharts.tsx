"use client";
import { useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { DailyCheckIn } from "@/types";
import { formatDateShort } from "@/lib/utils";

type Metric = {
  key: string;
  label: string;
  type: "line" | "bar";
  color: string;
  unit?: string;
  getValue: (ci: DailyCheckIn) => number | null;
};

const METRICS: Metric[] = [
  { key: "weight", label: "Körpergewicht", type: "line", color: "#3b82f6", unit: "kg", getValue: (ci) => ci.weight },
  { key: "calories", label: "Kalorien", type: "bar", color: "#fb923c", unit: "kcal", getValue: (ci) => ci.calories ?? null },
  { key: "protein", label: "Protein", type: "bar", color: "#60a5fa", unit: "g", getValue: (ci) => ci.protein ?? null },
  { key: "carbs", label: "Kohlenhydrate", type: "bar", color: "#a78bfa", unit: "g", getValue: (ci) => ci.carbs ?? null },
  { key: "fat", label: "Fett", type: "bar", color: "#f59e0b", unit: "g", getValue: (ci) => ci.fat ?? null },
  { key: "fiber", label: "Ballaststoffe", type: "bar", color: "#34d399", unit: "g", getValue: (ci) => ci.fiber ?? null },
  { key: "steps", label: "Schritte", type: "line", color: "#60a5fa", unit: "", getValue: (ci) => ci.steps ?? null },
  { key: "sleepHours", label: "Schlafdauer", type: "line", color: "#a78bfa", unit: "h", getValue: (ci) => ci.sleepHours ?? null },
  { key: "sleepQuality", label: "Schlafqualität", type: "line", color: "#818cf8", unit: "/5", getValue: (ci) => ci.sleepQuality ?? null },
  { key: "sleepScore", label: "Schlafscore", type: "line", color: "#6366f1", unit: "/100", getValue: (ci) => ci.sleepScore ?? null },
  { key: "restingHeartRate", label: "Ruheherzfrequenz", type: "line", color: "#f87171", unit: "bpm", getValue: (ci) => ci.restingHeartRate ?? null },
  { key: "bpSystolic", label: "Blutdruck (systolisch)", type: "line", color: "#fb7185", unit: "mmHg", getValue: (ci) => ci.bloodPressure?.systolic ?? null },
  { key: "energyLevel", label: "Energielevel", type: "line", color: "#f59e0b", unit: "/5", getValue: (ci) => ci.energyLevel ?? null },
  { key: "stressLevel", label: "Stresslevel", type: "line", color: "#ef4444", unit: "/5", getValue: (ci) => ci.stressLevel ?? null },
  { key: "mood", label: "Stimmung", type: "line", color: "#c084fc", unit: "/5", getValue: (ci) => ci.mood ?? null },
  { key: "appetite", label: "Appetit", type: "line", color: "#fb923c", unit: "/5", getValue: (ci) => ci.appetite ?? null },
  { key: "digestion", label: "Verdauung", type: "line", color: "#4ade80", unit: "/5", getValue: (ci) => ci.digestion ?? null },
  { key: "trainingQuality", label: "Trainingsqualität", type: "line", color: "#10b981", unit: "/5", getValue: (ci) => ci.training ? ci.trainingQuality : null },
  { key: "cardioDuration", label: "Cardio-Minuten", type: "bar", color: "#34d399", unit: "min", getValue: (ci) => ci.cardio ? (ci.cardioDuration ?? 0) : 0 },
  { key: "training", label: "Trainings-Compliance", type: "bar", color: "#4ade80", unit: "", getValue: (ci) => ci.training ? 1 : 0 },
  { key: "nutritionCompliance", label: "Ernährungs-Compliance", type: "bar", color: "#60a5fa", unit: "", getValue: (ci) => {
    const c = ci.mealCompliance;
    if (c === "fully_followed" || c === "full") return 1;
    if (c === "tracked_in_calorie_tracker" || c === "full_tracking") return 0.5;
    return 0;
  }},
];

type Range = "7" | "30" | "90" | "all";
const RANGES: { value: Range; label: string }[] = [
  { value: "7", label: "7 Tage" },
  { value: "30", label: "30 Tage" },
  { value: "90", label: "90 Tage" },
  { value: "all", label: "Alle" },
];

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#141d2e] border border-[#1e2d42] rounded-xl px-3 py-2 text-sm shadow-xl">
        <p className="text-[#8fa3c0] text-xs mb-0.5">{label}</p>
        <p className="text-[#f0f4ff] font-bold">{payload[0].value}{unit}</p>
      </div>
    );
  }
  return null;
};

interface Props {
  checkIns: DailyCheckIn[];
}

export function DevelopmentCharts({ checkIns }: Props) {
  const [metric, setMetric] = useState<string>("weight");
  const [range, setRange] = useState<Range>("30");

  const sorted = [...checkIns].sort((a, b) => a.date.localeCompare(b.date));
  const filtered = range === "all"
    ? sorted
    : sorted.slice(-Number(range));

  const selectedMetric = METRICS.find((m) => m.key === metric) ?? METRICS[0];

  const data = filtered
    .map((ci) => {
      const val = selectedMetric.getValue(ci);
      return val !== null ? { date: formatDateShort(ci.date), value: val } : null;
    })
    .filter(Boolean) as { date: string; value: number }[];

  const hasData = data.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Range selector */}
      <div className="flex gap-1.5 flex-wrap">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              range === r.value
                ? "bg-[#3b82f6] text-white"
                : "bg-[#141d2e] border border-[#1e2d42] text-[#8fa3c0] hover:text-[#f0f4ff]"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Metric selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[#5a7090]">Metrik</label>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          className="bg-[#141d2e] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
        >
          {METRICS.map((m) => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42]">
        <p className="text-sm font-medium text-[#f0f4ff] mb-4">{selectedMetric.label}</p>
        {!hasData ? (
          <div className="flex items-center justify-center h-36 text-[#5a7090] text-sm">
            Keine Daten für diesen Zeitraum.
          </div>
        ) : selectedMetric.type === "line" ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#5a7090", fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "#5a7090", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<CustomTooltip unit={selectedMetric.unit} />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={selectedMetric.color}
                strokeWidth={2.5}
                dot={data.length <= 20 ? { fill: selectedMetric.color, r: 3, strokeWidth: 0 } : false}
                activeDot={{ fill: selectedMetric.color, r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#5a7090", fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "#5a7090", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<CustomTooltip unit={selectedMetric.unit} />} />
              <Bar dataKey="value" fill={selectedMetric.color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Summary stats */}
      {hasData && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Ø Wert", value: (data.reduce((s, d) => s + d.value, 0) / data.length).toFixed(1) },
            { label: "Min", value: Math.min(...data.map((d) => d.value)).toFixed(1) },
            { label: "Max", value: Math.max(...data.map((d) => d.value)).toFixed(1) },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-1">
              <p className="text-xs text-[#5a7090]">{s.label}</p>
              <p className="text-sm font-bold text-[#f0f4ff]">{s.value}{selectedMetric.unit}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
