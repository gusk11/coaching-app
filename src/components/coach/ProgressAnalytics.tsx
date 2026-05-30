"use client";
import { useState } from "react";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { DailyCheckIn } from "@/types";
import { formatDateShort, normalizeNutritionStatus } from "@/lib/utils";
import {
  floorToStep,
  ceilToStep,
  dynamicDomain,
  dynamicTightWeight,
  dynamicTightSleep,
  scaleFixed,
} from "@/lib/chartUtils";

type MetricType = "line" | "bloodPressure" | "compliance";

type MetricDef = {
  key: string;
  label: string;
  type: MetricType;
  color: string;
  color2?: string;
  unit?: string;
  getValue?: (ci: DailyCheckIn) => number | null;
  yDomain?: (vals: number[]) => [number, number];
};


const METRICS: MetricDef[] = [
  {
    key: "weight", label: "Körpergewicht", type: "line", color: "#3b82f6", unit: " kg",
    getValue: (ci) => ci.weight,
    yDomain: dynamicTightWeight,
  },
  {
    key: "sleepHours", label: "Schlafdauer", type: "line", color: "#a78bfa", unit: " h",
    getValue: (ci) => ci.sleepHours ?? null,
    yDomain: dynamicTightSleep,
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
      const range = max - min;
      const padding = Math.max(1, range * 0.3);
      return [
        Math.max(80, floorToStep(min - padding, 1)),
        Math.min(100, ceilToStep(max + padding, 1)),
      ];
    },
  },
  {
    key: "bloodPressure", label: "Blutdruck", type: "bloodPressure",
    color: "#fb7185", color2: "#38bdf8", unit: " mmHg",
  },
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
    key: "nutritionCompliance", label: "Ernährungs-Compliance", type: "compliance", color: "#60a5fa",
    getValue: (ci) => {
      const ns = normalizeNutritionStatus(ci);
      if (ns === "meal_plan_followed") return 1;
      if (ns === "calorie_tracker_used") return 0.5;
      return 0;
    },
  },
  {
    key: "trainingCompleted", label: "Training absolviert", type: "compliance", color: "#4ade80",
    getValue: (ci) => ci.training ? 1 : 0,
  },
  {
    key: "cardioCompleted", label: "Cardio absolviert", type: "compliance", color: "#34d399",
    getValue: (ci) => ci.cardio ? 1 : 0,
  },
  {
    key: "calorieTracking", label: "Kalorien getrackt", type: "compliance", color: "#a78bfa",
    getValue: (ci) => normalizeNutritionStatus(ci) === "calorie_tracker_used" ? 1 : 0,
  },
];

type RangeMode = "7" | "30" | "months" | "all";

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
  const [rangeMode, setRangeMode] = useState<RangeMode>("30");
  const [monthCount, setMonthCount] = useState<number>(3);

  const sorted = [...checkIns].sort((a, b) => a.date.localeCompare(b.date));

  let filtered: DailyCheckIn[];
  if (rangeMode === "all") {
    filtered = sorted;
  } else if (rangeMode === "months") {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - monthCount);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    filtered = sorted.filter((ci) => ci.date >= cutoffStr);
  } else {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(rangeMode));
    const cutoffStr = cutoff.toISOString().split("T")[0];
    filtered = sorted.filter((ci) => ci.date >= cutoffStr);
  }

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

  const complianceData =
    selectedMetric.type === "compliance"
      ? filtered.map((ci) => ({
          date: formatDateShort(ci.date),
          value: selectedMetric.getValue!(ci) ?? 0,
        }))
      : [];

  // Y-axis domains
  const lineYDomain: [number, number] | undefined =
    lineData.length > 0 && selectedMetric.yDomain
      ? selectedMetric.yDomain(lineData.map((d) => d.value))
      : undefined;

  const bpYDomain: [number, number] | undefined =
    bpData.length > 0
      ? dynamicDomain(bpData.flatMap((d) => [d.Systolisch, d.Diastolisch]), 10)
      : undefined;

  // Summary stats
  let lineStats: { label: string; value: string }[] = [];
  if (selectedMetric.type === "line" && lineData.length > 1) {
    const vals = lineData.map((d) => d.value);
    lineStats = [
      { label: "Ø Wert", value: (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) + (selectedMetric.unit ?? "") },
      { label: "Min", value: Math.min(...vals).toFixed(1) + (selectedMetric.unit ?? "") },
      { label: "Max", value: Math.max(...vals).toFixed(1) + (selectedMetric.unit ?? "") },
    ];
  }

  let complianceStats: { label: string; value: string }[] = [];
  if (selectedMetric.type === "compliance") {
    if (complianceData.length === 0) {
      complianceStats = [
        { label: "Compliance-Rate", value: "–" },
        { label: "Tage gesamt", value: "0" },
        { label: "Tage absolviert", value: "0" },
      ];
    } else {
      const done = complianceData.filter((d) => d.value > 0).length;
      complianceStats = [
        { label: "Compliance-Rate", value: `${Math.round((done / complianceData.length) * 100)} %` },
        { label: "Tage gesamt", value: String(complianceData.length) },
        { label: "Tage absolviert", value: String(done) },
      ];
    }
  }

  const dotVisible = filtered.length <= 30;

  const btnClass = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
      active
        ? "bg-[#3b82f6] text-white"
        : "bg-[#0f1624] border border-[#1e2d42] text-[#8fa3c0] hover:text-[#f0f4ff]"
    }`;

  return (
    <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-4">
      <p className="text-xs text-[#5a7090] uppercase tracking-widest">Datenanalyse</p>

      <div className="flex flex-col gap-3">
        {/* Parameter selector */}
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

        {/* Time range selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => setRangeMode("7")} className={btnClass(rangeMode === "7")}>
            7 Tage
          </button>
          <button onClick={() => setRangeMode("30")} className={btnClass(rangeMode === "30")}>
            30 Tage
          </button>

          {/* Month picker */}
          <div className={`flex items-center gap-0.5 rounded-lg border px-1.5 py-1 transition-colors ${
            rangeMode === "months"
              ? "border-[#3b82f6] bg-[#0f1624]"
              : "border-[#1e2d42] bg-[#0f1624]"
          }`}>
            <button
              onClick={() => { setRangeMode("months"); setMonthCount((c) => Math.max(1, c - 1)); }}
              className="w-5 h-5 flex items-center justify-center text-[#8fa3c0] hover:text-[#f0f4ff] text-base leading-none rounded"
              aria-label="Weniger Monate"
            >
              −
            </button>
            <button
              onClick={() => setRangeMode("months")}
              className={`px-1.5 text-xs font-medium min-w-[58px] text-center transition-colors ${
                rangeMode === "months" ? "text-white" : "text-[#8fa3c0]"
              }`}
            >
              {monthCount} {monthCount === 1 ? "Monat" : "Monate"}
            </button>
            <button
              onClick={() => { setRangeMode("months"); setMonthCount((c) => Math.min(24, c + 1)); }}
              className="w-5 h-5 flex items-center justify-center text-[#8fa3c0] hover:text-[#f0f4ff] text-base leading-none rounded"
              aria-label="Mehr Monate"
            >
              +
            </button>
          </div>

          <button onClick={() => setRangeMode("all")} className={btnClass(rangeMode === "all")}>
            Gesamte Zeit
          </button>
        </div>
      </div>

      {/* Chart area — hidden for compliance parameters */}
      {selectedMetric.type !== "compliance" && (
        <div className="min-h-[180px]">
          {selectedMetric.type === "line" && lineData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-44 gap-2">
              <p className="text-[#5a7090] text-sm">Keine Daten für diesen Zeitraum vorhanden.</p>
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
          ) : selectedMetric.type === "bloodPressure" && bpData.length === 0 ? (
            <div className="flex items-center justify-center h-44 text-[#5a7090] text-sm">
              Keine Daten für diesen Zeitraum vorhanden.
            </div>
          ) : selectedMetric.type === "bloodPressure" ? (
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
          ) : null}
        </div>
      )}

      {/* Line chart stats: Ø, Min, Max */}
      {lineStats.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {lineStats.map((s) => (
            <div key={s.label} className="p-3 rounded-xl bg-[#0f1624] border border-[#1e2d42] flex flex-col gap-1">
              <p className="text-xs text-[#5a7090]">{s.label}</p>
              <p className="text-sm font-bold text-[#f0f4ff]">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Compliance stats: Rate, Tage gesamt, Tage absolviert */}
      {complianceStats.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {complianceStats.map((s) => (
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
