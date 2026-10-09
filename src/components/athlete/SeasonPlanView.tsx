"use client";
import { useMemo, useState } from "react";
import { Athlete } from "@/types";
import { SeasonChart, SeasonChartRange } from "@/components/charts/SeasonChart";
import {
  activePhase, actualRate, addDays, ampelColor, formatDeviationPct, formatPct, formatRate, formatSignedKg,
  phaseStatus, phaseTypeColor, phaseTypeLabel, ratePct, todayISO,
} from "@/lib/seasonUtils";
import { CalendarDays } from "lucide-react";

interface Props {
  athlete: Athlete;
}

export function SeasonPlanView({ athlete }: Props) {
  const plan = athlete.seasonPlan;
  const entries = useMemo(() => athlete.dailyCheckIns ?? [], [athlete.dailyCheckIns]);
  const [range, setRange] = useState<SeasonChartRange>("plan");

  const current = useMemo(() => plan ? activePhase(plan) : undefined, [plan]);
  const status = useMemo(() => (plan && current) ? phaseStatus(current, entries) : null, [plan, current, entries]);
  const rateRange = useMemo(() => {
    const today = todayISO();
    switch (range) {
      case "7": return { from: addDays(today, -7), to: today };
      case "30": return { from: addDays(today, -30), to: today };
      case "90": return { from: addDays(today, -90), to: today };
      case "all":
      case "plan":
      default:
        if (current) return { from: current.startDate, to: today };
        return { from: addDays(today, -30), to: today };
    }
  }, [range, current]);
  const ist = useMemo(() => actualRate(entries, rateRange.from, rateRange.to), [entries, rateRange]);

  if (!plan || !plan.visibleToAthlete) {
    return (
      <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] p-6 flex flex-col items-center gap-3 text-center">
        <CalendarDays size={32} className="text-[#5a7090]" />
        <p className="text-sm font-semibold text-[#f0f4ff]">Noch kein Jahresplan freigegeben</p>
        <p className="text-xs text-[#8fa3c0] max-w-md">
          Sobald dein Coach einen Jahresplan für dich erstellt und freigegeben hat, siehst du hier deine Phasen und den Verlauf.
        </p>
      </div>
    );
  }

  const showStatus = plan.showStatusToAthlete;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] p-4">
        <SeasonChart
          plan={plan}
          entries={entries}
          editable={false}
          range={range}
          onRangeChange={setRange}
          showStatus={showStatus}
        />
      </div>

      {current && (
        <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: phaseTypeColor(current.type) }} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#f0f4ff]">
                Aktuelle Phase: {current.name}
                <span className="text-xs text-[#5a7090] ml-2">({phaseTypeLabel(current.type)})</span>
              </p>
              <p className="text-xs text-[#8fa3c0]">
                {current.startDate} → {current.endDate}
              </p>
            </div>
            {showStatus && status && (
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: ampelColor(status.ampel) }} title={status.reason} />
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <KpiBox label="Zielgewicht" value={`${current.targetWeight.toFixed(1)} kg`} />
            <KpiBox
              label="Soll-Rate"
              value={formatRate(current.targetRatePerWeek)}
              sub={formatPct(ratePct(current.targetRatePerWeek, current.startWeight))}
            />
            <KpiBox
              label="Ist-Rate"
              value={formatRate(ist.kgPerWeek)}
              sub={formatPct(ist.percentPerWeek)}
            />
            {showStatus && status && (
              <KpiBox
                label="Abweichung"
                value={formatSignedKg(status.deviationKg)}
                sub={formatDeviationPct(status.deviationKg, status.targetToday)}
                accent={ampelColor(status.ampel)}
              />
            )}
          </div>

          {current.athleteNote && (
            <div className="rounded-xl bg-[#0f1624] border border-[#1e2d42] p-3">
              <p className="text-xs text-[#5a7090] mb-1">Notiz von deinem Coach</p>
              <p className="text-sm text-[#f0f4ff] whitespace-pre-wrap">{current.athleteNote}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function KpiBox({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="p-3 rounded-xl bg-[#0f1624] border border-[#1e2d42] flex flex-col gap-1">
      <p className="text-xs text-[#5a7090]">{label}</p>
      <p className="text-sm font-bold" style={{ color: accent ?? "#f0f4ff" }}>{value}</p>
      {sub && sub !== "–" && <p className="text-[11px] text-[#8fa3c0]">({sub})</p>}
    </div>
  );
}
