"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { loadAuth, loadAthletes, updateAthlete, updateAthleteCredentials, deleteAthlete, updateDailyCheckIn, updateWeeklyCheckIn, deleteDailyCheckIn, deleteWeeklyCheckIn, updateAthleteProfile, approvePlanChangeRequest, rejectPlanChangeRequest } from "@/lib/store";
import { showToast } from "@/components/ui/Toast";
import { Athlete, AthleteProfile, GoalType, MealPlan, TrainingPlan, SupplementPlan, PlanChangeRequest } from "@/types";
import {
  copyMealPlan, copyTrainingPlan, copySupplementPlan,
  getMealPlanClipboard, getTrainingPlanClipboard, getSupplementPlanClipboard,
} from "@/lib/planClipboard";
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
import { CheckInConfigEditor } from "@/components/coach/CheckInConfigEditor";
import { ProgressAnalytics } from "@/components/coach/ProgressAnalytics";
import { TrainingProgressView } from "@/components/athlete/TrainingProgressView";
import { DailyCheckDetailModal } from "@/components/coach/DailyCheckDetailModal";
import { WeeklyCheckDetailModal } from "@/components/coach/WeeklyCheckDetailModal";
import { DailyCheckInForm } from "@/components/athlete/DailyCheckInForm";
import { WeeklyCheckInForm } from "@/components/athlete/WeeklyCheckInForm";
import { Badge } from "@/components/ui/Badge";
import { DailyCheckIn, WeeklyCheckIn } from "@/types";
import {
  analyzeWeek, calculateDistanceToGoal, calculateGoalProgressPercent,
  getGoalLabel, getGoalColor, getTrendIcon, getTrendColor, normalizeNutritionStatus, resolveAthleteWeight,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ArrowLeft, Pencil, Check, X, Copy, ClipboardPaste, Trash2, ChevronDown } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { tabContentTransition, listContainer, listItem } from "@/lib/motion";


const TABS = ["Übersicht", "Check-ins", "Fortschritt", "Ernährung", "Training", "Supplements"] as const;
type Tab = (typeof TABS)[number];
type CheckInSubTab = "daily" | "weekly";

const GOAL_OPTIONS: { value: GoalType; label: string }[] = [
  { value: "cut", label: "Diät / Abnehmen" },
  { value: "bulk", label: "Muskelaufbau" },
  { value: "maintenance", label: "Erhaltung" },
  { value: "custom", label: "Individuell" },
];

export default function CoachAthletePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [tab, setTab] = useState<Tab>("Übersicht");
  const [checkInSubTab, setCheckInSubTab] = useState<CheckInSubTab>("daily");
  const [selectedDailyCI, setSelectedDailyCI] = useState<DailyCheckIn | null>(null);
  const [selectedWeeklyCI, setSelectedWeeklyCI] = useState<WeeklyCheckIn | null>(null);
  const [editingCheckIns, setEditingCheckIns] = useState(false);
  const [editDailyCI, setEditDailyCI] = useState<DailyCheckIn | null>(null);
  const [editWeeklyCI, setEditWeeklyCI] = useState<WeeklyCheckIn | null>(null);
  const [deleteConfirmCI, setDeleteConfirmCI] = useState<{ type: "daily" | "weekly"; id: string } | null>(null);

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

  // Plan clipboard
  const [clipboardMeal, setClipboardMeal] = useState<MealPlan | null>(null);
  const [clipboardTraining, setClipboardTraining] = useState<TrainingPlan | null>(null);
  const [clipboardSupplement, setClipboardSupplement] = useState<SupplementPlan | null>(null);

  // Delete athlete
  const [showDeleteZone, setShowDeleteZone] = useState(false);
  const [deleteNameInput, setDeleteNameInput] = useState("");
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleteStep, setDeleteStep] = useState<1 | 2 | 3>(1);

  // Plan change requests
  const [reviewingRequest, setReviewingRequest] = useState<PlanChangeRequest | null>(null);

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
    setClipboardMeal(getMealPlanClipboard());
    setClipboardTraining(getTrainingPlanClipboard());
    setClipboardSupplement(getSupplementPlanClipboard());
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


  async function handleUpdateDailyCheckIn(data: Omit<DailyCheckIn, "id" | "athleteId">) {
    if (!editDailyCI) return;
    try {
      const updated = await updateDailyCheckIn(athlete!.id, editDailyCI.id, data);
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      setEditDailyCI(null);
      showToast("Daily Check-in gespeichert.", "success");
    } catch {
      showToast("Fehler beim Speichern. Bitte erneut versuchen.", "error");
    }
  }

  async function handleUpdateWeeklyCheckIn(data: Omit<WeeklyCheckIn, "id" | "athleteId">) {
    if (!editWeeklyCI) return;
    try {
      const updated = await updateWeeklyCheckIn(athlete!.id, editWeeklyCI.id, data);
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      setEditWeeklyCI(null);
      showToast("Weekly Check-in gespeichert.", "success");
    } catch {
      showToast("Fehler beim Speichern. Bitte erneut versuchen.", "error");
    }
  }

  async function handleDeleteCheckIn() {
    if (!deleteConfirmCI) return;
    try {
      let updated: Athlete[];
      if (deleteConfirmCI.type === "daily") {
        updated = await deleteDailyCheckIn(athlete!.id, deleteConfirmCI.id);
      } else {
        updated = await deleteWeeklyCheckIn(athlete!.id, deleteConfirmCI.id);
      }
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      setDeleteConfirmCI(null);
      showToast("Check-in gelöscht.", "success");
    } catch {
      showToast("Fehler beim Löschen. Bitte erneut versuchen.", "error");
    }
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

  async function handleApprovePlanChangeRequest(requestId: string) {
    try {
      const updated = await approvePlanChangeRequest(athlete!.id, requestId);
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      setReviewingRequest(null);
      showToast("Planänderung übernommen.", "success");
    } catch {
      showToast("Fehler beim Bestätigen. Bitte erneut versuchen.", "error");
    }
  }

  async function handleRejectPlanChangeRequest(requestId: string) {
    try {
      const updated = await rejectPlanChangeRequest(athlete!.id, requestId);
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      setReviewingRequest(null);
      showToast("Planänderung abgelehnt.", "success");
    } catch {
      showToast("Fehler beim Ablehnen. Bitte erneut versuchen.", "error");
    }
  }

  async function handleSaveQuestionnaire(profile: AthleteProfile) {
    const previous = athlete;
    try {
      const updated = await updateAthleteProfile(athlete!.id, profile);
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      showToast("Fragebogen gespeichert.", "success");
    } catch {
      setAthlete(previous);
      showToast("Fehler beim Speichern. Bitte erneut versuchen.", "error");
    }
  }

  function handleUpdateTrainingLogs(athletes: Athlete[]) {
    const updated = athletes.find((a) => a.id === athlete!.id);
    if (updated) setAthlete(updated);
  }

  function handleCopyMealPlan(plan: MealPlan) {
    copyMealPlan(plan);
    setClipboardMeal(plan);
    showToast(`"${plan.title}" kopiert.`, "success");
  }

  function handleCopyTrainingPlan() {
    if (!athlete?.trainingPlan) return;
    copyTrainingPlan(athlete.trainingPlan);
    setClipboardTraining(athlete.trainingPlan);
    showToast("Trainingsplan kopiert.", "success");
  }

  function handleCopySupplementPlan() {
    if (!athlete?.supplementPlan) return;
    copySupplementPlan(athlete.supplementPlan);
    setClipboardSupplement(athlete.supplementPlan);
    showToast("Supplementplan kopiert.", "success");
  }

  async function handlePasteMealPlan() {
    if (!clipboardMeal) return;
    const newPlan: MealPlan = {
      ...clipboardMeal,
      id: crypto.randomUUID(),
      athleteId: athlete!.id,
    };
    await saveMealPlan(newPlan);
  }

  async function handlePasteTrainingPlan() {
    if (!clipboardTraining) return;
    const newPlan: TrainingPlan = {
      ...clipboardTraining,
      id: crypto.randomUUID(),
      athleteId: athlete!.id,
    };
    await saveTrainingPlan(newPlan);
  }

  async function handlePasteSupplementPlan() {
    if (!clipboardSupplement) return;
    const newPlan: SupplementPlan = {
      ...clipboardSupplement,
      id: crypto.randomUUID(),
      athleteId: athlete!.id,
    };
    await saveSupplementPlan(newPlan);
  }

  async function handleDeleteAthlete() {
    try {
      await deleteAthlete(athlete!.id);
      showToast("Athletenprofil gelöscht.", "success");
      router.replace("/coach/dashboard");
    } catch {
      showToast("Fehler beim Löschen. Bitte erneut versuchen.", "error");
    }
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
                    {getGoalLabel(athlete.goalType, athlete.goalText)}
                  </span>
                  {athlete.goalText && athlete.goalType !== "custom" && (
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
                  {editGoalType === "custom" && (
                    <input
                      value={editGoalText}
                      onChange={(e) => setEditGoalText(e.target.value)}
                      placeholder="Ziel beschreiben, z.B. Wettkampfvorbereitung Mai 2026"
                      className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
                    />
                  )}
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

            {/* Check-in field configuration */}
            <CheckInConfigEditor athlete={athlete} onSave={saveAthleteProfile} />

            {/* Ausstehende Planänderungen */}
            {(() => {
              const pending = (athlete.planChangeRequests ?? []).filter((r) => r.status === "pending");
              if (!pending.length) return null;
              return (
                <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#f59e0b]/30">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-[#f59e0b] uppercase tracking-widest">Ausstehende Planänderungen</p>
                      <p className="text-sm font-semibold text-[#f0f4ff] mt-0.5">
                        {pending.length} offene Anfrage{pending.length > 1 ? "n" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {pending.map((req) => (
                      <button
                        key={req.id}
                        type="button"
                        onClick={() => setReviewingRequest(req)}
                        className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#0f1624] border border-[#f59e0b]/20 hover:border-[#f59e0b]/50 transition-colors"
                      >
                        <div>
                          <span className={cn(
                            "inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mr-2",
                            req.planType === "training"
                              ? "bg-[#a78bfa]/10 text-[#a78bfa]"
                              : "bg-[#60a5fa]/10 text-[#60a5fa]"
                          )}>
                            {req.planType === "training" ? "Training" : "Ernährung"}
                          </span>
                          <span className="text-xs text-[#5a7090]">
                            {new Date(req.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <ChevronDown size={13} className="text-[#5a7090] shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Athlete profile (formerly own tab) */}
            <AthleteProfileEditor athlete={athlete} onSave={saveAthleteProfile} onSaveProfile={handleSaveQuestionnaire} />

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

            {/* ── GEFAHRENZONE: ATHLET LÖSCHEN ── */}
            <div className="mt-4">
              {!showDeleteZone ? (
                <button
                  onClick={() => { setShowDeleteZone(true); setDeleteStep(1); setDeleteNameInput(""); setDeleteConfirmInput(""); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-[#ef4444]/20 bg-[#ef4444]/5 text-[#ef4444] text-sm font-medium hover:bg-[#ef4444]/10 hover:border-[#ef4444]/40 transition-all"
                >
                  <Trash2 size={15} />
                  Athletenprofil löschen
                </button>
              ) : (
                <div className="rounded-2xl border border-[#ef4444]/30 bg-[#ef4444]/5 p-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#ef4444]">Athletenprofil unwiderruflich löschen</p>
                    <button
                      onClick={() => { setShowDeleteZone(false); setDeleteStep(1); setDeleteNameInput(""); setDeleteConfirmInput(""); }}
                      className="text-[#5a7090] hover:text-[#f0f4ff] transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-[#8fa3c0]">
                    Alle Daten dieses Athleten werden dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
                  </p>

                  {/* Schritt 1: Name eingeben */}
                  {deleteStep >= 1 && (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#5a7090]">
                        Schritt 1 — Vollständigen Namen eingeben: <span className="text-[#f0f4ff] font-medium">{athlete.name}</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={deleteNameInput}
                          onChange={(e) => setDeleteNameInput(e.target.value)}
                          placeholder={athlete.name}
                          disabled={deleteStep > 1}
                          className="flex-1 bg-[#0f1624] border border-[#ef4444]/30 rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#ef4444] transition-colors disabled:opacity-40"
                        />
                        {deleteStep === 1 && (
                          <button
                            onClick={() => { if (deleteNameInput.trim() === athlete.name) setDeleteStep(2); }}
                            disabled={deleteNameInput.trim() !== athlete.name}
                            className="px-4 py-2 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-sm font-medium disabled:opacity-30 hover:bg-[#ef4444]/20 transition-all"
                          >
                            Akzeptieren
                          </button>
                        )}
                        {deleteStep > 1 && (
                          <span className="flex items-center text-[#10b981] text-sm px-2">✓</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Schritt 2: "akzeptieren" eintippen */}
                  {deleteStep >= 2 && (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#5a7090]">
                        Schritt 2 — Tippe <span className="text-[#f0f4ff] font-mono">akzeptieren</span> ein:
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={deleteConfirmInput}
                          onChange={(e) => setDeleteConfirmInput(e.target.value)}
                          placeholder="akzeptieren"
                          disabled={deleteStep > 2}
                          className="flex-1 bg-[#0f1624] border border-[#ef4444]/30 rounded-xl px-3 py-2 text-[#f0f4ff] text-sm font-mono focus:outline-none focus:border-[#ef4444] transition-colors disabled:opacity-40"
                          autoFocus={deleteStep === 2}
                        />
                        {deleteStep === 2 && (
                          <button
                            onClick={() => { if (deleteConfirmInput === "akzeptieren") setDeleteStep(3); }}
                            disabled={deleteConfirmInput !== "akzeptieren"}
                            className="px-4 py-2 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-sm font-medium disabled:opacity-30 hover:bg-[#ef4444]/20 transition-all"
                          >
                            Akzeptieren
                          </button>
                        )}
                        {deleteStep > 2 && (
                          <span className="flex items-center text-[#10b981] text-sm px-2">✓</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Schritt 3: Finaler Lösch-Button */}
                  {deleteStep === 3 && (
                    <button
                      onClick={handleDeleteAthlete}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#ef4444] text-white text-sm font-semibold hover:bg-[#dc2626] transition-colors"
                    >
                      <Trash2 size={15} />
                      Akzeptieren – Profil unwiderruflich löschen
                    </button>
                  )}
                </div>
              )}
            </div>

          </motion.div>
        )}

        {/* ── CHECK-INS ── */}
        {tab === "Check-ins" && (
          <motion.div key="Check-ins" variants={tabContentTransition} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-4">
            {/* Sub-tab bar + edit toggle */}
            <div className="flex items-center justify-between gap-2">
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
              <button
                onClick={() => setEditingCheckIns((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shrink-0",
                  editingCheckIns
                    ? "bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]"
                    : "bg-[#141d2e] border-[#1e2d42] text-[#8fa3c0] hover:border-[#3b82f6]/40 hover:text-[#60a5fa]"
                )}
              >
                {editingCheckIns ? <><X size={12} /> Bearbeitung beenden</> : <><Pencil size={12} /> Check-Ins bearbeiten</>}
              </button>
            </div>

            {/* Daily Checks list */}
            {checkInSubTab === "daily" && (
              <motion.div className="flex flex-col gap-3" variants={listContainer} initial="hidden" animate="visible">
                {sortedDailyCheckIns.map((ci) => (
                    <motion.div
                      variants={listItem}
                      key={ci.id}
                      onClick={() => editingCheckIns ? setEditDailyCI(ci) : setSelectedDailyCI(ci)}
                      className={cn(
                        "w-full text-left rounded-2xl bg-[#141d2e] border p-4 transition-all group cursor-pointer",
                        editingCheckIns
                          ? "border-[#3b82f6]/30 hover:border-[#3b82f6]/60 hover:bg-[#192236]"
                          : "border-[#1e2d42] hover:border-[#3b82f6]/30 hover:bg-[#192236]"
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-[#f0f4ff] group-hover:text-white">
                          {new Date(ci.date + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "short" })}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-[#3b82f6]">{ci.weight} kg</span>
                          {editingCheckIns && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmCI({ type: "daily", id: ci.id }); }}
                              aria-label="Check-in löschen"
                              className="p-1.5 rounded-lg hover:bg-[#ef4444]/10 transition-colors"
                            >
                              <Trash2 size={13} className="text-[#ef4444]/60 hover:text-[#ef4444]" />
                            </button>
                          )}
                        </div>
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
                      <p className="text-[10px] mt-2 text-right" style={{ color: editingCheckIns ? "#60a5fa" : "#3b4d6a" }}>
                        {editingCheckIns ? "Bearbeiten →" : "Details ansehen →"}
                      </p>
                    </motion.div>
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
                      <motion.div
                        variants={listItem}
                        key={ci.id}
                        onClick={() => editingCheckIns ? setEditWeeklyCI(ci) : setSelectedWeeklyCI(ci)}
                        className={cn(
                          "w-full text-left rounded-2xl bg-[#141d2e] border p-4 transition-all group cursor-pointer",
                          editingCheckIns
                            ? "border-[#3b82f6]/30 hover:border-[#3b82f6]/60 hover:bg-[#192236]"
                            : "border-[#1e2d42] hover:border-[#3b82f6]/30 hover:bg-[#192236]"
                        )}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xs text-[#5a7090] mb-0.5">Woche</p>
                            <p className="text-sm font-semibold text-[#f0f4ff] group-hover:text-white">{weekLabel}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-xs text-[#5a7090] mb-0.5">Gesamtbewertung</p>
                              <p className="text-base font-bold text-[#3b82f6]">
                                {"★".repeat(ci.overallWeekRating)}{"☆".repeat(5 - ci.overallWeekRating)}
                              </p>
                            </div>
                            {editingCheckIns && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirmCI({ type: "weekly", id: ci.id }); }}
                                aria-label="Check-in löschen"
                                className="p-1.5 rounded-lg hover:bg-[#ef4444]/10 transition-colors"
                              >
                                <Trash2 size={13} className="text-[#ef4444]/60 hover:text-[#ef4444]" />
                              </button>
                            )}
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
                        <p className="text-[10px] mt-2 text-right" style={{ color: editingCheckIns ? "#60a5fa" : "#3b4d6a" }}>
                          {editingCheckIns ? "Bearbeiten →" : "Details ansehen →"}
                        </p>
                      </motion.div>
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
                    <div className="flex items-center gap-1.5">
                      {clipboardMeal && !editingNutrition && (
                        <button
                          onClick={handlePasteMealPlan}
                          title={`"${clipboardMeal.title}" einfügen`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all bg-[#141d2e] border-[#22c55e]/30 text-[#4ade80] hover:bg-[#22c55e]/10"
                        >
                          <ClipboardPaste size={12} /> Einfügen
                        </button>
                      )}
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
                  </div>

                  {!editingNutrition && plans.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {plans.map((plan) => (
                        <button
                          key={plan.id}
                          onClick={() => handleCopyMealPlan(plan)}
                          title={`"${plan.title}" kopieren`}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs text-[#8fa3c0] bg-[#141d2e] border-[#1e2d42] hover:border-[#3b82f6]/40 hover:text-[#60a5fa] transition-all"
                        >
                          <Copy size={11} />
                          {plan.title}
                        </button>
                      ))}
                    </div>
                  )}

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
              <div className="flex items-center gap-1.5">
                {athlete.trainingPlan && !editingTraining && (
                  <button
                    onClick={handleCopyTrainingPlan}
                    title="Trainingsplan kopieren"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all bg-[#141d2e] border-[#1e2d42] text-[#8fa3c0] hover:border-[#3b82f6]/40 hover:text-[#60a5fa]"
                  >
                    <Copy size={12} />
                  </button>
                )}
                {clipboardTraining && !editingTraining && (
                  <button
                    onClick={handlePasteTrainingPlan}
                    title={`"${clipboardTraining.title}" einfügen`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all bg-[#141d2e] border-[#22c55e]/30 text-[#4ade80] hover:bg-[#22c55e]/10"
                  >
                    <ClipboardPaste size={12} /> Einfügen
                  </button>
                )}
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
                {(athlete.trainingPlan.schritteProTag || athlete.trainingPlan.cardioMinuten) ? (
                  <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42]">
                    <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-2">Cardio-Vorgaben</p>
                    <p className="text-sm text-[#8fa3c0]">
                      {[
                        athlete.trainingPlan.schritteProTag
                          ? `${athlete.trainingPlan.schritteProTag.toLocaleString("de-DE")} Schritte/Tag`
                          : null,
                        athlete.trainingPlan.cardioMinuten
                          ? `${athlete.trainingPlan.cardioMinuten} Min Cardio ${athlete.trainingPlan.cardioFrequenz === "taeglich" ? "täglich" : "pro Woche"}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                ) : null}
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
              <div className="flex items-center gap-1.5">
                {athlete.supplementPlan && !editingSupplements && (
                  <button
                    onClick={handleCopySupplementPlan}
                    title="Supplementplan kopieren"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all bg-[#141d2e] border-[#1e2d42] text-[#8fa3c0] hover:border-[#3b82f6]/40 hover:text-[#60a5fa]"
                  >
                    <Copy size={12} />
                  </button>
                )}
                {clipboardSupplement && !editingSupplements && (
                  <button
                    onClick={handlePasteSupplementPlan}
                    title="Supplementplan einfügen"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all bg-[#141d2e] border-[#22c55e]/30 text-[#4ade80] hover:bg-[#22c55e]/10"
                  >
                    <ClipboardPaste size={12} /> Einfügen
                  </button>
                )}
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

      {/* Daily Check-in edit modal */}
      <AnimatePresence>
        {editDailyCI && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setEditDailyCI(null); }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl bg-[#0d1526] border-t border-[#1e2d42] pb-8"
            >
              <div className="sticky top-0 z-10 bg-[#0d1526] flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#1e2d42]">
                <div>
                  <p className="text-[10px] text-[#5a7090] uppercase tracking-wider mb-0.5">Daily Check-in bearbeiten</p>
                  <p className="text-sm font-semibold text-[#f0f4ff]">
                    {new Date(editDailyCI.date + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                </div>
                <button onClick={() => setEditDailyCI(null)} className="p-2 rounded-xl text-[#5a7090] hover:text-[#f0f4ff] hover:bg-[#1e2d42] transition-all">
                  <X size={18} />
                </button>
              </div>
              <div className="px-4 pt-4">
                <DailyCheckInForm
                  athleteId={athlete.id}
                  existingToday={editDailyCI}
                  checkConfig={athlete.dailyCheckConfig}
                  date={editDailyCI.date}
                  mealPlans={athlete.mealPlans}
                  onSubmit={handleUpdateDailyCheckIn}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weekly Check-in edit modal */}
      <AnimatePresence>
        {editWeeklyCI && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setEditWeeklyCI(null); }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl bg-[#0d1526] border-t border-[#1e2d42] pb-8"
            >
              <div className="sticky top-0 z-10 bg-[#0d1526] flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#1e2d42]">
                <div>
                  <p className="text-[10px] text-[#5a7090] uppercase tracking-wider mb-0.5">Weekly Check-in bearbeiten</p>
                  <p className="text-sm font-semibold text-[#f0f4ff]">
                    {(() => {
                      const ws = new Date(editWeeklyCI.weekStart + "T12:00:00");
                      const we = new Date(ws);
                      we.setDate(ws.getDate() + 6);
                      const fmt = (d: Date) => d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
                      return `${fmt(ws)} – ${fmt(we)}`;
                    })()}
                  </p>
                </div>
                <button onClick={() => setEditWeeklyCI(null)} className="p-2 rounded-xl text-[#5a7090] hover:text-[#f0f4ff] hover:bg-[#1e2d42] transition-all">
                  <X size={18} />
                </button>
              </div>
              <div className="px-4 pt-4">
                <WeeklyCheckInForm
                  athlete={athlete}
                  initialValues={editWeeklyCI}
                  isEdit
                  onSubmit={handleUpdateWeeklyCheckIn}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Plan change request review modal */}
      <AnimatePresence>
        {reviewingRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setReviewingRequest(null); }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl bg-[#0d1526] border-t border-[#1e2d42] pb-8"
            >
              <div className="sticky top-0 z-10 bg-[#0d1526] flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#1e2d42]">
                <div>
                  <p className="text-[10px] text-[#f59e0b] uppercase tracking-wider mb-0.5">Planänderungsvorschlag</p>
                  <p className="text-sm font-semibold text-[#f0f4ff]">
                    {reviewingRequest.planType === "training" ? "Trainingsplan" : "Ernährungsplan"} ·{" "}
                    {new Date(reviewingRequest.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <button onClick={() => setReviewingRequest(null)} className="p-2 rounded-xl text-[#5a7090] hover:text-[#f0f4ff] hover:bg-[#1e2d42] transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="px-4 pt-4 flex flex-col gap-4">
                <p className="text-xs text-[#5a7090]">Vorgeschlagener Plan von {athlete.name}:</p>

                {reviewingRequest.planType === "training" ? (
                  <TrainingAccordion plan={reviewingRequest.proposedPlan as TrainingPlan} />
                ) : (
                  <MealPlanView
                    plans={[reviewingRequest.proposedPlan as MealPlan]}
                    athleteWeight={resolveAthleteWeight(athlete)}
                  />
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleRejectPlanChangeRequest(reviewingRequest.id)}
                    className="flex-1 py-2.5 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] font-medium text-sm hover:bg-[#ef4444]/20 transition-colors"
                  >
                    Ablehnen
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprovePlanChangeRequest(reviewingRequest.id)}
                    className="flex-1 py-2.5 rounded-xl bg-[#10b981] text-white font-semibold text-sm hover:bg-[#059669] transition-colors"
                  >
                    Bestätigen &amp; übernehmen
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete check-in confirmation modal */}
      {deleteConfirmCI && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141d2e] border border-[#1e2d42] rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-sm font-semibold text-[#f0f4ff] mb-1.5">Check-in löschen</h3>
            <p className="text-xs text-[#8fa3c0] mb-5">
              Diesen {deleteConfirmCI.type === "daily" ? "Daily" : "Weekly"} Check-in unwiderruflich löschen?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirmCI(null)}
                className="px-4 py-2 text-xs rounded-lg border border-[#1e2d42] text-[#8fa3c0] hover:bg-[#1e2d42] transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleDeleteCheckIn}
                className="px-4 py-2 text-xs rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444]/20 transition-colors font-medium"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
