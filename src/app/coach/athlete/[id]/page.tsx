"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { loadAuth, loadAthletes, updateAthlete, updateAthleteCredentials } from "@/lib/store";
import { showToast } from "@/components/ui/Toast";
import { Athlete, GoalType, MealPlan, TrainingPlan, SupplementPlan } from "@/types";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { MealPlanView } from "@/components/athlete/MealPlanView";
import { TrainingAccordion } from "@/components/athlete/TrainingAccordion";
import { SupplementList } from "@/components/athlete/SupplementList";
import { MealPlanEditor } from "@/components/coach/MealPlanEditor";
import { TrainingEditor } from "@/components/coach/TrainingEditor";
import { SupplementEditor } from "@/components/coach/SupplementEditor";
import { AthleteProfileEditor } from "@/components/coach/AthleteProfileEditor";
import { ProgressAnalytics } from "@/components/coach/ProgressAnalytics";
import { TrainingProgressView } from "@/components/athlete/TrainingProgressView";
import { DailyCheckDetailModal } from "@/components/coach/DailyCheckDetailModal";
import { WeeklyCheckDetailModal } from "@/components/coach/WeeklyCheckDetailModal";
import { Badge } from "@/components/ui/Badge";
import { DailyCheckIn, WeeklyCheckIn } from "@/types";
import {
  analyzeWeek, calculateDistanceToGoal, calculateGoalProgressPercent,
  getGoalLabel, getGoalColor, getTrendIcon, getTrendColor, normalizeNutritionStatus, resolveAthleteWeight,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ArrowLeft, Pencil, Check, X } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { tabContentTransition, listContainer, listItem } from "@/lib/motion";

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

  // Target weight editing
  const [editingTargetWeight, setEditingTargetWeight] = useState(false);
  const [editTargetWeightInput, setEditTargetWeightInput] = useState("");

  // Trend target editing
  const [editingTrendTarget, setEditingTrendTarget] = useState(false);
  const [editTrendTargetInput, setEditTrendTargetInput] = useState("");

  // Plan editing
  const [editingNutrition, setEditingNutrition] = useState(false);
  const [editingTraining, setEditingTraining] = useState(false);
  const [editingSupplements, setEditingSupplements] = useState(false);

  // Credential editing
  const [editingCredentials, setEditingCredentials] = useState(false);
  const [editCredName, setEditCredName] = useState("");
  const [editCredEmail, setEditCredEmail] = useState("");
  const [editCredPin, setEditCredPin] = useState("");
  const [editCredError, setEditCredError] = useState("");

  useEffect(() => {
    const auth = loadAuth();
    if (auth.role !== "coach") { router.replace("/login"); return; }
    loadAthletes().then((athletes) => {
      const found = athletes.find((a) => a.id === id);
      if (!found) { router.replace("/coach/dashboard"); return; }
      setAthlete(found);
      setEditGoalType(found.goalType);
      setEditGoalText(found.goalText ?? "");
      setEditCoachNote(found.coachNote);
      setEditVisibleNote(found.visibleNote);
    });
  }, [router, id]);

  const analysis = useMemo(() => athlete ? analyzeWeek(athlete) : null, [athlete]);
  const dist = useMemo(() => athlete ? calculateDistanceToGoal(athlete.currentWeight, athlete.targetWeight) : 0, [athlete]);
  const progress = useMemo(() => athlete ? calculateGoalProgressPercent(athlete.startWeight, athlete.currentWeight, athlete.targetWeight) : 0, [athlete]);
  const trendColor = useMemo(() => athlete && analysis ? getTrendColor(analysis.trend, athlete.goalType) : "text-[#8fa3c0]", [analysis, athlete]);
  const trendPercent = useMemo(() => {
    if (!analysis || !athlete) return null;
    return analysis.currentWeekAvg > 0 && analysis.previousWeekAvg > 0 && athlete.currentWeight > 0
      ? Math.round((analysis.changeKg / athlete.currentWeight) * 10000) / 100
      : null;
  }, [analysis, athlete]);
  const sortedDailyCheckIns = useMemo(
    () => [...(athlete?.dailyCheckIns ?? [])].sort((a, b) => b.date.localeCompare(a.date)),
    [athlete?.dailyCheckIns]
  );
  const sortedWeeklyCheckIns = useMemo(
    () => [...(athlete?.weeklyCheckIns ?? [])].sort((a, b) => b.weekStart.localeCompare(a.weekStart)),
    [athlete?.weeklyCheckIns]
  );

  if (!athlete) {
    return (
      <AppShell role="coach">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {/* Back + Header skeleton */}
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          </div>
          {/* Tab bar skeleton */}
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-lg" />
            ))}
          </div>
          {/* Stats grid skeleton */}
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </AppShell>
    );
  }


  async function saveGoalEdit() {
    const previous = athlete;
    try {
      const updated = await updateAthlete(athlete!.id, {
        goalType: editGoalType,
        goalText: editGoalText.trim() || undefined,
        coachNote: editCoachNote,
        visibleNote: editVisibleNote,
      });
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      setEditingGoal(false);
      showToast("Ziel gespeichert.", "success");
    } catch {
      setAthlete(previous);
      showToast("Fehler beim Speichern. Bitte erneut versuchen.", "error");
    }
  }

  async function saveTargetWeight() {
    const parsed = parseFloat(editTargetWeightInput);
    if (isNaN(parsed) || parsed <= 0) return;
    const previous = athlete;
    try {
      const updated = await updateAthlete(athlete!.id, { targetWeight: parsed });
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      setEditingTargetWeight(false);
    } catch {
      setAthlete(previous);
      showToast("Fehler beim Speichern. Bitte erneut versuchen.", "error");
    }
  }

  async function saveTrendTarget() {
    const parsed = parseFloat(editTrendTargetInput);
    const previous = athlete;
    try {
      const updated = await updateAthlete(athlete!.id, {
        weeklyTrendTargetPercent: isNaN(parsed) ? undefined : parsed,
      });
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      setEditingTrendTarget(false);
    } catch {
      setAthlete(previous);
      showToast("Fehler beim Speichern. Bitte erneut versuchen.", "error");
    }
  }

  async function saveMealPlan(plan: MealPlan) {
    const previous = athlete;
    try {
      const currentPlans = athlete!.mealPlans ?? [];
      const exists = currentPlans.some(p => p.id === plan.id);
      const newPlans = exists
        ? currentPlans.map(p => p.id === plan.id ? plan : p)
        : [...currentPlans, plan];
      const updated = await updateAthlete(athlete!.id, { mealPlans: newPlans });
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      showToast("Ernährungsplan gespeichert.", "success");
    } catch {
      setAthlete(previous);
      showToast("Fehler beim Speichern. Bitte erneut versuchen.", "error");
    }
  }

  async function deleteMealPlan(planId: string) {
    const previous = athlete;
    const optimisticPlans = (athlete!.mealPlans ?? []).filter(p => p.id !== planId);
    setAthlete((prev) => prev ? { ...prev, mealPlans: optimisticPlans } : prev);
    try {
      const updated = await updateAthlete(athlete!.id, { mealPlans: optimisticPlans });
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
    } catch {
      setAthlete(previous);
      showToast("Fehler beim Löschen. Bitte erneut versuchen.", "error");
    }
  }

  async function saveTrainingPlan(plan: TrainingPlan) {
    const previous = athlete;
    try {
      const updated = await updateAthlete(athlete!.id, { trainingPlan: plan });
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      setEditingTraining(false);
      showToast("Trainingsplan gespeichert.", "success");
    } catch {
      setAthlete(previous);
      showToast("Fehler beim Speichern. Bitte erneut versuchen.", "error");
    }
  }

  async function saveSupplementPlan(plan: SupplementPlan) {
    const previous = athlete;
    try {
      const updated = await updateAthlete(athlete!.id, { supplementPlan: plan });
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      setEditingSupplements(false);
      showToast("Supplement-Plan gespeichert.", "success");
    } catch {
      setAthlete(previous);
      showToast("Fehler beim Speichern. Bitte erneut versuchen.", "error");
    }
  }

  async function saveAthleteProfile(updates: Partial<Athlete>) {
    const previous = athlete;
    try {
      const updated = await updateAthlete(athlete!.id, updates);
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      showToast("Profil gespeichert.", "success");
    } catch {
      setAthlete(previous);
      showToast("Fehler beim Speichern. Bitte erneut versuchen.", "error");
    }
  }

  function handleUpdateTrainingLogs(athletes: Athlete[]) {
    const updated = athletes.find((a) => a.id === athlete!.id);
    if (updated) setAthlete(updated);
  }

  function openCredentialEdit() {
    setEditCredName(athlete!.name);
    setEditCredEmail(athlete!.email ?? "");
    setEditCredPin(athlete!.pin);
    setEditCredError("");
    setEditingCredentials(true);
  }

  async function saveCredentials() {
    setEditCredError("");
    if (!editCredName.trim()) { setEditCredError("Name darf nicht leer sein."); return; }
    if (!editCredPin.trim()) { setEditCredError("PIN darf nicht leer sein."); return; }
    if (editCredEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editCredEmail.trim())) {
      setEditCredError("Ungültiges E-Mail-Format."); return;
    }
    const previous = athlete;
    try {
      const updated = await updateAthleteCredentials(athlete!.id, {
        name: editCredName,
        email: editCredEmail || undefined,
        pin: editCredPin,
      });
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      setEditingCredentials(false);
      showToast("Anmeldedaten aktualisiert.", "success");
    } catch {
      setAthlete(previous);
      showToast("Fehler beim Speichern.", "error");
    }
  }

  return (
    <AppShell role="coach">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        {/* Back + Header */}
        <div className="flex items-center gap-3">
          <Tooltip label="Zurück">
            <button onClick={() => router.back()} aria-label="Zurück" className="p-2 rounded-xl hover:bg-[#141d2e] transition-colors">
              <ArrowLeft size={18} className="text-[#8fa3c0]" />
            </button>
          </Tooltip>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1d4ed8]/20 flex items-center justify-center text-sm font-bold text-[#60a5fa] overflow-hidden">
              {athlete.profileImage ? (
                <img src={athlete.profileImage.url} alt={athlete.name} className="w-full h-full object-cover" />
              ) : (
                athlete.avatarInitials
              )}
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

        <AnimatePresence mode="wait" initial={false}>

        {/* ── ÜBERSICHT ── */}
        {tab === "Übersicht" && (
          <motion.div key="Übersicht" variants={tabContentTransition} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Aktuell" value={athlete.currentWeight} unit="kg" accent />

              {/* Zielgewicht – inline editierbar */}
              <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] p-4 flex flex-col gap-1 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#5a7090] uppercase tracking-widest">Ziel</span>
                  {!editingTargetWeight ? (
                    <Tooltip label="Zielgewicht bearbeiten">
                      <button
                        onClick={() => { setEditTargetWeightInput(String(athlete.targetWeight)); setEditingTargetWeight(true); }}
                        aria-label="Zielgewicht bearbeiten"
                        className="text-[#5a7090] hover:text-[#60a5fa] transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                    </Tooltip>
                  ) : (
                    <div className="flex gap-2">
                      <Tooltip label="Speichern">
                        <button onClick={saveTargetWeight} aria-label="Speichern" className="text-[#10b981] hover:text-[#34d399] transition-colors"><Check size={12} /></button>
                      </Tooltip>
                      <Tooltip label="Abbrechen">
                        <button onClick={() => setEditingTargetWeight(false)} aria-label="Abbrechen" className="text-[#5a7090] hover:text-[#f0f4ff] transition-colors"><X size={12} /></button>
                      </Tooltip>
                    </div>
                  )}
                </div>
                {!editingTargetWeight ? (
                  <div className="flex items-baseline gap-1 mt-1 text-[#f0f4ff]">
                    <span className="text-2xl font-bold leading-none">{athlete.targetWeight}</span>
                    <span className="text-sm font-semibold text-[#8fa3c0]">kg</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 mt-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={editTargetWeightInput}
                      onChange={(e) => setEditTargetWeightInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveTargetWeight(); if (e.key === "Escape") setEditingTargetWeight(false); }}
                      placeholder="z. B. 80.0"
                      className="w-full bg-[#0f1624] border border-[#3b82f6]/40 rounded-lg px-2 py-1 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
                      autoFocus
                    />
                    <span className="text-sm text-[#8fa3c0] shrink-0">kg</span>
                  </div>
                )}
              </div>
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
                    {getTrendIcon(analysis!.trend)} {analysis!.changeKg > 0 ? "+" : ""}{analysis!.changeKg} kg
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
                    <Tooltip label="Wochentrendziel bearbeiten">
                      <button
                        onClick={() => {
                          setEditTrendTargetInput(athlete.weeklyTrendTargetPercent != null ? String(athlete.weeklyTrendTargetPercent) : "");
                          setEditingTrendTarget(true);
                        }}
                        aria-label="Wochentrendziel bearbeiten"
                        className="text-[#5a7090] hover:text-[#60a5fa] transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                    </Tooltip>
                  ) : (
                    <div className="flex gap-2">
                      <Tooltip label="Speichern">
                        <button onClick={saveTrendTarget} aria-label="Speichern" className="text-[#10b981] hover:text-[#34d399] transition-colors">
                          <Check size={12} />
                        </button>
                      </Tooltip>
                      <Tooltip label="Abbrechen">
                        <button onClick={() => setEditingTrendTarget(false)} aria-label="Abbrechen" className="text-[#5a7090] hover:text-[#f0f4ff] transition-colors">
                          <X size={12} />
                        </button>
                      </Tooltip>
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

            {/* Anmeldedaten */}
            <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#5a7090] uppercase tracking-widest">Anmeldedaten</p>
                {!editingCredentials ? (
                  <button
                    onClick={openCredentialEdit}
                    className="flex items-center gap-1 text-xs text-[#8fa3c0] hover:text-[#60a5fa] transition-colors"
                  >
                    <Pencil size={12} /> Bearbeiten
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={saveCredentials}
                      className="flex items-center gap-1 text-xs text-[#10b981] hover:text-[#34d399] transition-colors"
                    >
                      <Check size={12} /> Speichern
                    </button>
                    <button
                      onClick={() => { setEditingCredentials(false); setEditCredError(""); }}
                      className="flex items-center gap-1 text-xs text-[#5a7090] hover:text-[#f0f4ff] transition-colors"
                    >
                      <X size={12} /> Abbrechen
                    </button>
                  </div>
                )}
              </div>

              {!editingCredentials ? (
                <div className="grid grid-cols-1 gap-0 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-[#1e2d42]">
                    <span className="text-[#5a7090]">Name</span>
                    <span className="text-[#f0f4ff] font-medium">{athlete.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#1e2d42]">
                    <span className="text-[#5a7090]">E-Mail</span>
                    <span className="text-[#f0f4ff] font-mono text-xs">{athlete.email || "–"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[#5a7090]">PIN</span>
                    <span className="text-[#f0f4ff] font-mono tracking-widest">{athlete.pin}</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#5a7090]">Name *</label>
                    <input
                      value={editCredName}
                      onChange={(e) => setEditCredName(e.target.value)}
                      placeholder="Vollständiger Name"
                      className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#5a7090]">E-Mail</label>
                    <input
                      type="email"
                      value={editCredEmail}
                      onChange={(e) => setEditCredEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#5a7090]">PIN *</label>
                    <input
                      value={editCredPin}
                      onChange={(e) => setEditCredPin(e.target.value)}
                      placeholder="PIN"
                      className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm font-mono focus:outline-none focus:border-[#3b82f6] transition-colors"
                    />
                  </div>
                  {editCredError && (
                    <p className="text-xs text-[#ef4444]">{editCredError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Rechtliches */}
            {athlete.legalConsent ? (
              <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-3">
                <p className="text-xs text-[#5a7090] uppercase tracking-widest">Rechtliches &amp; Zustimmung</p>
                {[
                  {
                    label: "Datenschutzerklärung",
                    value: athlete.legalConsent.privacyAccepted
                      ? `Akzeptiert am ${new Date(athlete.legalConsent.privacyAcceptedAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
                      : "Nicht akzeptiert",
                  },
                  {
                    label: "Coaching-Vertrag",
                    value: athlete.legalConsent.contractAccepted
                      ? `Akzeptiert am ${new Date(athlete.legalConsent.contractAcceptedAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
                      : "Nicht akzeptiert",
                  },
                  { label: "Vertragsversion", value: athlete.legalConsent.legalVersion },
                  ...(athlete.legalConsent.signedName ? [{ label: "Bestätigungsname", value: athlete.legalConsent.signedName }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-start gap-3 py-2 border-b border-[#1e2d42]/60 last:border-0">
                    <span className="text-xs text-[#5a7090] shrink-0">{label}</span>
                    <span className="text-xs text-[#f0f4ff] text-right">{value}</span>
                  </div>
                ))}
                {athlete.legalConsent.signatureDataUrl && (
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="text-xs text-[#5a7090]">Digitale Unterschrift</span>
                    <div className="rounded-xl border border-[#2e4060] bg-[#0a0f1a] overflow-hidden p-2">
                      <img src={athlete.legalConsent.signatureDataUrl} alt="Unterschrift" className="max-h-[80px] w-auto" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42]">
                <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-2">Rechtliches &amp; Zustimmung</p>
                <p className="text-sm text-[#5a7090]">Keine Zustimmungsdaten vorhanden.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── CHECK-INS ── */}
        {tab === "Check-ins" && (
          <motion.div key="Check-ins" variants={tabContentTransition} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-4">
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
              <motion.div className="flex flex-col gap-3" variants={listContainer} initial="hidden" animate="visible">
                {sortedDailyCheckIns.map((ci) => (
                    <motion.button
                      variants={listItem}
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
                          const ns = normalizeNutritionStatus(ci);
                          const variant: "accent"|"success"|"warning" =
                            ns === "calorie_tracker_used" ? "accent"
                            : ns === "meal_plan_followed" ? "success"
                            : "warning";
                          const label =
                            ns === "calorie_tracker_used" ? "◎ Tracker"
                            : ns === "meal_plan_followed" ? "✓ Plan"
                            : "K.A.";
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
                    </motion.button>
                  ))}
                {!athlete.dailyCheckIns.length && (
                  <p className="text-center text-[#5a7090] py-8">Noch keine Daily Check-ins vorhanden.</p>
                )}
              </motion.div>
            )}

            {/* Weekly Checks list */}
            {checkInSubTab === "weekly" && (
              <motion.div className="flex flex-col gap-3" variants={listContainer} initial="hidden" animate="visible">
                {sortedWeeklyCheckIns.map((ci) => {
                    const weekStart = new Date(ci.weekStart + "T12:00:00");
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    const fmtShort = (d: Date) =>
                      d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
                    const weekLabel = `${fmtShort(weekStart)} – ${fmtShort(weekEnd)}`;
                    return (
                      <motion.button
                        variants={listItem}
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
                      </motion.button>
                    );
                  })}
                {!athlete.weeklyCheckIns.length && (
                  <p className="text-center text-[#5a7090] py-8">Noch keine Weekly Check-ins vorhanden.</p>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── FORTSCHRITT ── */}
        {tab === "Fortschritt" && (
          <motion.div key="Fortschritt" variants={tabContentTransition} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-4">
            <ProgressAnalytics checkIns={athlete.dailyCheckIns} />

            {/* Trainingsfortschritt */}
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-[#f0f4ff]">Trainingsfortschritt</p>
              <TrainingProgressView
                athlete={athlete}
                onUpdate={handleUpdateTrainingLogs}
                mode="coach"
              />
            </div>
          </motion.div>
        )}

        {/* ── ERNÄHRUNG ── */}
        {tab === "Ernährung" && (
          <motion.div key="Ernährung" variants={tabContentTransition} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-4">
            {(() => {
              const plans = athlete.mealPlans ?? [];
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
                      athleteWeight={resolveAthleteWeight(athlete)}
                    />
                  ) : (
                    <MealPlanView plans={plans} athleteWeight={resolveAthleteWeight(athlete)} />
                  )}
                </>
              );
            })()}
          </motion.div>
        )}

        {/* ── TRAINING ── */}
        {tab === "Training" && (
          <motion.div key="Training" variants={tabContentTransition} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-4">
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
          </motion.div>
        )}

        {/* ── SUPPLEMENTS ── */}
        {tab === "Supplements" && (
          <motion.div key="Supplements" variants={tabContentTransition} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-4">
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
          </motion.div>
        )}

        </AnimatePresence>

      </div>

      {/* Daily Check detail modal */}
      <AnimatePresence>
        {selectedDailyCI && (
          <DailyCheckDetailModal ci={selectedDailyCI} athlete={athlete} onClose={() => setSelectedDailyCI(null)} />
        )}
      </AnimatePresence>

      {/* Weekly Check detail modal */}
      <AnimatePresence>
        {selectedWeeklyCI && (
          <WeeklyCheckDetailModal ci={selectedWeeklyCI} onClose={() => setSelectedWeeklyCI(null)} />
        )}
      </AnimatePresence>
    </AppShell>
  );
}
