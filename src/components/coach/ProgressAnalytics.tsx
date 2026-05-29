"use client";
import { useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { DailyCheckIn } from "@/types";
import { formatDateShort } from "@/lib/utils";

type MetricType = "line" | "bloodPressure" | "completion" | "notes";

type MetricDef = {
  key: string;
  label: string;
  type: MetricType;
  color: string;
  color2?: string;
  unit?: string;
  getValue?: (ci: DailyCheckIn) => number | null;
  /** Computes YAxis domain from array of values in the current view */
  yDomain?: (vals: number[]) => [number, number];
};

function dynamicDomain(vals: number[], padKg = 2): [number, number] {
  if (vals.length === 0) return [0, 100];
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min;
  // Use percentage padding (3%) but at least padKg absolute units
  const pad = Math.max(padKg, range * 0.08);
  return [
    Math.round((min - pad) * 10) / 10,
    Math.round((max + pad) * 10) / 10,
  ];
}

function scaleFixed(min: number, max: number): () => [number, number] {
  return () => [min, max];
}

const METRICS: MetricDef[] = [
  {
    key: "weight", label: "Körpergewicht", type: "line", color: "#3b82f6", unit: " kg",
    getValue: (ci) => ci.weight,
    yDomain: (vals) => dynamicDomain(vals, 2),
  },
  {
    key: "sleepHours", label: "Schlafdauer", type: "line", color: "#a78bfa", unit: " h",
    getValue: (ci) => ci.sleepHours ?? null,
    yDomain: scaleFixed(0, 14),
  },
  {
    key: "sleepQuality", label: "Schlafqualität", type: "line", color: "#818cf8", unit: "/5",
    getValue: (ci) => ci.sleepQuality ?? null,
    yDomain: scaleFixed(0, 5),
  },
  {
    key: "sleepScore", label: "Schlafscore (Gerät)", type: "line", color: "#6366f1", unit: "/100",
    getValue: (ci) => ci.sleepScore ?? null,
    yDomain: scaleFixed(0, 100),
  },
  {
    key: "steps", label: "Schritte", type: "line", color: "#60a5fa", unit: "",
    getValue: (ci) => ci.steps ?? null,
    yDomain: (vals) => [0, Math.ceil(Math.max(...vals) * 1.1)],
  },
  {
    key: "restingHeartRate", label: "Ruheherzfrequenz", type: "line", color: "#f87171", unit: " bpm",
    getValue: (ci) => ci.restingHeartRate ?? null,
    yDomain: (vals) => dynamicDomain(vals, 5),
  },
  {
    key: "hrv", label: "HRV", type: "line", color: "#34d399", unit: " ms",
    getValue: (ci) => ci.hrv ?? null,
    yDomain: (vals) => dynamicDomain(vals, 5),
  },
  {
    key: "spO2", label: "Sauerstoffsättigung (SpO₂)", type: "line", color: "#22d3ee", unit: "%",
    getValue: (ci) => ci.spO2 ?? null,
    yDomain: (vals) => {
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      return [Math.max(80, Math.floor(min - 1)), Math.min(100, Math.ceil(max + 1))];
    },
  },
  { key: "bloodPressure", label: "Blutdruck", type: "bloodPressure", color: "#fb7185", color2: "#38bdf8", unit: " mmHg" },
  {
    key: "stressLevel", label: "Stresslevel", type: "line", color: "#ef4444", unit: "/5",
    getValue: (ci) => ci.stressLevel ?? null,
    yDomain: scaleFixed(0, 5),
  },
  {
    key: "energyLevel", label: "Energielevel", type: "line", color: "#f59e0b", unit: "/5",
    getValue: (ci) => ci.energyLevel ?? null,
    yDomain: scaleFixed(0, 5),
  },
  {
    key: "mood", label: "Stimmung", type: "line", color: "#c084fc", unit: "/5",
    getValue: (ci) => ci.mood ?? null,
    yDomain: scaleFixed(0, 5),
  },
  {
    key: "appetite", label: "Appetit", type: "line", color: "#fb923c", unit: "/5",
    getValue: (ci) => ci.appetite ?? null,
    yDomain: scaleFixed(0, 5),
  },
  {
    key: "digestion", label: "Verdauung", type: "line", color: "#4ade80", unit: "/5",
    getValue: (ci) => ci.digestion ?? null,
    yDomain: scaleFixed(0, 5),
  },
  {
    key: "trainingQuality", label: "Trainingsqualität", type: "line", color: "#10b981", unit: "/5",
    getValue: (ci) => ci.training ? (ci.trainingQuality ?? null) : null,
    yDomain: scaleFixed(0, 5),
  },
  {
    key: "nutritionCompliance", label: "Ernährungs-Compliance", type: "completion", color: "#60a5fa", unit: "",
    getValue: (ci) => {
      const c = ci.mealCompliance;
      if (c === "fully_followed" || c === "full") return 1;
      if (c === "tracked_in_calorie_tracker" || c === "full_tracking") return 0.5;
      return 0;
    },
  },
  {
    key: "trainingCompleted", label: "Training absolviert", type: "completion", color: "#4ade80", unit: "",
    getValue: (ci) => ci.training ? 1 : 0,
  },
  {
    key: "cardioCompleted", label: "Cardio absolviert", type: "completion", color: "#34d399", unit: "",
    getValue: (ci) => ci.cardio ? 1 : 0,
  },
  {
    key: "calorieTracking", label: "Kalorien getrackt", type: "completion", color: "#a78bfa", unit: "",
    getValue: (ci) => {
      const c = ci.mealCompliance;
      return (c === "tracked_in_calorie_tracker" || c === "full_tracking") ? 1 : 0;
    },
  },
  { key: "notes", label: "Tagesanmerkungen", type: "notes", color: "#8fa3c0" },
];

type Range = "7" | "30" | "60" | "90" | "180" | "365";
const RANGES: { value: Range; label: string }[] = [
  { value: "7", label: "7 Tage" },
  { value: "30", label: "30 Tage" },
  { value: "60", label: "2 Monate" },
  { value: "90", label: "3 Monate" },
  { value: "180", label: "6 Monate" },
  { value: "365", label: "12 Monate" },
];

const CustomTooltip = ({
  active, payload, label, unit,
}: {
  active?: boolean;
  payload?: { color: string; name: string; value: number }[];
  label?: string;
  unit?: string;
}) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-sm shadow-xl">
        <p className="text-[#8fa3c0] text-xs mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="font-bold" style={{ color: p.color }}>
            {p.name}: {p.value}{unit}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface Props {
  checkIns: DailyCheckIn[];
}

export function ProgressAnalytics({ checkIns }: Props) {
  const [metricKey, setMetricKey] = useState<string>("weight");
  const [range, setRange] = useState<Range>("30");

  const sorted = [...checkIns].sort((a, b) => a.date.localeCompare(b.date));

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Number(range));
  const cutoffStr = cutoff.toISOString().split("T")[0];
  const filtered = sorted.filter((ci) => ci.date >= cutoffStr);

  const selectedMetric = METRICS.find((m) => m.key === metricKey) ?? METRICS[0];

  const lineData =
    selectedMetric.type === "line"
      ? (filtered
          .map((ci) => {
            const val = selectedMetric.getValue!(ci);
            return val !== null ? { date: formatDateShort(ci.date), value: val } : null;
          })
          .filter(Boolean) as { date: string; value: number }[])
      : [];

  const bpData =
    selectedMetric.type === "bloodPressure"
      ? filtered
          .filter((ci) => ci.bloodPressure != null)
          .map((ci) => ({
            date: formatDateShort(ci.date),
            Systolisch: ci.bloodPressure!.systolic,
            Diastolisch: ci.bloodPressure!.diastolic,
          }))
      : [];

  const completionData =
    selectedMetric.type === "completion"
      ? filtered.map((ci) => ({
          date: formatDateShort(ci.date),
          value: selectedMetric.getValue!(ci) ?? 0,
        }))
      : [];

  const notesData =
    selectedMetric.type === "notes"
      ? filtered.filter((ci) => ci.note?.trim())
      : [];

  const hasData =
    lineData.length > 0 ||
    bpData.length > 0 ||
    completionData.length > 0 ||
    notesData.length > 0;

  // Y-axis domain for line chart
  const lineYDomain: [number, number] | undefined =
    lineData.length > 0 && selectedMetric.yDomain
      ? selectedMetric.yDomain(lineData.map((d) => d.value))
      : undefined;

  // Y-axis domain for blood pressure
  const bpYDomain: [number, number] | undefined =
    bpData.length > 0
      ? (() => {
          const allVals = bpData.flatMap((d) => [d.Systolisch, d.Diastolisch]);
          return dynamicDomain(allVals, 10);
        })()
      : undefined;

  // Summary stats
  let statsRows: { label: string; value: string }[] = [];
  if (selectedMetric.type === "line" && lineData.length > 1) {
    const vals = lineData.map((d) => d.value);
    statsRows = [
      { label: "Ø Wert", value: (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) + (selectedMetric.unit ?? "") },
      { label: "Min", value: Math.min(...vals).toFixed(1) + (selectedMetric.unit ?? "") },
      { label: "Max", value: Math.max(...vals).toFixed(1) + (selectedMetric.unit ?? "") },
    ];
  } else if (selectedMetric.type === "completion" && completionData.length > 0) {
    const done = completionData.filter((d) => d.value > 0).length;
    statsRows = [
      { label: "Compliance-Rate", value: `${Math.round((done / completionData.length) * 100)} %` },
      { label: "Tage gesamt", value: String(completionData.length) },
      { label: "Tage absolviert", value: String(done) },
    ];
  }

  const dotVisible = filtered.length <= 30;

  return (
    <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-4">
      <p className="text-xs text-[#5a7090] uppercase tracking-widest">Datenanalyse</p>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[#5a7090]">Parameter</label>
          <select
            value={metricKey}
            onChange={(e) => setMetricKey(e.target.value)}
            className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
          >
            {METRICS.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                range === r.value
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#0f1624] border border-[#1e2d42] text-[#8fa3c0] hover:text-[#f0f4ff]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[180px]">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-44 gap-2">
            <p className="text-[#5a7090] text-sm">Keine Daten für diesen Zeitraum.</p>
            <p className="text-[#3a4d60] text-xs">Trage Daily Check-ins ein, um hier Daten zu sehen.</p>
          </div>
        ) : selectedMetric.type === "line" ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#5a7090", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "#5a7090", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={42}
                domain={lineYDomain ?? ["auto", "auto"]}
              />
              <Tooltip content={<CustomTooltip unit={selectedMetric.unit} />} />
              <Line
                type="monotone"
                dataKey="value"
                name={selectedMetric.label}
                stroke={selectedMetric.color}
                strokeWidth={2.5}
                dot={dotVisible ? { fill: selectedMetric.color, r: 3, strokeWidth: 0 } : false}
                activeDot={{ fill: selectedMetric.color, r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : selectedMetric.type === "bloodPressure" ? (
          bpData.length === 0 ? (
            <div className="flex items-center justify-center h-44 text-[#5a7090] text-sm">
              Keine Blutdruck-Daten vorhanden.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={bpData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#5a7090", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: "#5a7090", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={42}
                  domain={bpYDomain ?? ["auto", "auto"]}
                />
                <Tooltip content={<CustomTooltip unit=" mmHg" />} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#8fa3c0" }} />
                <Line
                  type="monotone"
                  dataKey="Systolisch"
                  stroke={selectedMetric.color}
                  strokeWidth={2.5}
                  dot={dotVisible ? { fill: selectedMetric.color, r: 3, strokeWidth: 0 } : false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="Diastolisch"
                  stroke={selectedMetric.color2}
                  strokeWidth={2.5}
                  dot={dotVisible ? { fill: selectedMetric.color2, r: 3, strokeWidth: 0 } : false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )
        ) : selectedMetric.type === "completion" ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={completionData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#5a7090", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "#5a7090", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={28}
                domain={[0, 1]}
                ticks={[0, 0.5, 1]}
              />
              <Tooltip content={<CustomTooltip unit="" />} />
              <Bar
                dataKey="value"
                name={selectedMetric.label}
                fill={selectedMetric.color}
                radius={[3, 3, 0, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
            {notesData.length === 0 ? (
              <p className="text-[#5a7090] text-sm py-4 text-center">Keine Anmerkungen in diesem Zeitraum.</p>
            ) : (
              [...notesData].reverse().map((ci) => (
                <div key={ci.id} className="p-3 rounded-xl bg-[#0f1624] border border-[#1e2d42]">
                  <p className="text-xs text-[#5a7090] mb-1">
                    {new Date(ci.date).toLocaleDateString("de-DE", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-[#c8d8e8]">{ci.note}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {statsRows.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {statsRows.map((s) => (
            <div key={s.label} className="p-3 rounded-xl bg-[#0f1624] border border-[#1e2d42] flex flex-col gap-1">
              <p className="text-xs text-[#5a7090]">{s.label}</p>
              <p className="text-sm font-bold text-[#f0f4ff]">{s.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
