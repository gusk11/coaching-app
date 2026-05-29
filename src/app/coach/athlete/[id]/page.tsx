"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { loadAuth, loadAthletes, updateAthlete } from "@/lib/store";
import { Athlete, GoalType, MealPlan, TrainingPlan, SupplementPlan } from "@/types";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MealPlanView } from "@/components/athlete/MealPlanView";
import { TrainingAccordion } from "@/components/athlete/TrainingAccordion";
import { SupplementList } from "@/components/athlete/SupplementList";
import { MealPlanEditor } from "@/components/coach/MealPlanEditor";
import { TrainingEditor } from "@/components/coach/TrainingEditor";
import { SupplementEditor } from "@/components/coach/SupplementEditor";
import { AthleteProfileEditor } from "@/components/coach/AthleteProfileEditor";
import { ProgressAnalytics } from "@/components/coach/ProgressAnalytics";
import { DailyCheckDetailModal } from "@/components/coach/DailyCheckDetailModal";
import { WeeklyCheckDetailModal } from "@/components/coach/WeeklyCheckDetailModal";
import { Badge } from "@/components/ui/Badge";
import { DailyCheckIn, WeeklyCheckIn } from "@/types";
import {
  analyzeWeek, calculateDistanceToGoal, calculateGoalProgressPercent,
  getGoalLabel, getGoalColor, getTrendIcon, getTrendColor,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ArrowLeft, Pencil, Check, X } from "lucide-react";

const TABS = ["Übersicht", "Check-ins", "Fortschritt", "Ernährung", "Training", "Supplements"] as const;
type Tab = (typeof TABS)[number];
type CheckInSubTab = "daily" | "weekly";

const GOAL_OPTIONS: { value: GoalType; label: string }[] = [
  { value: "cut", label: "Diät / Abnehmen" },
  { value: "bulk", label: "Muskelaufbau" },
  { value: "recomp", label: "Recomposition" },
  { value: "maintenance", label: "Erhaltung" },
];

export default function CoachAthletePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [tab, setTab] = useState<Tab>("Übersicht");
  const [checkInSubTab, setCheckInSubTab] = useState<CheckInSubTab>("daily");
  const [selectedDailyCI, setSelectedDailyCI] = useState<DailyCheckIn | null>(null);
  const [selectedWeeklyCI, setSelectedWeeklyCI] = useState<WeeklyCheckIn | null>(null);

  // Goal editing
  const [editingGoal, setEditingGoal] = useState(false);
  const [editGoalType, setEditGoalType] = useState<GoalType>("cut");
  const [editGoalText, setEditGoalText] = useState("");
  const [editCoachNote, setEditCoachNote] = useState("");
  const [editVisibleNote, setEditVisibleNote] = useState("");

  // Trend target editing
  const [editingTrendTarget, setEditingTrendTarget] = useState(false);
  const [editTrendTargetInput, setEditTrendTargetInput] = useState("");

  // Plan editing
  const [editingNutrition, setEditingNutrition] = useState(false);
  const [editingTraining, setEditingTraining] = useState(false);
  const [editingSupplements, setEditingSupplements] = useState(false);

  useEffect(() => {
    const auth = loadAuth();
    if (auth.role !== "coach") { router.replace("/login"); return; }
    const found = loadAthletes().find((a) => a.id === id);
    if (!found) { router.replace("/coach/dashboard"); return; }
    setAthlete(found);
    setEditGoalType(found.goalType);
    setEditGoalText(found.goalText ?? "");
    setEditCoachNote(found.coachNote);
    setEditVisibleNote(found.visibleNote);
  }, [router, id]);

  if (!athlete) return null;

  const analysis = analyzeWeek(athlete);
  const dist = calculateDistanceToGoal(athlete.currentWeight, athlete.targetWeight);
  const progress = calculateGoalProgressPercent(athlete.startWeight, athlete.currentWeight, athlete.targetWeight);
  const trendColor = getTrendColor(analysis.trend, athlete.goalType);
  const trendPercent =
    analysis.currentWeekAvg > 0 && analysis.previousWeekAvg > 0 && athlete.currentWeight > 0
      ? Math.round((analysis.changeKg / athlete.currentWeight) * 10000) / 100
      : null;

  function saveGoalEdit() {
    const updated = updateAthlete(athlete!.id, {
      goalType: editGoalType,
      goalText: editGoalText.trim() || undefined,
      coachNote: editCoachNote,
      visibleNote: editVisibleNote,
    });
    const fresh = updated.find((a) => a.id === athlete!.id)!;
    setAthlete(fresh);
    setEditingGoal(false);
  }

  function saveTrendTarget() {
    const parsed = parseFloat(editTrendTargetInput);
    const updated = updateAthlete(athlete!.id, {
      weeklyTrendTargetPercent: isNaN(parsed) ? undefined : parsed,
    });
    setAthlete(updated.find((a) => a.id === athlete!.id)!);
    setEditingTrendTarget(false);
  }

  function saveMealPlan(plan: MealPlan) {
    const currentPlans = athlete!.mealPlans ?? (athlete!.mealPlan ? [athlete!.mealPlan] : []);
    const exists = currentPlans.some(p => p.id === plan.id);
    const newPlans = exists
      ? currentPlans.map(p => p.id === plan.id ? plan : p)
      : [...currentPlans, plan];
    const updated = updateAthlete(athlete!.id, { mealPlans: newPlans });
    setAthlete(updated.find((a) => a.id === athlete!.id)!);
  }

  function deleteMealPlan(planId: string) {
    const currentPlans = athlete!.mealPlans ?? (athlete!.mealPlan ? [athlete!.mealPlan] : []);
    const newPlans = currentPlans.filter(p => p.id !== planId);
    const updated = updateAthlete(athlete!.id, { mealPlans: newPlans });
    setAthlete(updated.find((a) => a.id === athlete!.id)!);
  }

  function saveTrainingPlan(plan: TrainingPlan) {
    const updated = updateAthlete(athlete!.id, { trainingPlan: plan });
    setAthlete(updated.find((a) => a.id === athlete!.id)!);
    setEditingTraining(false);
  }

  function saveSupplementPlan(plan: SupplementPlan) {
    const updated = updateAthlete(athlete!.id, { supplementPlan: plan });
    setAthlete(updated.find((a) => a.id === athlete!.id)!);
    setEditingSupplements(false);
  }

  function saveAthleteProfile(updates: Partial<Athlete>) {
    const updated = updateAthlete(athlete!.id, updates);
    setAthlete(updated.find((a) => a.id === athlete!.id)!);
  }

  return (
    <AppShell role="coach">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        {/* Back + Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-[#141d2e] transition-colors">
            <ArrowLeft size={18} className="text-[#8fa3c0]" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1d4ed8]/20 flex items-center justify-center text-sm font-bold text-[#60a5fa]">
              {athlete.avatarInitials}
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#f0f4ff]">{athlete.name}</h1>
              <p className={cn("text-xs font-medium", getGoalColor(athlete.goalType))}>
                {athlete.goalText || getGoalLabel(athlete.goalType)} · seit {new Date(athlete.joinedAt).getFullYear()}
              </p>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                tab === t
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#141d2e] text-[#8fa3c0] hover:text-[#f0f4ff]"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── ÜBERSICHT ── */}
        {tab === "Übersicht" && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Aktuell" value={athlete.currentWeight} unit="kg" accent />
              <StatCard label="Ziel" value={athlete.targetWeight} unit="kg" />
              <StatCard label="Start" value={athlete.startWeight} unit="kg" />
              <StatCard
                label="Abstand Ziel"
                value={dist > 0 ? `+${dist}` : dist}
                unit="kg"
                color={Math.abs(dist) < 0.5 ? "text-[#10b981]" : "text-[#f0f4ff]"}
              />
              {/* Wochentrend — kg + Prozent */}
              <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] p-4 flex flex-col gap-1 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                <span className="text-xs font-medium text-[#5a7090] uppercase tracking-widest">Wochentrend</span>
                <div className={cn("flex items-baseline gap-1 mt-1 flex-wrap", trendColor)}>
                  <span className="text-xl font-bold leading-none">
                    {getTrendIcon(analysis.trend)} {analysis.changeKg > 0 ? "+" : ""}{analysis.changeKg} kg
                  </span>
                  {trendPercent !== null && (
                    <span className="text-sm font-semibold">
                      ({trendPercent > 0 ? "+" : ""}{trendPercent.toFixed(2)} %)
                    </span>
                  )}
                  {trendPercent === null && (
                    <span className="text-sm text-[#5a7090]">–</span>
                  )}
                </div>
              </div>

              {/* Wochentrendziel — bearbeitbares Prozentziel */}
              <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] p-4 flex flex-col gap-1 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#5a7090] uppercase tracking-widest">Wochentrendziel</span>
                  {!editingTrendTarget ? (
                    <button
                      onClick={() => {
                        setEditTrendTargetInput(athlete.weeklyTrendTargetPercent != null ? String(athlete.weeklyTrendTargetPercent) : "");
                        setEditingTrendTarget(true);
                      }}
                      className="text-[#5a7090] hover:text-[#60a5fa] transition-colors"
                    >
                      <Pencil size={12} />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={saveTrendTarget} className="text-[#10b981] hover:text-[#34d399] transition-colors">
                        <Check size={12} />
                      </button>
                      <button onClick={() => setEditingTrendTarget(false)} className="text-[#5a7090] hover:text-[#f0f4ff] transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
                {!editingTrendTarget ? (
                  <div className="flex items-baseline gap-1 mt-1 text-[#f0f4ff]">
                    <span className="text-2xl font-bold leading-none">
                      {athlete.weeklyTrendTargetPercent != null
                        ? `${athlete.weeklyTrendTargetPercent > 0 ? "+" : ""}${athlete.weeklyTrendTargetPercent.toFixed(2)} %`
                        : "– %"}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 mt-2">
                    <input
                      type="number"
                      step="0.01"
                      value={editTrendTargetInput}
                      onChange={(e) => setEditTrendTargetInput(e.target.value)}
                      placeholder="z. B. -0.5"
                      className="w-full bg-[#0f1624] border border-[#3b82f6]/40 rounded-lg px-2 py-1 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
                      autoFocus
                    />
                    <span className="text-sm text-[#8fa3c0] shrink-0">%</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42]">
              <ProgressBar value={progress} label="Fortschritt zum Ziel" showPercent className="mb-2" />
            </div>

            {/* Goal editor */}
            <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[#5a7090] uppercase tracking-widest">Ziel des Athleten</p>
                {!editingGoal ? (
                  <button
                    onClick={() => setEditingGoal(true)}
                    className="flex items-center gap-1 text-xs text-[#8fa3c0] hover:text-[#60a5fa] transition-colors"
                  >
                    <Pencil size={12} /> Bearbeiten
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={saveGoalEdit}
                      className="flex items-center gap-1 text-xs text-[#10b981] hover:text-[#34d399] transition-colors"
                    >
                      <Check size={12} /> Speichern
                    </button>
                    <button
                      onClick={() => {
                        setEditingGoal(false);
                        setEditGoalType(athlete.goalType);
                        setEditGoalText(athlete.goalText ?? "");
                      }}
                      className="flex items-center gap-1 text-xs text-[#5a7090] hover:text-[#f0f4ff] transition-colors"
                    >
                      <X size={12} /> Abbrechen
                    </button>
                  </div>
                )}
              </div>

              {!editingGoal ? (
                <div className="flex flex-col gap-1">
                  <span className={cn("text-sm font-semibold", getGoalColor(athlete.goalType))}>
                    {getGoalLabel(athlete.goalType)}
                  </span>
                  {athlete.goalText && (
                    <span className="text-sm text-[#8fa3c0]">{athlete.goalText}</span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    {GOAL_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setEditGoalType(o.value)}
                        className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                          editGoalType === o.value
                            ? "bg-[#3b82f6]/10 border-[#3b82f6]/40 text-[#60a5fa]"
                            : "bg-[#0f1624] border-[#1e2d42] text-[#8fa3c0]"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                  <input
                    value={editGoalText}
                    onChange={(e) => setEditGoalText(e.target.value)}
                    placeholder="Individuelles Ziel (optional), z.B. Wettkampf Mai 2026"
                    className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Notes editor */}
            <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#5a7090] uppercase tracking-widest">Notizen</p>
                {!editingGoal && (
                  <button
                    onClick={() => setEditingGoal(true)}
                    className="flex items-center gap-1 text-xs text-[#8fa3c0] hover:text-[#60a5fa] transition-colors"
                  >
                    <Pencil size={12} /> Bearbeiten
                  </button>
                )}
              </div>
              {editingGoal ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#5a7090]">Interne Coach-Notiz</label>
                    <textarea
                      value={editCoachNote}
                      onChange={(e) => setEditCoachNote(e.target.value)}
                      rows={2}
                      className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors resize-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#5a7090]">Sichtbare Notiz für Athleten</label>
                    <textarea
                      value={editVisibleNote}
                      onChange={(e) => setEditVisibleNote(e.target.value)}
                      rows={2}
                      className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors resize-none"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {athlete.coachNote && (
                    <div>
                      <p className="text-xs text-[#5a7090] mb-1">Intern</p>
                      <p className="text-sm text-[#8fa3c0]">{athlete.coachNote}</p>
                    </div>
                  )}
                  {athlete.visibleNote && (
                    <div className="p-3 rounded-xl bg-[#1d4ed8]/10 border border-[#3b82f6]/20">
                      <p className="text-xs text-[#60a5fa] mb-1">Für Athleten sichtbar</p>
                      <p className="text-sm text-[#8fa3c0]">{athlete.visibleNote}</p>
                    </div>
                  )}
                  {!athlete.coachNote && !athlete.visibleNote && (
                    <p className="text-sm text-[#5a7090]">Keine Notizen vorhanden.</p>
                  )}
                </>
              )}
            </div>

            {/* Athlete profile (formerly own tab) */}
            <AthleteProfileEditor athlete={athlete} onSave={saveAthleteProfile} />
          </div>
        )}

        {/* ── CHECK-INS ── */}
        {tab === "Check-ins" && (
          <div className="flex flex-col gap-4">
            {/* Sub-tab bar */}
            <div className="flex gap-1">
              <button
                onClick={() => setCheckInSubTab("daily")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  checkInSubTab === "daily"
                    ? "bg-[#1e2d42] text-[#f0f4ff]"
                    : "text-[#5a7090] hover:text-[#8fa3c0]"
                )}
              >
                Daily Checks
                {athlete.dailyCheckIns.length > 0 && (
                  <span className="ml-1.5 text-[10px] text-[#5a7090]">({athlete.dailyCheckIns.length})</span>
                )}
              </button>
              <button
                onClick={() => setCheckInSubTab("weekly")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  checkInSubTab === "weekly"
                    ? "bg-[#1e2d42] text-[#f0f4ff]"
                    : "text-[#5a7090] hover:text-[#8fa3c0]"
                )}
              >
                Weekly Checks
                {athlete.weeklyCheckIns.length > 0 && (
                  <span className="ml-1.5 text-[10px] text-[#5a7090]">({athlete.weeklyCheckIns.length})</span>
                )}
              </button>
            </div>

            {/* Daily Checks list */}
            {checkInSubTab === "daily" && (
              <div className="flex flex-col gap-3">
                {[...athlete.dailyCheckIns]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((ci) => (
                    <button
                      key={ci.id}
                      onClick={() => setSelectedDailyCI(ci)}
                      className="w-full text-left rounded-2xl bg-[#141d2e] border border-[#1e2d42] p-4 hover:border-[#3b82f6]/30 hover:bg-[#192236] transition-all group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-[#f0f4ff] group-hover:text-white">
                          {new Date(ci.date + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "short" })}
                        </span>
                        <span className="text-base font-bold text-[#3b82f6]">{ci.weight} kg</span>
                      </div>
                      <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[#5a7090]">Energie</span>
                          <span className="text-[#f0f4ff]">{ci.energyLevel}/5</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[#5a7090]">Stress</span>
                          <span className="text-[#f0f4ff]">{ci.stressLevel}/5</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[#5a7090]">Schlaf</span>
                          <span className="text-[#f0f4ff]">{ci.sleepHours}h</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[#5a7090]">Schritte</span>
                          <span className="text-[#f0f4ff]">{ci.steps.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[#5a7090]">Training</span>
                          <span className={ci.training ? "text-[#10b981]" : "text-[#5a7090]"}>
                            {ci.training ? `✓ (${ci.trainingQuality}/5)` : "–"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[#5a7090]">Cardio</span>
                          <span className={ci.cardio ? "text-[#10b981]" : "text-[#5a7090]"}>
                            {ci.cardio ? `✓${ci.cardioDuration ? ` ${ci.cardioDuration} min` : ""}` : "–"}
                          </span>
                        </div>
                        {(() => {
                          const ns = ci.nutritionStatus;
                          const mc = ci.mealCompliance;
                          const isTracker = ns === "calorie_tracker_used" || (!ns && ["full_tracking", "tracked_in_calorie_tracker"].includes(mc));
                          const isPlan    = ns === "meal_plan_followed"   || (!ns && ["full", "fully_followed"].includes(mc));
                          const isNoInfo  = ns === "no_exact_info"        || (!ns && ["not_followed", "minor_deviation", "major_deviation", "off_plan"].includes(mc));
                          const variant: "accent"|"success"|"warning"|"danger" = isTracker ? "accent" : isPlan ? "success" : isNoInfo ? "warning" : "danger";
                          const label = isTracker ? "◎ Tracker" : isPlan ? "✓ Plan" : isNoInfo ? "K.A." : "✗";
                          return (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[#5a7090]">Ernährung</span>
                              <Badge variant={variant}>{label}</Badge>
                            </div>
                          );
                        })()}
                      </div>
                      {ci.note && (
                        <p className="text-xs text-[#8fa3c0] mt-2 italic border-t border-[#1e2d42] pt-2 line-clamp-2">
                          {ci.note}
                        </p>
                      )}
                      {ci.deviationReason && (
                        <p className="text-xs text-[#f59e0b] mt-1">Abweichung: {ci.deviationReason}</p>
                      )}
                      <p className="text-[10px] text-[#3b4d6a] mt-2 text-right">Details ansehen →</p>
                    </button>
                  ))}
                {!athlete.dailyCheckIns.length && (
                  <p className="text-center text-[#5a7090] py-8">Noch keine Daily Check-ins vorhanden.</p>
                )}
              </div>
            )}

            {/* Weekly Checks list */}
            {checkInSubTab === "weekly" && (
              <div className="flex flex-col gap-3">
                {[...athlete.weeklyCheckIns]
                  .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
                  .map((ci) => {
                    const weekStart = new Date(ci.weekStart + "T12:00:00");
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    const fmtShort = (d: Date) =>
                      d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
                    const weekLabel = `${fmtShort(weekStart)} – ${fmtShort(weekEnd)}`;
                    return (
                      <button
                        key={ci.id}
                        onClick={() => setSelectedWeeklyCI(ci)}
                        className="w-full text-left rounded-2xl bg-[#141d2e] border border-[#1e2d42] p-4 hover:border-[#3b82f6]/30 hover:bg-[#192236] transition-all group"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xs text-[#5a7090] mb-0.5">Woche</p>
                            <p className="text-sm font-semibold text-[#f0f4ff] group-hover:text-white">{weekLabel}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-[#5a7090] mb-0.5">Gesamtbewertung</p>
                            <p className="text-base font-bold text-[#3b82f6]">
                              {"★".repeat(ci.overallWeekRating)}{"☆".repeat(5 - ci.overallWeekRating)}
                            </p>
                          </div>
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[#5a7090]">Training</span>
                            <span className="text-[#f0f4ff]">{ci.trainingRating}/5</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[#5a7090]">Ernährung</span>
                            <span className="text-[#f0f4ff]">{ci.nutritionAdherence}/5</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[#5a7090]">Energie Ø</span>
                            <span className="text-[#f0f4ff]">{ci.energyAvg}/5</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[#5a7090]">Stress Ø</span>
                            <span className="text-[#f0f4ff]">{ci.stressAvg}/5</span>
                          </div>
                          {ci.sleepAvg != null && (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[#5a7090]">Schlaf Ø</span>
                              <span className="text-[#f0f4ff]">{ci.sleepAvg}h</span>
                            </div>
                          )}
                          {ci.recoveryRating != null && (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[#5a7090]">Erholung</span>
                              <span className="text-[#f0f4ff]">{ci.recoveryRating}/5</span>
                            </div>
                          )}
                        </div>

                        {/* Free note preview */}
                        {ci.freeNote && (
                          <p className="text-xs text-[#8fa3c0] mt-2 italic border-t border-[#1e2d42] pt-2 line-clamp-2">
                            {ci.freeNote}
                          </p>
                        )}
                        <p className="text-[10px] text-[#3b4d6a] mt-2 text-right">Details ansehen →</p>
                      </button>
                    );
                  })}
                {!athlete.weeklyCheckIns.length && (
                  <p className="text-center text-[#5a7090] py-8">Noch keine Weekly Check-ins vorhanden.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── FORTSCHRITT ── */}
        {tab === "Fortschritt" && (
          <div className="flex flex-col gap-4">
            <ProgressAnalytics checkIns={athlete.dailyCheckIns} />
          </div>
        )}

        {/* ── ERNÄHRUNG ── */}
        {tab === "Ernährung" && (
          <div className="flex flex-col gap-4">
            {(() => {
              const plans = athlete.mealPlans ?? (athlete.mealPlan ? [athlete.mealPlan] : []);
              return (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#f0f4ff]">Ernährungspläne</p>
                    <button
                      onClick={() => setEditingNutrition(!editingNutrition)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                        editingNutrition
                          ? "bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]"
                          : "bg-[#141d2e] border-[#1e2d42] text-[#8fa3c0] hover:border-[#3b82f6]/40 hover:text-[#60a5fa]"
                      )}
                    >
                      {editingNutrition ? <><X size={12} /> Bearbeitung beenden</> : <><Pencil size={12} /> Bearbeiten</>}
                    </button>
                  </div>

                  {editingNutrition ? (
                    <MealPlanEditor
                      plans={plans}
                      athleteId={athlete.id}
                      onSavePlan={saveMealPlan}
                      onDeletePlan={deleteMealPlan}
                    />
                  ) : (
                    <MealPlanView plans={plans} />
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* ── TRAINING ── */}
        {tab === "Training" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#f0f4ff]">
                {athlete.trainingPlan ? athlete.trainingPlan.title : "Trainingsplan"}
              </p>
              <button
                onClick={() => setEditingTraining(!editingTraining)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                  editingTraining
                    ? "bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]"
                    : "bg-[#141d2e] border-[#1e2d42] text-[#8fa3c0] hover:border-[#3b82f6]/40 hover:text-[#60a5fa]"
                )}
              >
                {editingTraining ? <><X size={12} /> Bearbeitung beenden</> : <><Pencil size={12} /> Bearbeiten</>}
              </button>
            </div>

            {editingTraining ? (
              <TrainingEditor
                plan={athlete.trainingPlan}
                athleteId={athlete.id}
                onSave={saveTrainingPlan}
              />
            ) : athlete.trainingPlan ? (
              <>
                {/* General cardio display */}
                {athlete.trainingPlan.generalCardio && (
                  <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42]">
                    <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-2">Cardio-Vorgaben</p>
                    <p className="text-sm text-[#8fa3c0]">{athlete.trainingPlan.generalCardio}</p>
                  </div>
                )}
                <TrainingAccordion plan={athlete.trainingPlan} />
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-[#5a7090] mb-4">Noch kein Trainingsplan zugewiesen.</p>
                <button
                  onClick={() => setEditingTraining(true)}
                  className="px-4 py-2 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#60a5fa] text-sm hover:bg-[#3b82f6]/20 transition-colors"
                >
                  Plan erstellen
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── SUPPLEMENTS ── */}
        {tab === "Supplements" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#f0f4ff]">Supplementplan</p>
              <button
                onClick={() => setEditingSupplements(!editingSupplements)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                  editingSupplements
                    ? "bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]"
                    : "bg-[#141d2e] border-[#1e2d42] text-[#8fa3c0] hover:border-[#3b82f6]/40 hover:text-[#60a5fa]"
                )}
              >
                {editingSupplements ? <><X size={12} /> Bearbeitung beenden</> : <><Pencil size={12} /> Bearbeiten</>}
              </button>
            </div>

            {editingSupplements ? (
              <SupplementEditor
                plan={athlete.supplementPlan}
                athleteId={athlete.id}
                onSave={saveSupplementPlan}
              />
            ) : athlete.supplementPlan ? (
              <SupplementList plan={athlete.supplementPlan} />
            ) : (
              <div className="text-center py-8">
                <p className="text-[#5a7090] mb-4">Noch kein Supplementplan zugewiesen.</p>
                <button
                  onClick={() => setEditingSupplements(true)}
                  className="px-4 py-2 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#60a5fa] text-sm hover:bg-[#3b82f6]/20 transition-colors"
                >
                  Plan erstellen
                </button>
              </div>
            )}
          </div>
        )}


      </div>

      {/* Daily Check detail modal */}
      {selectedDailyCI && (
        <DailyCheckDetailModal ci={selectedDailyCI} athlete={athlete} onClose={() => setSelectedDailyCI(null)} />
      )}

      {/* Weekly Check detail modal */}
      {selectedWeeklyCI && (
        <WeeklyCheckDetailModal ci={selectedWeeklyCI} onClose={() => setSelectedWeeklyCI(null)} />
      )}
    </AppShell>
  );
}
