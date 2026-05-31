"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Athlete } from "@/types";
import { loadAuth, loadAthletes, addDailyCheckIn } from "@/lib/store";
import { DEFAULT_DAILY_CHECK_CONFIG } from "@/types";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { DailyCheckInForm } from "@/components/athlete/DailyCheckInForm";
import { ProgressAnalytics } from "@/components/coach/ProgressAnalytics";
import {
  analyzeWeek, calculateDistanceToGoal, calculateGoalProgressPercent,
  getLastCheckIn, todayISO, getGoalLabel, getTrendIcon, getTrendColor,
  getWeekDates,
} from "@/lib/utils";
import { ClipboardCheck, CalendarPlus, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { listContainer, listItem } from "@/lib/motion";

function getWeekday(isoDate: string): string {
  return new Date(isoDate + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long" });
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function minBackfillISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d.toISOString().split("T")[0];
}

export default function AthleteDashboard() {
  const router = useRouter();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showBackfill, setShowBackfill] = useState(false);
  const [backfillDate, setBackfillDate] = useState(yesterdayISO);

  useEffect(() => {
    const auth = loadAuth();
    if (auth.role !== "athlete" || !auth.athleteId) { router.replace("/login"); return; }
    loadAthletes().then((athletes) => {
      const found = athletes.find((a) => a.id === auth.athleteId);
      if (!found) { router.replace("/login"); return; }
      setAthlete(found);
    });
  }, [router]);

  const today = useMemo(() => todayISO(), []);
  const weekStart = useMemo(() => getWeekDates(today).start, [today]);
  const analysis = useMemo(() => athlete ? analyzeWeek(athlete) : null, [athlete]);
  const dist = useMemo(() => athlete ? calculateDistanceToGoal(athlete.currentWeight, athlete.targetWeight) : 0, [athlete]);
  const progress = useMemo(() => athlete ? calculateGoalProgressPercent(athlete.startWeight, athlete.currentWeight, athlete.targetWeight) : 0, [athlete]);
  const lastCI = useMemo(() => athlete ? getLastCheckIn(athlete.dailyCheckIns) : undefined, [athlete?.dailyCheckIns]);
  const alreadyCheckedIn = useMemo(() => lastCI?.date === today, [lastCI, today]);
  const trendColor = useMemo(() => athlete && analysis ? getTrendColor(analysis.trend, athlete.goalType) : "text-[#8fa3c0]", [analysis, athlete]);
  const visibleAdjustments = useMemo(
    () => (athlete?.weeklyAdjustments ?? []).filter((a) => a.weekStart === weekStart && a.visibleToAthlete),
    [athlete?.weeklyAdjustments, weekStart]
  );
  const backfillExisting = useMemo(
    () => athlete?.dailyCheckIns.find((c) => c.date === backfillDate),
    [athlete?.dailyCheckIns, backfillDate]
  );

  if (!athlete) {
    return (
      <AppShell role="athlete">
        <div className="max-w-lg mx-auto flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="w-14 h-14 rounded-full shrink-0" />
          </div>
          <Skeleton className="h-[72px] rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-52 rounded-2xl" />
        </div>
      </AppShell>
    );
  }


  async function handleCheckInSubmit(data: any) {
    const updated = await addDailyCheckIn(athlete!.id, data);
    setAthlete(updated.find((a) => a.id === athlete!.id)!);
    setShowCheckIn(false);
  }

  async function handleBackfillSubmit(data: any) {
    const updated = await addDailyCheckIn(athlete!.id, data);
    setAthlete(updated.find((a) => a.id === athlete!.id)!);
    setShowBackfill(false);
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Guten Morgen" : hour < 17 ? "Guten Tag" : "Guten Abend";

  return (
    <AppShell role="athlete">
      <div className="max-w-lg mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-[#5a7090]">{greeting},</p>
            <h1 className="text-2xl font-bold text-[#f0f4ff]">{athlete.name.split(" ")[0]}</h1>
            <p className="text-sm text-[#8fa3c0]">
              {new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}
              {" · "}
              <span className="text-[#60a5fa]">{getGoalLabel(athlete.goalType)}</span>
            </p>
          </div>
          <div className="w-14 h-14 rounded-full overflow-hidden bg-[#1d4ed8]/20 flex items-center justify-center shrink-0">
            {athlete.profileImage ? (
              <img src={athlete.profileImage.url} alt={athlete.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-[#60a5fa]">{athlete.avatarInitials}</span>
            )}
          </div>
        </div>

        {/* Einführungsvideo – shown after onboarding */}
        {athlete.onboardingCompleted && (
          <a
            href="https://www.loom.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-2xl bg-[#1a2744] border border-[#3b82f6]/30 hover:border-[#3b82f6]/60 hover:bg-[#1e2f52] transition-all group"
          >
            <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#3b82f6]/20 flex items-center justify-center group-hover:bg-[#3b82f6]/30 transition-colors">
              <PlayCircle size={22} className="text-[#60a5fa]" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="text-sm font-semibold text-[#f0f4ff]">Einführungsvideo ansehen</p>
              <p className="text-xs text-[#8fa3c0] truncate">Lerne, wie du dieses Tool optimal nutzt</p>
            </div>
            <span className="ml-auto text-[#3b82f6] text-lg flex-shrink-0">→</span>
          </a>
        )}

        {/* Daily check-in – first element */}
        <div
          className={cn(
            "rounded-2xl border overflow-hidden transition-all",
            alreadyCheckedIn
              ? "bg-[#141d2e] border-[#1e2d42]"
              : "bg-[#1a1209]/30 border-[#ca8a04]/25 ring-1 ring-[#ca8a04]/10"
          )}
        >
          {/* Today toggle */}
          <button
            onClick={() => setShowCheckIn(!showCheckIn)}
            className={cn(
              "w-full flex items-center justify-between px-5 py-4 transition-colors",
              alreadyCheckedIn ? "hover:bg-[#192236]" : "hover:bg-[#1a1209]/50"
            )}
          >
            <div className="flex items-center gap-3">
              <ClipboardCheck
                size={18}
                className={alreadyCheckedIn ? "text-[#10b981]" : "text-[#ca8a04]"}
              />
              <div className="text-left">
                <p className="text-sm font-semibold text-[#f0f4ff]">Daily Check-in</p>
                <p className={cn("text-xs", alreadyCheckedIn ? "text-[#5a7090]" : "text-[#ca8a04]/80")}>
                  {alreadyCheckedIn ? "Heute bereits eingetragen — bearbeiten?" : "Heute noch nicht eingetragen"}
                </p>
              </div>
            </div>
            <span className={cn("text-lg", alreadyCheckedIn ? "text-[#3b82f6]" : "text-[#ca8a04]")}>
              {showCheckIn ? "−" : "+"}
            </span>
          </button>

          {showCheckIn && (
            <div className="border-t border-[#1e2d42] p-5">
              <DailyCheckInForm
                athleteId={athlete.id}
                existingToday={alreadyCheckedIn ? lastCI : undefined}
                onSubmit={handleCheckInSubmit}
                checkConfig={{ ...DEFAULT_DAILY_CHECK_CONFIG, ...athlete.dailyCheckConfig }}
                mealPlans={athlete.mealPlans ?? []}
              />
            </div>
          )}

          {/* Nachtragen section */}
          <div className="border-t border-[#1e2d42]">
            <button
              onClick={() => setShowBackfill(!showBackfill)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#192236] transition-colors"
            >
              <div className="flex items-center gap-2">
                <CalendarPlus size={14} className="text-[#5a7090]" />
                <span className="text-xs text-[#5a7090]">Früheren Tag nachtragen</span>
              </div>
              <span className="text-xs text-[#5a7090]">{showBackfill ? "−" : "+"}</span>
            </button>

            {showBackfill && (
              <div className="px-5 pb-5 flex flex-col gap-4 border-t border-[#1e2d42]">
                <div className="flex flex-col gap-2 pt-4">
                  <label className="text-xs font-medium text-[#8fa3c0]">Datum wählen</label>
                  <div className="flex items-center gap-3 flex-wrap">
                    <input
                      type="date"
                      value={backfillDate}
                      max={yesterdayISO()}
                      min={minBackfillISO()}
                      onChange={(e) => setBackfillDate(e.target.value)}
                      className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
                    />
                    {backfillDate && (
                      <span className="text-sm text-[#8fa3c0]">{getWeekday(backfillDate)}</span>
                    )}
                  </div>
                  {backfillExisting && (
                    <p className="text-xs text-[#60a5fa]">
                      Für diesen Tag existiert bereits ein Eintrag — Daten sind vorausgefüllt.
                    </p>
                  )}
                </div>
                {backfillDate && (
                  <DailyCheckInForm
                    key={backfillDate}
                    athleteId={athlete.id}
                    existingToday={backfillExisting}
                    date={backfillDate}
                    onSubmit={handleBackfillSubmit}
                    checkConfig={{ ...DEFAULT_DAILY_CHECK_CONFIG, ...athlete.dailyCheckConfig }}
                    mealPlans={athlete.mealPlans ?? []}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Visible note */}
        {athlete.visibleNote && (
          <div className="p-4 rounded-2xl bg-[#1d4ed8]/10 border border-[#3b82f6]/20">
            <p className="text-xs text-[#60a5fa] font-medium uppercase tracking-widest mb-1">Coach-Hinweis</p>
            <p className="text-sm text-[#8fa3c0]">{athlete.visibleNote}</p>
          </div>
        )}

        {/* Weekly adjustments */}
        {visibleAdjustments.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-3">
            <p className="text-xs text-[#5a7090] uppercase tracking-widest">Änderungen diese Woche</p>
            {visibleAdjustments.map((adj) => (
              <div key={adj.id} className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-[#f0f4ff]">{adj.title}</p>
                {adj.description && <p className="text-xs text-[#8fa3c0]">{adj.description}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Stats grid — staggered */}
        <motion.div
          className="grid grid-cols-2 gap-3"
          variants={listContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={listItem}><StatCard label="Aktuell" value={athlete.currentWeight} unit="kg" accent /></motion.div>
          <motion.div variants={listItem}><StatCard label="Ziel" value={athlete.targetWeight} unit="kg" /></motion.div>
          <motion.div variants={listItem}>
            <StatCard
              label="Abstand zum Ziel"
              value={dist > 0 ? `+${dist}` : dist}
              unit="kg"
              color={Math.abs(dist) < 0.5 ? "text-[#10b981]" : "text-[#f0f4ff]"}
            />
          </motion.div>
          <motion.div variants={listItem}>
            <StatCard
              label="Wochentrend"
              value={
                analysis?.changeKg != null && athlete.currentWeight
                  ? (
                    <span className="flex items-baseline gap-1.5 flex-wrap">
                      <span>{getTrendIcon(analysis!.trend)} {analysis!.changeKg > 0 ? "+" : ""}{analysis!.changeKg} kg</span>
                      <span className="text-base font-medium opacity-70">({analysis!.changeKg > 0 ? "+" : ""}{((analysis!.changeKg / athlete.currentWeight) * 100).toFixed(2)} %)</span>
                    </span>
                  )
                  : "–"
              }
              color={trendColor}
            />
          </motion.div>
        </motion.div>

        {/* Progress */}
        <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[#8fa3c0]">Fortschritt zum Ziel</span>
            <span className="text-sm font-bold text-[#f0f4ff]">{progress}%</span>
          </div>
          <ProgressBar value={progress} />
          <div className="flex justify-between text-xs text-[#5a7090] mt-2">
            <span>Start {athlete.startWeight} kg</span>
            <span>Ziel {athlete.targetWeight} kg</span>
          </div>
        </div>

        {/* Data analysis */}
        <ProgressAnalytics checkIns={athlete.dailyCheckIns} />

      </div>
    </AppShell>
  );
}
