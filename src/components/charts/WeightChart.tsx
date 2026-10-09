"use client";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, ReferenceArea,
} from "recharts";
import { DailyCheckIn, SeasonPlan } from "@/types";
import { formatDateShort } from "@/lib/utils";
import {
  actualRate, activePhase, ampelColor, buildTargetCurve, formatPct, formatRate,
  formatSignedKg, phaseStatus, phaseTypeColor, phaseTypeLabel, todayISO, addDays,
} from "@/lib/seasonUtils";

interface WeightChartProps {
  checkIns: DailyCheckIn[];
  targetWeight: number;
  startWeight: number;
  height?: number;
  /** Optional annual plan. Overlay is only shown when plan.visibleToAthlete is true. */
  seasonPlan?: SeasonPlan;
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; name?: string; color?: string }[];
  label?: string;
}) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#141d2e] border border-[#1e2d42] rounded-xl px-3 py-2 text-sm shadow-xl">
        <p className="text-[#8fa3c0] text-xs mb-0.5">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="font-bold" style={{ color: p.color ?? "#f0f4ff" }}>
            {p.name ?? ""}: {p.value} kg
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function WeightChart({ checkIns, targetWeight, startWeight, height = 220, seasonPlan }: WeightChartProps) {
  const planAvailable = !!seasonPlan && seasonPlan.visibleToAthlete;
  const [showPlan, setShowPlan] = useState<boolean>(false);

  const sorted = useMemo(
    () => [...checkIns].sort((a, b) => a.date.localeCompare(b.date)).slice(-28),
    [checkIns]
  );

  const planOverlay = planAvailable && showPlan;

  const data = useMemo(() => {
    const curveByDate = new Map<string, number>();
    if (planOverlay && seasonPlan) {
      for (const p of buildTargetCurve(seasonPlan)) curveByDate.set(p.date, p.target);
    }
    return sorted.map((c) => ({
      date: formatDateShort(c.date),
      isoDate: c.date,
      weight: c.weight,
      target: curveByDate.get(c.date) ?? null,
    }));
  }, [sorted, planOverlay, seasonPlan]);

  const planBands = useMemo(() => {
    if (!planOverlay || !seasonPlan) return [] as { x1: string; x2: string; color: string }[];
    const out: { x1: string; x2: string; color: string }[] = [];
    for (const p of seasonPlan.phases) {
      const inside = data.filter((d) => d.isoDate >= p.startDate && d.isoDate <= p.endDate);
      if (inside.length === 0) continue;
      out.push({ x1: inside[0].date, x2: inside[inside.length - 1].date, color: phaseTypeColor(p.type) });
    }
    return out;
  }, [planOverlay, seasonPlan, data]);

  const planStats = useMemo(() => {
    if (!planOverlay || !seasonPlan) return null;
    const current = activePhase(seasonPlan);
    if (!current) return null;
    const today = todayISO();
    const ist = actualRate(checkIns, addDays(today, -30), today);
    const st = phaseStatus(current, checkIns);
    return { current, ist, status: st };
  }, [planOverlay, seasonPlan, checkIns]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-36 text-[#5a7090] text-sm">
        Noch keine Daten vorhanden.
      </div>
    );
  }

  const weights = data.map((d) => d.weight);
  const targets = data.map((d) => d.target).filter((v): v is number => v != null);
  const minW = Math.min(...weights, targetWeight, ...targets) - 1;
  const maxW = Math.max(...weights, startWeight, ...targets) + 1;

  const showAmpel = planOverlay && seasonPlan?.showStatusToAthlete;

  return (
    <div className="flex flex-col gap-3">
      {planAvailable && (
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <button
            type="button"
            onClick={() => setShowPlan((v) => !v)}
            className={`relative w-9 h-5 rounded-full transition-colors ${showPlan ? "bg-[#3b82f6]" : "bg-[#1e2d42]"}`}
            aria-label="Jahresplan einblenden"
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${showPlan ? "translate-x-4" : ""}`} />
          </button>
          <span className="text-xs text-[#8fa3c0]">Jahresplan einblenden</span>
        </label>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#5a7090", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minW, maxW]}
            tick={{ fill: "#5a7090", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}`}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} />
          {planOverlay && planBands.map((b, i) => (
            <ReferenceArea key={i} x1={b.x1} x2={b.x2} fill={b.color} fillOpacity={0.08} stroke="none" />
          ))}
          {!planOverlay && (
            <ReferenceLine
              y={targetWeight}
              stroke="#10b981"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ value: "Ziel", fill: "#10b981", fontSize: 10, position: "right" }}
            />
          )}
          {planOverlay && (
            <Line
              type="monotone"
              dataKey="target"
              name="Soll"
              stroke="#60a5fa"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              connectNulls
            />
          )}
          <Line
            type="monotone"
            dataKey="weight"
            name="Gewicht"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={data.length <= 14 ? { fill: "#3b82f6", r: 3, strokeWidth: 0 } : false}
            activeDot={{ fill: "#60a5fa", r: 5, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {planOverlay && planStats && (
        <div className="rounded-xl bg-[#0f1624] border border-[#1e2d42] p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full" style={{ background: phaseTypeColor(planStats.current.type) }} />
            <span className="text-xs font-semibold text-[#f0f4ff]">
              {planStats.current.name} · {phaseTypeLabel(planStats.current.type)}
            </span>
            {showAmpel && (
              <span className="w-2 h-2 rounded-full ml-auto" style={{ background: ampelColor(planStats.status.ampel) }} />
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <MiniKpi label="Soll-Rate" value={formatRate(planStats.current.targetRatePerWeek)} />
            <MiniKpi label="Ist-Rate" value={formatRate(planStats.ist.kgPerWeek)} sub={formatPct(planStats.ist.percentPerWeek)} />
            {showAmpel && (
              <MiniKpi
                label="Abweichung"
                value={formatSignedKg(planStats.status.deviationKg)}
                accent={ampelColor(planStats.status.ampel)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniKpi({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="p-2 rounded-lg bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-0.5">
      <p className="text-[10px] text-[#5a7090]">{label}</p>
      <p className="text-xs font-bold" style={{ color: accent ?? "#f0f4ff" }}>{value}</p>
      {sub && <p className="text-[10px] text-[#8fa3c0]">{sub}</p>}
    </div>
  );
}
