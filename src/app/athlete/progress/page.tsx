"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Athlete } from "@/types";
import { loadAuth, loadAthletes } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { WeightChart } from "@/components/charts/WeightChart";
import {
  analyzeWeek, calculateDistanceToGoal, calculateGoalProgressPercent,
  getTrendIcon, getTrendColor,
} from "@/lib/utils";

export default function AthleteProgress() {
  const router = useRouter();
  const [athlete, setAthlete] = useState<Athlete | null>(null);

  useEffect(() => {
    const auth = loadAuth();
    if (auth.role !== "athlete" || !auth.athleteId) { router.replace("/login"); return; }
    const found = loadAthletes().find((a) => a.id === auth.athleteId);
    if (!found) { router.replace("/login"); return; }
    setAthlete(found);
  }, [router]);

  if (!athlete) {
    return (
      <AppShell role="athlete" title="Fortschritt">
        <div className="max-w-lg mx-auto flex flex-col gap-5">
          <Skeleton className="h-72 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  const analysis = analyzeWeek(athlete);
  const dist = calculateDistanceToGoal(athlete.currentWeight, athlete.targetWeight);
  const progress = calculateGoalProgressPercent(athlete.startWeight, athlete.currentWeight, athlete.targetWeight);
  const totalChange = Math.round((athlete.currentWeight - athlete.startWeight) * 10) / 10;
  const trendColor = getTrendColor(analysis.trend, athlete.goalType);

  return (
    <AppShell role="athlete" title="Fortschritt">
      <div className="max-w-lg mx-auto flex flex-col gap-5">
        {/* Weight chart */}
        <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42]">
          <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-1">Gewichtsverlauf</p>
          <p className="text-2xl font-bold text-[#f0f4ff] mb-4">{athlete.currentWeight} kg</p>
          <WeightChart
            checkIns={athlete.dailyCheckIns}
            targetWeight={athlete.targetWeight}
            startWeight={athlete.startWeight}
            height={240}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Startgewicht" value={athlete.startWeight} unit="kg" />
          <StatCard label="Zielgewicht" value={athlete.targetWeight} unit="kg" />
          <StatCard
            label="Veränderung (Start)"
            value={totalChange > 0 ? `+${totalChange}` : totalChange}
            unit="kg"
            color={totalChange < 0 && athlete.goalType === "cut" ? "text-[#10b981]" : totalChange > 0 && athlete.goalType === "bulk" ? "text-[#10b981]" : "text-[#f0f4ff]"}
          />
          <StatCard
            label="Abstand zum Ziel"
            value={dist > 0 ? `+${dist}` : dist}
            unit="kg"
            color={Math.abs(dist) < 0.5 ? "text-[#10b981]" : "text-[#f0f4ff]"}
          />
          <StatCard
            label="Wochentrend"
            value={`${getTrendIcon(analysis.trend)} ${analysis.changeKg > 0 ? "+" : ""}${analysis.changeKg}`}
            unit="kg"
            color={trendColor}
          />
        </div>

        {/* Progress to goal */}
        <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42]">
          <ProgressBar value={progress} label="Fortschritt zum Ziel" showPercent className="mb-3" />
          <div className="flex justify-between text-xs text-[#5a7090]">
            <span>Start {athlete.startWeight} kg</span>
            <span>Ziel {athlete.targetWeight} kg</span>
          </div>
        </div>

        {/* Week comparison */}
        <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42]">
          <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-3">Wochenvergleich</p>
          <div className="flex gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-[#5a7090]">Ø diese Woche</span>
              <span className="text-lg font-bold text-[#f0f4ff]">{analysis.currentWeekAvg || "–"} kg</span>
            </div>
            <div className="w-px bg-[#1e2d42]" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-[#5a7090]">Ø Vorwoche</span>
              <span className="text-lg font-bold text-[#f0f4ff]">{analysis.previousWeekAvg || "–"} kg</span>
            </div>
            <div className="w-px bg-[#1e2d42]" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-[#5a7090]">Differenz</span>
              <span className={`text-lg font-bold ${trendColor}`}>
                {analysis.changeKg > 0 ? "+" : ""}{analysis.changeKg} kg
              </span>
            </div>
          </div>
        </div>

        {/* Check-in history */}
        {athlete.dailyCheckIns.length > 0 && (
          <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden">
            <p className="text-xs text-[#5a7090] uppercase tracking-widest px-4 pt-4 pb-2">Letzte Check-ins</p>
            <div className="divide-y divide-[#1e2d42]">
              {[...athlete.dailyCheckIns]
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 7)
                .map((ci) => (
                  <div key={ci.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm text-[#f0f4ff]">
                        {new Date(ci.date).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "short" })}
                      </span>
                      <div className="flex gap-2 text-xs text-[#5a7090]">
                        <span>E {ci.energyLevel}/5</span>
                        <span>Schlaf {ci.sleepHours}h</span>
                        <span>{ci.steps.toLocaleString()} Schritte</span>
                      </div>
                    </div>
                    <span className="text-base font-bold text-[#f0f4ff]">{ci.weight} kg</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
