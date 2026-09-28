"use client";
import { athletes as initialAthletes } from "@/data/athletes";
import { foodItems as baseFoodItems } from "@/data/foodItems";
import {
  Athlete, AthleteProfile, LegalConsent, DailyCheckIn, WeeklyCheckIn,
  WeeklyAdjustment, TrainingLog, TrainingExerciseLog, CalorieTrackerDay,
  FoodItem, SupplementDBItem, ExerciseDBItem, GoalType,
  DEFAULT_DAILY_CHECK_CONFIG, LoginHelpRequest, VideoFeedback,
  PlanChangeRequest, TrainingPlan, MealPlan, SupplementPlan, MaintenanceMode,
  OnboardingCode, ExerciseVariant, AthleteDataExport,
} from "@/types";
import { TrainingPlanSchema, MealPlanSchema, SupplementPlanSchema } from "@/lib/planSchemas";
import { getCheckInWeekStart } from "@/lib/utils";

const AUTH_KEY = "processLab_auth";
const CHECK_IN_DONE_KEY = "processLab_checkInDone";
const ACTIVE_SESSION_KEY = "processLab_activeSession";

// ─── Row Mappers ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToAthlete(row: any): Athlete {
  const rawProfile = row.profile ?? undefined;
  const legalConsent: LegalConsent | undefined = rawProfile?.__lc ?? undefined;
  const introVideoSeen: boolean = rawProfile?.__ivs === true;
  const isNewSignup: boolean | undefined = rawProfile?.__ns === true ? true : undefined;
  const seenToolIntros: string[] = rawProfile?.__sti ?? [];
  let profile: AthleteProfile | undefined;
  if (rawProfile) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { __lc, __ivs, __ns, __sti, ...rest } = rawProfile;
    profile = Object.keys(rest).length ? (rest as AthleteProfile) : undefined;
  }
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? undefined,
    pin: row.pin,
    athleteNumber: row.athlete_number ?? undefined,
    avatarInitials: row.avatar_initials ?? "",
    onboardingCompleted: row.onboarding_completed ?? false,
    introVideoSeen,
    isNewSignup,
    seenToolIntros,
    legalConsent,
    profile,
    profileImage: row.profile_image ?? undefined,
    startWeight: row.start_weight ?? 0,
    currentWeight: row.current_weight ?? 0,
    targetWeight: row.target_weight ?? 0,
    goalType: row.goal_type ?? "maintenance",
    goalText: row.goal_text ?? undefined,
    checkInDay: row.check_in_day ?? 1,
    startDate: row.start_date ?? undefined,
    competitionDate: row.competition_date ?? undefined,
    zielBeschreibung: row.ziel_beschreibung ?? undefined,
    experienceLevel: row.experience_level ?? undefined,
    trainingHistory: row.training_history ?? undefined,
    injuries: row.injuries ?? undefined,
    specialNotes: row.special_notes ?? undefined,
    trackingDevice: row.tracking_device ?? undefined,
    trackingDeviceCustom: row.tracking_device_custom ?? undefined,
    street: row.street ?? undefined,
    zipCode: row.zip_code ?? undefined,
    city: row.city ?? undefined,
    isHidden: row.is_hidden ?? undefined,
    exerciseVariants: row.exercise_variants ?? [],
    dailyCheckConfig: row.daily_check_config ?? { ...DEFAULT_DAILY_CHECK_CONFIG },
    coachNote: row.coach_note ?? "",
    visibleNote: row.visible_note ?? "",
    dailyCheckIns: row.daily_check_ins ?? [],
    weeklyCheckIns: row.weekly_check_ins ?? [],
    weeklyAdjustments: row.weekly_adjustments ?? [],
    trainingLogs: row.training_logs ?? [],
    calorieTrackerDays: row.calorie_tracker_days ?? [],
    mealPlans: row.meal_plans ?? [],
    trainingPlan: row.training_plan ?? undefined,
    trainingPlans: (row.training_plans?.length ? row.training_plans : null) ?? (row.training_plan ? [row.training_plan] : []),
    supplementPlan: row.supplement_plan ?? undefined,
    supplementPlans: (row.supplement_plans?.length ? row.supplement_plans : null) ?? (row.supplement_plan ? [row.supplement_plan] : []),
    notes: row.notes ?? [],
    joinedAt: row.joined_at ?? new Date().toISOString().split("T")[0],
    weeklyTrendTargetPercent: row.weekly_trend_target_percent ?? undefined,
    planBearbeitungErlaubt: row.plan_bearbeitung_erlaubt ?? false,
    planChangeRequests: row.plan_change_requests ?? [],
  };
}

function athleteToRow(a: Athlete): Record<string, unknown> {
  const profileWithLegal = {
    ...(a.profile ?? {}),
    ...(a.legalConsent ? { __lc: a.legalConsent } : {}),
    ...(a.introVideoSeen ? { __ivs: true } : {}),
    ...(a.isNewSignup ? { __ns: true } : {}),
  };
  const profileOrNull = Object.keys(profileWithLegal).length ? profileWithLegal : null;
  return {
    id: a.id,
    name: a.name,
    email: a.email ?? null,
    pin: a.pin,
    athlete_number: a.athleteNumber ?? null,
    avatar_initials: a.avatarInitials ?? null,
    onboarding_completed: a.onboardingCompleted ?? false,
    profile: profileOrNull,
    profile_image: a.profileImage ?? null,
    start_weight: a.startWeight ?? null,
    current_weight: a.currentWeight ?? null,
    target_weight: a.targetWeight ?? null,
    goal_type: a.goalType ?? null,
    goal_text: a.goalText ?? null,
    check_in_day: a.checkInDay ?? 1,
    start_date: a.startDate ?? null,
    competition_date: a.competitionDate ?? null,
    ziel_beschreibung: a.zielBeschreibung ?? null,
    experience_level: a.experienceLevel ?? null,
    training_history: a.trainingHistory ?? null,
    injuries: a.injuries ?? null,
    special_notes: a.specialNotes ?? null,
    tracking_device: a.trackingDevice ?? null,
    tracking_device_custom: a.trackingDeviceCustom ?? null,
    street: a.street ?? null,
    zip_code: a.zipCode ?? null,
    city: a.city ?? null,
    is_hidden: a.isHidden ?? null,
    exercise_variants: a.exerciseVariants ?? [],
    daily_check_config: a.dailyCheckConfig ?? null,
    coach_note: a.coachNote ?? "",
    visible_note: a.visibleNote ?? "",
    daily_check_ins: a.dailyCheckIns ?? [],
    weekly_check_ins: a.weeklyCheckIns ?? [],
    weekly_adjustments: a.weeklyAdjustments ?? [],
    training_logs: a.trainingLogs ?? [],
    calorie_tracker_days: a.calorieTrackerDays ?? [],
    meal_plans: a.mealPlans ?? [],
    training_plan: a.trainingPlan ?? null,
    supplement_plan: a.supplementPlan ?? null,
    notes: a.notes ?? [],
    joined_at: a.joinedAt ?? null,
    weekly_trend_target_percent: a.weeklyTrendTargetPercent ?? null,
    plan_bearbeitung_erlaubt: a.planBearbeitungErlaubt ?? false,
    plan_change_requests: a.planChangeRequests ?? [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToFoodItem(row: any): FoodItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? "",
    kcalPer100g: row.kcal_per_100g ?? 0,
    proteinPer100g: row.protein_per_100g ?? 0,
    carbsPer100g: row.carbs_per_100g ?? 0,
    fatPer100g: row.fat_per_100g ?? 0,
    fiberPer100g: row.fiber_per_100g ?? 0,
    saltPer100g: row.salt_per_100g ?? 0,
    defaultAmount: row.default_amount ?? undefined,
    defaultAmountUnit: row.default_amount_unit ?? undefined,
    servingLabel: row.serving_label ?? undefined,
    notes: row.notes ?? undefined,
    isActive: row.is_active ?? true,
    source: row.source ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

function foodItemToRow(f: FoodItem): Record<string, unknown> {
  const row: Record<string, unknown> = {
    id: f.id,
    name: f.name,
    category: f.category ?? null,
    kcal_per_100g: f.kcalPer100g ?? null,
    protein_per_100g: f.proteinPer100g ?? null,
    carbs_per_100g: f.carbsPer100g ?? null,
    fat_per_100g: f.fatPer100g ?? null,
    fiber_per_100g: f.fiberPer100g ?? null,
    salt_per_100g: f.saltPer100g ?? null,
    default_amount: f.defaultAmount ?? null,
    default_amount_unit: f.defaultAmountUnit ?? null,
    serving_label: f.servingLabel ?? null,
    notes: f.notes ?? null,
    is_active: f.isActive ?? true,
  };
  if (f.source !== undefined) row.source = f.source;
  return row;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSupplement(row: any): SupplementDBItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? undefined,
    standardDosage: row.standard_dosage ?? "",
    timing: row.timing ?? "",
    instructions: row.instructions ?? "",
    notes: row.notes ?? undefined,
    link: row.link ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToExercise(row: any): ExerciseDBItem {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group ?? "",
    equipmentType: row.equipment ?? undefined,
    laterality: (row.laterality === "unilateral" ? "unilateral" : "bilateral") as "bilateral" | "unilateral",
    isTimeBased: row.is_time_based ?? false,
    notes: row.notes ?? undefined,
    executionLink: row.execution_link ?? undefined,
    currentTechFeedbackVideoId: row.current_tech_feedback_video_id ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToLoginHelpRequest(row: any): LoginHelpRequest {
  return {
    id: row.id,
    enteredName: row.entered_name,
    note: row.note ?? undefined,
    requestedAt: row.requested_at,
    status: row.status,
  };
}

// ─── Auth (sync / localStorage) ──────────────────────────────────────────────

export function loadAuth(): { role: string | null; athleteId: string | null } {
  if (typeof window === "undefined") return { role: null, athleteId: null };
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : { role: null, athleteId: null };
  } catch {
    return { role: null, athleteId: null };
  }
}

export function saveAuth(role: string, athleteId: string | null) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_KEY, JSON.stringify({ role, athleteId }));
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
}

// ─── Internal fetch helper ────────────────────────────────────────────────────

async function api<T = unknown>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(path, opts);
  if (!res.ok) {
    const msg = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

function jsonOpts(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

// ─── Athletes ─────────────────────────────────────────────────────────────────

export async function loadAthletes(): Promise<Athlete[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>("/api/athletes");
  return rows.map(rowToAthlete);
}

export async function addAthlete(athlete: Athlete): Promise<Athlete[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>("/api/athletes", jsonOpts("POST", athleteToRow(athlete)));
  return rows.map(rowToAthlete);
}

export async function updateAthlete(id: string, updates: Partial<Athlete>): Promise<Athlete[]> {
  const row: Record<string, unknown> = {};
  if ("name" in updates) row.name = updates.name;
  if ("email" in updates) row.email = updates.email ?? null;
  if ("pin" in updates) row.pin = updates.pin;
  if ("avatarInitials" in updates) row.avatar_initials = updates.avatarInitials ?? null;
  if ("onboardingCompleted" in updates) row.onboarding_completed = updates.onboardingCompleted;
  if ("legalConsent" in updates || "profile" in updates || "isNewSignup" in updates) {
    const p = updates.profile ?? undefined;
    const lc = updates.legalConsent ?? undefined;
    const ns = updates.isNewSignup;
    const merged = {
      ...(p ?? {}),
      ...(lc ? { __lc: lc } : {}),
      ...(ns ? { __ns: true } : {}),
    };
    row.profile = Object.keys(merged).length ? merged : null;
  }
  if ("profileImage" in updates) row.profile_image = updates.profileImage ?? null;
  if ("startWeight" in updates) row.start_weight = updates.startWeight ?? null;
  if ("currentWeight" in updates) row.current_weight = updates.currentWeight ?? null;
  if ("targetWeight" in updates) row.target_weight = updates.targetWeight ?? null;
  if ("goalType" in updates) row.goal_type = updates.goalType ?? null;
  if ("goalText" in updates) row.goal_text = updates.goalText ?? null;
  if ("checkInDay" in updates) row.check_in_day = updates.checkInDay;
  if ("competitionDate" in updates) row.competition_date = updates.competitionDate ?? null;
  if ("zielBeschreibung" in updates) row.ziel_beschreibung = updates.zielBeschreibung ?? null;
  if ("experienceLevel" in updates) row.experience_level = updates.experienceLevel ?? null;
  if ("trainingHistory" in updates) row.training_history = updates.trainingHistory ?? null;
  if ("injuries" in updates) row.injuries = updates.injuries ?? null;
  if ("specialNotes" in updates) row.special_notes = updates.specialNotes ?? null;
  if ("trackingDevice" in updates) row.tracking_device = updates.trackingDevice ?? null;
  if ("trackingDeviceCustom" in updates) row.tracking_device_custom = updates.trackingDeviceCustom ?? null;
  if ("street" in updates) row.street = updates.street ?? null;
  if ("zipCode" in updates) row.zip_code = updates.zipCode ?? null;
  if ("city" in updates) row.city = updates.city ?? null;
  if ("dailyCheckConfig" in updates) row.daily_check_config = updates.dailyCheckConfig ?? null;
  if ("coachNote" in updates) row.coach_note = updates.coachNote;
  if ("visibleNote" in updates) row.visible_note = updates.visibleNote;
  if ("dailyCheckIns" in updates) row.daily_check_ins = updates.dailyCheckIns ?? [];
  if ("weeklyCheckIns" in updates) row.weekly_check_ins = updates.weeklyCheckIns ?? [];
  if ("weeklyAdjustments" in updates) row.weekly_adjustments = updates.weeklyAdjustments ?? [];
  if ("trainingLogs" in updates) row.training_logs = updates.trainingLogs ?? [];
  if ("calorieTrackerDays" in updates) row.calorie_tracker_days = updates.calorieTrackerDays ?? [];
  if ("mealPlans" in updates) row.meal_plans = updates.mealPlans ?? [];
  if ("trainingPlan" in updates) row.training_plan = updates.trainingPlan ?? null;
  if ("supplementPlan" in updates) row.supplement_plan = updates.supplementPlan ?? null;
  if ("notes" in updates) row.notes = updates.notes ?? [];
  if ("joinedAt" in updates) row.joined_at = updates.joinedAt ?? null;
  if ("weeklyTrendTargetPercent" in updates) row.weekly_trend_target_percent = updates.weeklyTrendTargetPercent ?? null;
  if ("planBearbeitungErlaubt" in updates) row.plan_bearbeitung_erlaubt = updates.planBearbeitungErlaubt ?? false;
  if ("planChangeRequests" in updates) row.plan_change_requests = updates.planChangeRequests ?? [];
  if ("exerciseVariants" in updates) row.exercise_variants = updates.exerciseVariants ?? [];
  if ("isHidden" in updates) row.is_hidden = updates.isHidden ?? null;
  row.updated_at = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/athletes/${id}`, jsonOpts("PATCH", { row }));
  return rows.map(rowToAthlete);
}

export async function saveLegalConsent(
  athleteId: string,
  consent: NonNullable<Athlete["legalConsent"]>
): Promise<void> {
  const a = await getAthlete(athleteId);
  const merged = { ...(a.profile ?? {}), __lc: consent };
  await api(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { profile: merged, updated_at: new Date().toISOString() },
  }));
}

export async function markAthleteToolIntroSeen(athleteId: string, toolKey: string): Promise<void> {
  const a = await getAthlete(athleteId);
  const sti: string[] = a.seenToolIntros ?? [];
  if (sti.includes(toolKey)) return;
  const merged = { ...(a.profile ?? {}), __sti: [...sti, toolKey] };
  await api(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { profile: merged, updated_at: new Date().toISOString() },
  }));
}

export async function markIntroVideoSeen(athleteId: string): Promise<void> {
  const a = await getAthlete(athleteId);
  const merged = { ...(a.profile ?? {}), __ivs: true };
  await api(`/api/athletes/${athleteId}`, jsonOpts("PATCH", { row: { profile: merged } }));
}

export async function deleteAthlete(id: string): Promise<void> {
  await api(`/api/athletes/${id}`, { method: "DELETE" });
}

export async function setAthleteHidden(athleteId: string, hidden: boolean): Promise<Athlete[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { is_hidden: hidden || null, updated_at: new Date().toISOString() },
  }));
  return rows.map(rowToAthlete);
}

// ─── Exercise Variants ────────────────────────────────────────────────────────

export async function getAthleteExerciseVariants(athleteId: string): Promise<ExerciseVariant[]> {
  const a = await getAthlete(athleteId);
  return a.exerciseVariants ?? [];
}

export async function addExerciseVariant(athleteId: string, variant: ExerciseVariant): Promise<ExerciseVariant[]> {
  const a = await getAthlete(athleteId);
  const updated = [...(a.exerciseVariants ?? []), variant];
  await api(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { exercise_variants: updated, updated_at: new Date().toISOString() },
  }));
  return updated;
}

// ─── Registration & Login ─────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() ?? "").slice(0, 2).join("");
}

function deriveGoalType(priorities: string[]): GoalType {
  if (priorities.includes("Fettverlust")) return "cut";
  if (priorities.includes("Muskelaufbau")) return "bulk";
  if (priorities.includes("Recomp")) return "recomp";
  return "maintenance";
}

export interface RegistrationData {
  name: string;
  email: string;
  pin: string;
  birthDate?: string;
  currentWeight?: number;
  targetWeight?: number;
  checkInDay?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  experienceLevel?: string;
  injuries?: string;
  trainingHistory?: string;
  profile: AthleteProfile;
  goalPriorities?: string[];
  goalText?: string;
  legalConsent?: LegalConsent;
  street?: string;
  zipCode?: string;
  city?: string;
}

export async function registerAthlete(data: RegistrationData): Promise<Athlete> {
  const payload = {
    name: data.name.trim(),
    email: data.email.toLowerCase().trim(),
    pin: data.pin,
    birthDate: data.birthDate,
    currentWeight: data.currentWeight,
    targetWeight: data.targetWeight,
    goalType: deriveGoalType(data.goalPriorities ?? []),
    goalText: data.goalText,
    checkInDay: data.checkInDay ?? 1,
    experienceLevel: data.experienceLevel,
    injuries: data.injuries,
    trainingHistory: data.trainingHistory,
    street: data.street,
    zipCode: data.zipCode,
    city: data.city,
    profile: { ...data.profile, personal: { email: data.email.toLowerCase().trim(), birthDate: data.birthDate || undefined } },
    legalConsent: data.legalConsent,
    dailyCheckConfig: { ...DEFAULT_DAILY_CHECK_CONFIG },
  };
  const result = await api<{ ok: boolean; athleteId: string }>("/api/register", jsonOpts("POST", payload));
  // Build a minimal Athlete object for immediate use; full data loaded on next loadAthletes()
  const today = new Date().toISOString().split("T")[0];
  return {
    id: result.athleteId,
    name: data.name.trim(),
    email: data.email.toLowerCase().trim(),
    pin: data.pin,
    avatarInitials: getInitials(data.name),
    onboardingCompleted: true,
    isNewSignup: true,
    legalConsent: data.legalConsent,
    profile: { ...data.profile, personal: { email: data.email.toLowerCase().trim(), birthDate: data.birthDate || undefined } },
    startWeight: data.currentWeight ?? 0,
    currentWeight: data.currentWeight ?? 0,
    targetWeight: data.targetWeight ?? data.currentWeight ?? 0,
    goalType: deriveGoalType(data.goalPriorities ?? []),
    goalText: data.goalText,
    checkInDay: data.checkInDay ?? 1,
    startDate: today,
    experienceLevel: (data.experienceLevel as Athlete["experienceLevel"]) ?? undefined,
    injuries: data.injuries,
    trainingHistory: data.trainingHistory,
    street: data.street,
    zipCode: data.zipCode,
    city: data.city,
    dailyCheckConfig: { ...DEFAULT_DAILY_CHECK_CONFIG },
    coachNote: "",
    visibleNote: "",
    dailyCheckIns: [],
    weeklyCheckIns: [],
    weeklyAdjustments: [],
    trainingLogs: [],
    calorieTrackerDays: [],
    mealPlans: [],
    notes: [],
    joinedAt: today,
  };
}

export async function updateAthleteCredentials(
  athleteId: string,
  updates: { name?: string; email?: string; pin?: string }
): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const newName = updates.name?.trim() ?? a.name;
  const newEmail = updates.email?.toLowerCase().trim() ?? a.email ?? "";
  const newPin = updates.pin?.trim() ?? a.pin;
  const newInitials = newName.split(/\s+/).map((w) => w[0]?.toUpperCase() ?? "").slice(0, 2).join("");
  const updatedProfile = a.profile
    ? { ...a.profile, personal: { ...a.profile.personal, email: newEmail || undefined } }
    : undefined;
  const profileWithLegal = a.legalConsent
    ? { ...(updatedProfile ?? {}), __lc: a.legalConsent }
    : (updatedProfile ?? null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: {
      name: newName,
      email: newEmail || null,
      pin: newPin,
      avatar_initials: updates.name ? newInitials : a.avatarInitials,
      profile: profileWithLegal,
      updated_at: new Date().toISOString(),
    },
  }));
  return rows.map(rowToAthlete);
}

// ─── JSONB array mutation helpers ─────────────────────────────────────────────

async function getAthlete(id: string): Promise<Athlete> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/athletes/${id}`);
  if (!rows.length) throw new Error(`Athlete ${id} not found`);
  return rowToAthlete(rows[0]);
}

type FreemealTotals = {
  calculatedTotalKcal: number;
  calculatedTotalProtein: number;
  calculatedTotalCarbs: number;
  calculatedTotalFat: number;
};

function computeFreemealTotals(a: Athlete, checkIn: Omit<DailyCheckIn, "id" | "athleteId">): FreemealTotals | undefined {
  if (checkIn.nutritionStatus !== "plan_followed_freemeal" || checkIn.freemealKcal == null) return undefined;
  const plan = checkIn.selectedMealPlanId
    ? (a.mealPlans ?? []).find((p) => p.id === checkIn.selectedMealPlanId)
    : (a.mealPlans ?? []).find((p) => p.isActive);
  if (!plan) return undefined;
  const fixedMeals = plan.meals.filter((m) => !m.isFreeMeal);
  const base = fixedMeals.reduce(
    (acc, m) => {
      for (const e of m.entries) {
        const r = e.amountG / 100;
        acc.kcal += e.foodItem.kcalPer100g * r;
        acc.protein += e.foodItem.proteinPer100g * r;
        acc.carbs += e.foodItem.carbsPer100g * r;
        acc.fat += e.foodItem.fatPer100g * r;
      }
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
  return {
    calculatedTotalKcal: Math.round(base.kcal + checkIn.freemealKcal),
    calculatedTotalProtein: Math.round(base.protein + (checkIn.freemealProtein ?? 0)),
    calculatedTotalCarbs: Math.round(base.carbs + (checkIn.freemealCarbs ?? 0)),
    calculatedTotalFat: Math.round(base.fat + (checkIn.freemealFat ?? 0)),
  };
}

export async function addDailyCheckIn(
  athleteId: string,
  checkIn: Omit<DailyCheckIn, "id" | "athleteId">
): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const totals = computeFreemealTotals(a, checkIn);
  const enriched = totals != null ? { ...checkIn, ...totals } : checkIn;
  const newCheckIn: DailyCheckIn = { ...enriched, id: `dc-${athleteId}-${Date.now()}`, athleteId };
  const filtered = a.dailyCheckIns.filter((c) => c.date !== checkIn.date);
  const daily_check_ins = [...filtered, newCheckIn].sort((x, y) => x.date.localeCompare(y.date));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { daily_check_ins, current_weight: checkIn.weight, updated_at: new Date().toISOString() },
  }));
  return rows.map(rowToAthlete);
}

export async function addWeeklyCheckIn(
  athleteId: string,
  checkIn: Omit<WeeklyCheckIn, "id" | "athleteId">
): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const weekStart = getCheckInWeekStart(checkIn.date, a.checkInDay);
  const newCheckIn: WeeklyCheckIn = { ...checkIn, weekStart, id: `wc-${athleteId}-${Date.now()}`, athleteId };
  const filtered = a.weeklyCheckIns.filter((c) => c.weekStart !== weekStart);
  const weekly_check_ins = [...filtered, newCheckIn];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { weekly_check_ins, updated_at: new Date().toISOString() },
  }));
  return rows.map(rowToAthlete);
}

export async function updateDailyCheckIn(
  athleteId: string,
  checkInId: string,
  data: Omit<DailyCheckIn, "id" | "athleteId">
): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const totals = computeFreemealTotals(a, data);
  const enriched = totals != null ? { ...data, ...totals } : data;
  const daily_check_ins = a.dailyCheckIns.map((c) =>
    c.id === checkInId ? { ...enriched, id: checkInId, athleteId } : c
  ).sort((x, y) => x.date.localeCompare(y.date));
  const latest = daily_check_ins.at(-1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { daily_check_ins, ...(latest ? { current_weight: latest.weight } : {}), updated_at: new Date().toISOString() },
  }));
  return rows.map(rowToAthlete);
}

export async function updateWeeklyCheckIn(
  athleteId: string,
  checkInId: string,
  data: Omit<WeeklyCheckIn, "id" | "athleteId">
): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const weekly_check_ins = a.weeklyCheckIns.map((c) =>
    c.id === checkInId ? { ...data, id: checkInId, athleteId } : c
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { weekly_check_ins, updated_at: new Date().toISOString() },
  }));
  return rows.map(rowToAthlete);
}

export async function deleteDailyCheckIn(
  athleteId: string,
  checkInId: string
): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const daily_check_ins = a.dailyCheckIns
    .filter((c) => c.id !== checkInId)
    .sort((x, y) => x.date.localeCompare(y.date));
  const latest = daily_check_ins.at(-1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { daily_check_ins, ...(latest ? { current_weight: latest.weight } : {}), updated_at: new Date().toISOString() },
  }));
  return rows.map(rowToAthlete);
}

export async function deleteWeeklyCheckIn(
  athleteId: string,
  checkInId: string
): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const weekly_check_ins = a.weeklyCheckIns.filter((c) => c.id !== checkInId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { weekly_check_ins, updated_at: new Date().toISOString() },
  }));
  return rows.map(rowToAthlete);
}

export async function addWeeklyAdjustment(
  athleteId: string,
  adj: Omit<WeeklyAdjustment, "id" | "athleteId" | "createdAt">
): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const newAdj: WeeklyAdjustment = {
    ...adj,
    id: `wa-${athleteId}-${Date.now()}`,
    athleteId,
    createdAt: new Date().toISOString(),
  };
  const weekly_adjustments = [...(a.weeklyAdjustments ?? []), newAdj];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { weekly_adjustments, updated_at: new Date().toISOString() },
  }));
  return rows.map(rowToAthlete);
}

export async function deleteWeeklyAdjustment(athleteId: string, adjId: string): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const weekly_adjustments = (a.weeklyAdjustments ?? []).filter((w) => w.id !== adjId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { weekly_adjustments, updated_at: new Date().toISOString() },
  }));
  return rows.map(rowToAthlete);
}

export async function saveCalorieTrackerDay(
  athleteId: string,
  day: Omit<CalorieTrackerDay, "id" | "athleteId">
): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const newDay: CalorieTrackerDay = { ...day, id: `ct-${athleteId}-${day.date}`, athleteId };
  const filtered = (a.calorieTrackerDays ?? []).filter((d) => d.date !== day.date);
  const calorie_tracker_days = [...filtered, newDay].sort((x, y) => x.date.localeCompare(y.date));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { calorie_tracker_days, updated_at: new Date().toISOString() },
  }));
  return rows.map(rowToAthlete);
}

export async function saveTrainingLog(
  athleteId: string,
  log: Omit<TrainingLog, "id" | "athleteId">
): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const newLog: TrainingLog = { ...log, id: `tl-${athleteId}-${Date.now()}`, athleteId };
  const filtered = (a.trainingLogs ?? []).filter(
    (l) => l.date !== log.date || l.trainingDayId !== log.trainingDayId
  );
  const training_logs = [...filtered, newLog].sort((x, y) => x.date.localeCompare(y.date));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { training_logs, updated_at: new Date().toISOString() },
  }));
  return rows.map(rowToAthlete);
}

export async function deleteTrainingLog(athleteId: string, logId: string): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const training_logs = (a.trainingLogs ?? []).filter((l) => l.id !== logId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { training_logs, updated_at: new Date().toISOString() },
  }));
  return rows.map(rowToAthlete);
}

export async function updateTrainingLog(athleteId: string, log: TrainingLog): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const training_logs = (a.trainingLogs ?? [])
    .map((l) => l.id === log.id ? log : l)
    .sort((x, y) => x.date.localeCompare(y.date));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { training_logs, updated_at: new Date().toISOString() },
  }));
  return rows.map(rowToAthlete);
}

// ─── Plan Change Requests ─────────────────────────────────────────────────────

export async function createPlanChangeRequest(
  athleteId: string,
  planType: "training" | "nutrition",
  proposedPlan: TrainingPlan | MealPlan
): Promise<void> {
  const a = await getAthlete(athleteId);
  const request: PlanChangeRequest = {
    id: `pcr-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    athleteId,
    planType,
    proposedPlan,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  const plan_change_requests = [...(a.planChangeRequests ?? []), request];
  await api(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { plan_change_requests, updated_at: new Date().toISOString() },
  }));
}

export async function getPendingPlanChangeRequests(athleteId: string): Promise<PlanChangeRequest[]> {
  const a = await getAthlete(athleteId);
  return (a.planChangeRequests ?? []).filter((r) => r.status === "pending");
}

export async function approvePlanChangeRequest(athleteId: string, requestId: string): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const request = (a.planChangeRequests ?? []).find((r) => r.id === requestId);
  if (!request) throw new Error("Request not found");
  const plan_change_requests = (a.planChangeRequests ?? []).map((r) =>
    r.id === requestId ? { ...r, status: "approved" as const } : r
  );
  const row: Record<string, unknown> = { plan_change_requests, updated_at: new Date().toISOString() };
  if (request.planType === "training") {
    row.training_plan = request.proposedPlan;
  } else {
    const currentPlans = a.mealPlans ?? [];
    const proposed = request.proposedPlan as MealPlan;
    const exists = currentPlans.some((p) => p.id === proposed.id);
    row.meal_plans = exists
      ? currentPlans.map((p) => p.id === proposed.id ? proposed : p)
      : [...currentPlans, proposed];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/athletes/${athleteId}`, jsonOpts("PATCH", { row }));
  return rows.map(rowToAthlete);
}

export async function rejectPlanChangeRequest(athleteId: string, requestId: string): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const plan_change_requests = (a.planChangeRequests ?? []).map((r) =>
    r.id === requestId ? { ...r, status: "rejected" as const } : r
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { plan_change_requests, updated_at: new Date().toISOString() },
  }));
  return rows.map(rowToAthlete);
}

// ─── Food Database ────────────────────────────────────────────────────────────

export async function loadCustomFoods(): Promise<FoodItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>("/api/databases/custom-foods");
  return rows.map(rowToFoodItem);
}

export async function loadDeactivatedFoods(): Promise<string[]> {
  return api<string[]>("/api/databases/deactivated-foods");
}

export async function getAllFoodItems(): Promise<FoodItem[]> {
  const [deactivated, custom] = await Promise.all([loadDeactivatedFoods(), loadCustomFoods()]);
  const base = baseFoodItems.map((f) => ({ ...f, isActive: !deactivated.includes(f.id) }));
  return [...base, ...custom.filter((f) => f.isActive !== false)];
}

export async function addCustomFood(
  food: Omit<FoodItem, "id" | "createdAt" | "updatedAt">
): Promise<FoodItem[]> {
  const newFood: FoodItem = {
    ...food,
    id: `cf-${Date.now()}`,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>("/api/databases/custom-foods", jsonOpts("POST", foodItemToRow(newFood)));
  return rows.map(rowToFoodItem);
}

export async function updateCustomFood(id: string, updates: Partial<FoodItem>): Promise<FoodItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/databases/custom-foods/${encodeURIComponent(id)}`, jsonOpts("PATCH", updates));
  return rows.map(rowToFoodItem);
}

export async function deleteCustomFood(id: string): Promise<FoodItem[]> {
  const res = await fetch(`/api/food/${encodeURIComponent(id)}?type=custom`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Delete failed");
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>("/api/databases/custom-foods");
  return rows.map(rowToFoodItem);
}

export async function deleteBaseFoodItem(id: string): Promise<string[]> {
  const hidden = await loadDeactivatedFoods();
  if (hidden.includes(id)) return hidden;
  const res = await fetch(`/api/food/${encodeURIComponent(id)}?type=base`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Deactivate failed");
  }
  return [...hidden, id];
}

export async function toggleFoodActive(
  id: string,
  isCustom: boolean
): Promise<{ deactivated: string[]; customFoods: FoodItem[] }> {
  if (isCustom) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await api<any[]>("/api/databases/custom-foods");
    const current = rows.map(rowToFoodItem).find((f) => f.id === id);
    const newActive = !(current?.isActive ?? true);
    await api(`/api/databases/custom-foods/${encodeURIComponent(id)}`, jsonOpts("PATCH", { isActive: newActive }));
  } else {
    const hidden = await loadDeactivatedFoods();
    if (hidden.includes(id)) {
      await api("/api/databases/deactivated-foods", jsonOpts("DELETE", { foodId: id }));
    } else {
      await api("/api/databases/deactivated-foods", jsonOpts("POST", { foodId: id }));
    }
  }
  const [deactivated, customFoods] = await Promise.all([loadDeactivatedFoods(), loadCustomFoods()]);
  return { deactivated, customFoods };
}

// ─── Supplement Database ──────────────────────────────────────────────────────

export async function loadSupplementDB(): Promise<SupplementDBItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>("/api/databases/supplements");
  return rows.map(rowToSupplement);
}

export async function addSupplementDBItem(
  item: Omit<SupplementDBItem, "id" | "createdAt" | "updatedAt">
): Promise<SupplementDBItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>("/api/databases/supplements", jsonOpts("POST", item));
  return rows.map(rowToSupplement);
}

export async function updateSupplementDBItem(
  id: string,
  updates: Partial<SupplementDBItem>
): Promise<SupplementDBItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/databases/supplements/${encodeURIComponent(id)}`, jsonOpts("PATCH", updates));
  return rows.map(rowToSupplement);
}

export async function deleteSupplementDBItem(id: string): Promise<SupplementDBItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/databases/supplements/${encodeURIComponent(id)}`, { method: "DELETE" });
  return rows.map(rowToSupplement);
}

// ─── Exercise Database ────────────────────────────────────────────────────────

export async function loadExerciseDB(): Promise<ExerciseDBItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>("/api/databases/exercises");
  return rows.map(rowToExercise);
}

export async function addExerciseDBItem(
  item: Omit<ExerciseDBItem, "id" | "createdAt" | "updatedAt">
): Promise<ExerciseDBItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>("/api/databases/exercises", jsonOpts("POST", item));
  return rows.map(rowToExercise);
}

export async function updateExerciseDBItem(
  id: string,
  updates: Partial<ExerciseDBItem>
): Promise<ExerciseDBItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/databases/exercises/${encodeURIComponent(id)}`, jsonOpts("PATCH", updates));
  return rows.map(rowToExercise);
}

export async function deleteExerciseDBItem(id: string): Promise<ExerciseDBItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/databases/exercises/${encodeURIComponent(id)}`, { method: "DELETE" });
  return rows.map(rowToExercise);
}

export async function exportAllDatabases(): Promise<{
  foods: FoodItem[];
  exercises: ExerciseDBItem[];
  supplements: SupplementDBItem[];
}> {
  const [foods, exercises, supplements] = await Promise.all([
    getAllFoodItems(),
    loadExerciseDB(),
    loadSupplementDB(),
  ]);
  return { foods, exercises, supplements };
}

// ─── Login Help Requests ──────────────────────────────────────────────────────

export async function loadLoginHelpRequests(): Promise<LoginHelpRequest[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>("/api/login-help");
  return rows.map(rowToLoginHelpRequest);
}

export async function addLoginHelpRequest(enteredName: string, note?: string): Promise<LoginHelpRequest[]> {
  await api("/api/login-help", jsonOpts("POST", { enteredName, note }));
  return [];
}

export async function resolveLoginHelpRequest(id: string): Promise<LoginHelpRequest[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/login-help/${id}`, { method: "PATCH" });
  return rows.map(rowToLoginHelpRequest);
}

export async function deleteLoginHelpRequest(id: string): Promise<LoginHelpRequest[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/login-help/${id}`, { method: "DELETE" });
  return rows.map(rowToLoginHelpRequest);
}

// ─── Video Feedbacks ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToVideoFeedback(row: any): VideoFeedback {
  return {
    id: row.id,
    athleteId: row.athlete_id,
    title: row.title,
    date: row.date,
    loomUrl: row.loom_url,
    seenAt: row.seen_at ?? undefined,
    createdAt: row.created_at,
    category: row.category ?? "sonstiges",
    linkedExerciseIds: row.linked_exercise_ids ?? undefined,
    linkedWeeklyCheckInId: row.linked_weekly_check_in_id ?? undefined,
  };
}

export async function loadVideoFeedbacks(athleteId?: string): Promise<VideoFeedback[]> {
  const url = athleteId
    ? `/api/video-feedbacks?athleteId=${encodeURIComponent(athleteId)}`
    : "/api/video-feedbacks";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(url);
  return rows.map(rowToVideoFeedback);
}

export async function loadVideoFeedbacksByCategory(
  athleteId: string,
  category: VideoFeedback["category"]
): Promise<VideoFeedback[]> {
  const url = `/api/video-feedbacks?athleteId=${encodeURIComponent(athleteId)}&category=${encodeURIComponent(category)}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(url);
  return rows.map(rowToVideoFeedback);
}

export async function addVideoFeedback(data: Omit<VideoFeedback, "id" | "createdAt">): Promise<VideoFeedback[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>("/api/video-feedbacks", jsonOpts("POST", data));
  return rows.map(rowToVideoFeedback);
}

export async function deleteVideoFeedback(id: string): Promise<VideoFeedback[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/video-feedbacks/${id}`, { method: "DELETE" });
  return rows.map(rowToVideoFeedback);
}

export async function markVideoFeedbackSeen(id: string): Promise<void> {
  await api(`/api/video-feedbacks/${id}`, jsonOpts("PATCH", {}));
}

export async function linkVideoFeedbackToExercises(
  videoFeedbackId: string,
  exerciseIds: string[]
): Promise<void> {
  // Update exercise_db entries
  for (const exerciseId of exerciseIds) {
    await api(`/api/databases/exercises/${encodeURIComponent(exerciseId)}`, jsonOpts("PATCH", {
      currentTechFeedbackVideoId: videoFeedbackId,
    }));
  }
  // Update video feedback linked_exercise_ids
  await api(`/api/video-feedbacks/${videoFeedbackId}`, jsonOpts("PATCH", {
    linkedExerciseIds: exerciseIds,
  }));
}

// ─── Check-In & Training Counters ─────────────────────────────────────────────

export function getOpenCheckInCounts(
  athlete: Athlete,
  asOfDate: string
): { daily: number; weekly: number } {
  const windowStart = athlete.startDate ?? athlete.joinedAt;

  const submittedDailyDates = new Set(athlete.dailyCheckIns.map((c) => c.date));
  let daily = 0;
  const dayIter = new Date(windowStart < asOfDate ? windowStart : asOfDate);
  const dayEnd = new Date(asOfDate);
  while (dayIter <= dayEnd) {
    if (!submittedDailyDates.has(dayIter.toISOString().split("T")[0])) daily++;
    dayIter.setDate(dayIter.getDate() + 1);
  }

  const submittedWeekStarts = new Set(athlete.weeklyCheckIns.map((c) => c.weekStart));
  let weekly = 0;
  const toMonday = (d: Date) => {
    const copy = new Date(d);
    copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7));
    return copy;
  };
  const weekIter = toMonday(new Date(windowStart < asOfDate ? windowStart : asOfDate));
  const weekEnd = toMonday(new Date(asOfDate));
  while (weekIter <= weekEnd) {
    if (!submittedWeekStarts.has(weekIter.toISOString().split("T")[0])) weekly++;
    weekIter.setDate(weekIter.getDate() + 7);
  }

  return { daily, weekly };
}

export async function updateAthleteProfile(
  athleteId: string,
  profile: import("@/types").AthleteProfile
): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const currentRaw = a.profile ?? {};
  const merged = { ...currentRaw, ...profile };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { profile: merged, updated_at: new Date().toISOString() },
  }));
  return rows.map(rowToAthlete);
}

// ─── Multi-plan helpers ───────────────────────────────────────────────────────

export async function addImportedTrainingPlan(athleteId: string, plan: TrainingPlan): Promise<Athlete[]> {
  TrainingPlanSchema.parse(plan);
  const a = await getAthlete(athleteId);
  const existing = a.trainingPlans ?? (a.trainingPlan ? [a.trainingPlan] : []);
  const withoutSameId = existing.filter((p) => p.id !== plan.id);
  const training_plans = [...withoutSameId, plan];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { training_plan: plan, training_plans, updated_at: new Date().toISOString() },
  }));
  return rows.map(rowToAthlete);
}

export async function addImportedMealPlan(athleteId: string, plan: MealPlan): Promise<Athlete[]> {
  MealPlanSchema.parse(plan);
  const a = await getAthlete(athleteId);
  const existing = a.mealPlans ?? [];
  const withoutSameId = existing.filter((p) => p.id !== plan.id);
  const meal_plans = [...withoutSameId, plan];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { meal_plans, updated_at: new Date().toISOString() },
  }));
  return rows.map(rowToAthlete);
}

export async function addImportedSupplementPlan(athleteId: string, plan: SupplementPlan): Promise<Athlete[]> {
  SupplementPlanSchema.parse(plan);
  const a = await getAthlete(athleteId);
  const existing = a.supplementPlans ?? (a.supplementPlan ? [a.supplementPlan] : []);
  const withoutSameId = existing.filter((p) => p.id !== plan.id);
  const supplement_plans = [...withoutSameId, plan];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { supplement_plan: plan, supplement_plans, updated_at: new Date().toISOString() },
  }));
  return rows.map(rowToAthlete);
}

// ─── Plan entry helpers (write + setActive) ───────────────────────────────────

async function writeTrainingPlans(athleteId: string, plans: TrainingPlan[], activePlan: TrainingPlan): Promise<void> {
  await api(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { training_plan: activePlan, training_plans: plans, updated_at: new Date().toISOString() },
  }));
}

async function writeSupplementPlans(athleteId: string, plans: SupplementPlan[], activePlan: SupplementPlan): Promise<void> {
  await api(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { supplement_plan: activePlan, supplement_plans: plans, updated_at: new Date().toISOString() },
  }));
}

export async function saveTrainingPlanEntry(athleteId: string, plan: TrainingPlan): Promise<Athlete[]> {
  TrainingPlanSchema.parse(plan);
  const a = await getAthlete(athleteId);
  const existing = a.trainingPlans ?? (a.trainingPlan ? [a.trainingPlan] : []);
  const newPlan = { ...plan, isActive: true };
  const exists = existing.some((p) => p.id === plan.id);
  const plans = exists
    ? existing.map((p) => (p.id === plan.id ? newPlan : { ...p, isActive: false }))
    : [...existing.map((p) => ({ ...p, isActive: false })), newPlan];
  await writeTrainingPlans(athleteId, plans, newPlan);
  return loadAthletes();
}

export async function setActiveTrainingPlan(athleteId: string, planId: string): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const existing = a.trainingPlans ?? (a.trainingPlan ? [a.trainingPlan] : []);
  const activePlan = existing.find((p) => p.id === planId);
  if (!activePlan) throw new Error("Plan not found");
  const plans = existing.map((p) => ({ ...p, isActive: p.id === planId }));
  await writeTrainingPlans(athleteId, plans, activePlan);
  return loadAthletes();
}

export async function setActiveMealPlan(athleteId: string, planId: string): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const existing = a.mealPlans ?? [];
  if (!existing.some((p) => p.id === planId)) throw new Error("Plan not found");
  const plans = existing.map((p) => ({ ...p, isActive: p.id === planId }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { meal_plans: plans, updated_at: new Date().toISOString() },
  }));
  return rows.map(rowToAthlete);
}

export async function saveSupplementPlanEntry(athleteId: string, plan: SupplementPlan): Promise<Athlete[]> {
  SupplementPlanSchema.parse(plan);
  const a = await getAthlete(athleteId);
  const existing = a.supplementPlans ?? (a.supplementPlan ? [a.supplementPlan] : []);
  const newPlan = { ...plan, isActive: true };
  const exists = existing.some((p) => p.id === plan.id);
  const plans = exists
    ? existing.map((p) => (p.id === plan.id ? newPlan : { ...p, isActive: false }))
    : [...existing.map((p) => ({ ...p, isActive: false })), newPlan];
  await writeSupplementPlans(athleteId, plans, newPlan);
  return loadAthletes();
}

export async function setActiveSupplementPlan(athleteId: string, planId: string): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const existing = a.supplementPlans ?? (a.supplementPlan ? [a.supplementPlan] : []);
  const activePlan = existing.find((p) => p.id === planId);
  if (!activePlan) throw new Error("Plan not found");
  const plans = existing.map((p) => ({ ...p, isActive: p.id === planId }));
  await writeSupplementPlans(athleteId, plans, activePlan);
  return loadAthletes();
}

export async function toggleMealPlanActive(athleteId: string, planId: string): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const existing = a.mealPlans ?? [];
  const plans = existing.map((p) => p.id === planId ? { ...p, isActive: !p.isActive } : p);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await api<any[]>(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { meal_plans: plans, updated_at: new Date().toISOString() },
  }));
  return rows.map(rowToAthlete);
}

export async function toggleTrainingPlanActive(athleteId: string, planId: string): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const existing = a.trainingPlans ?? (a.trainingPlan ? [a.trainingPlan] : []);
  const plans = existing.map((p) => p.id === planId ? { ...p, isActive: !p.isActive } : p);
  const legacyPlan = plans.find((p) => p.isActive) ?? plans[0];
  if (legacyPlan) await writeTrainingPlans(athleteId, plans, legacyPlan);
  return loadAthletes();
}

export async function toggleSupplementPlanActive(athleteId: string, planId: string): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const existing = a.supplementPlans ?? (a.supplementPlan ? [a.supplementPlan] : []);
  const plans = existing.map((p) => p.id === planId ? { ...p, isActive: !p.isActive } : p);
  const legacyPlan = plans.find((p) => p.isActive) ?? plans[0];
  if (legacyPlan) await writeSupplementPlans(athleteId, plans, legacyPlan);
  return loadAthletes();
}

export async function getExportContextData(athleteId: string): Promise<{
  exercises: ExerciseDBItem[];
  foods: FoodItem[];
  supplements: SupplementDBItem[];
}> {
  const [exercises, supplements, foods] = await Promise.all([
    loadExerciseDB(),
    loadSupplementDB(),
    getAllFoodItems(),
  ]);
  return { exercises, foods, supplements };
}

export function getExportContextText(
  athleteId: string,
  data: { exercises: ExerciseDBItem[]; foods: FoodItem[]; supplements: SupplementDBItem[] }
): string {
  const exerciseSummary = data.exercises.map((e) =>
    `${e.id} | ${e.name} | ${e.muscleGroup}${e.equipmentType ? ` | ${e.equipmentType}` : ""}${e.laterality ? ` | ${e.laterality}` : ""}`
  ).join("\n");

  const foodSummary = data.foods.map((f) =>
    `${f.id} | ${f.name} | ${f.kcalPer100g} kcal | P ${f.proteinPer100g} | K ${f.carbsPer100g} | F ${f.fatPer100g}`
  ).join("\n");

  const suppSummary = data.supplements.map((s) =>
    `${s.id} | ${s.name}${s.category ? ` | ${s.category}` : ""} | ${s.standardDosage}`
  ).join("\n");

  return [
    "=== TRAINING PLAN SCHEMA (JSON) ===",
    JSON.stringify({
      id: "string", athleteId: "string", title: "string", createdAt: "ISO-string",
      mode: "'weekday'|'flexible'", coachNote: "string?",
      schritteProTag: "number?", cardioMinuten: "number?", cardioFrequenz: "'woche'|'taeglich'?",
      days: [{
        id: "string", dayName: "string", label: "string", note: "string?", cardioNote: "string?",
        exercises: [{
          id: "string", name: "string", sets: "number", reps: "string (e.g. '8-12')",
          rir: "number?", rpe: "number?", restSeconds: "number?",
          note: "string?", videoUrl: "string?", muscleGroup: "string?",
          exerciseDbId: "string? (from exercises list)", exerciseDbNote: "string?",
          laterality: "'bilateral'|'unilateral'?",
        }],
      }],
    }, null, 2),
    "",
    "=== MEAL PLAN SCHEMA (JSON) ===",
    JSON.stringify({
      id: "string", athleteId: "string", title: "string", createdAt: "ISO-string",
      planType: "'fixed'|'macro_targets'",
      macroTargets: { kcal: "number", protein: "number", carbs: "number", fat: "number", fiber: "number?" },
      coachNote: "string?",
      meals: [{
        id: "string", name: "string", time: "HH:MM|null",
        entries: [{ foodItemId: "string (from foods list)", foodItem: { id: "string", name: "string", category: "string", kcalPer100g: "number", proteinPer100g: "number", carbsPer100g: "number", fatPer100g: "number", fiberPer100g: "number", saltPer100g: "number" }, amountG: "number" }],
      }],
    }, null, 2),
    "",
    "=== SUPPLEMENT PLAN SCHEMA (JSON) ===",
    JSON.stringify({
      id: "string", athleteId: "string", title: "string?", createdAt: "ISO-string?", coachNote: "string?",
      supplements: [{
        id: "string", name: "string", dosage: "string", timing: "string", instructions: "string",
        note: "string?", link: "string?", supplementDBId: "string? (from supplements list)",
      }],
    }, null, 2),
    "",
    `=== EXERCISE DATABASE (${data.exercises.length} entries) ===`,
    "Format: id | name | muscleGroup | equipmentType | laterality",
    exerciseSummary,
    "",
    `=== FOOD DATABASE (${data.foods.length} entries) ===`,
    "Format: id | name | kcal/100g | protein | carbs | fat",
    foodSummary,
    "",
    `=== SUPPLEMENT DATABASE (${data.supplements.length} entries) ===`,
    "Format: id | name | category | standardDosage",
    suppSummary,
    "",
    `athleteId to use: ${athleteId}`,
  ].join("\n");
}

export function getExercisesFromAthleteTrainingPlan(
  athlete: Athlete | undefined,
  allExercises: ExerciseDBItem[]
): ExerciseDBItem[] {
  const plan = athlete?.trainingPlan;
  if (!plan) return [];
  const seenIds = new Set<string>();
  const result: ExerciseDBItem[] = [];
  for (const day of plan.days) {
    for (const ex of day.exercises) {
      if (ex.exerciseDbId) {
        if (!seenIds.has(ex.exerciseDbId)) {
          const dbItem = allExercises.find((e) => e.id === ex.exerciseDbId);
          if (dbItem) { seenIds.add(ex.exerciseDbId); result.push(dbItem); }
        }
      } else {
        const key = `name:${ex.name.toLowerCase()}`;
        if (!seenIds.has(key)) {
          const dbItem = allExercises.find((e) => e.name.toLowerCase() === ex.name.toLowerCase());
          if (dbItem) { seenIds.add(key); result.push(dbItem); }
        }
      }
    }
  }
  return result.sort((a, b) => a.name.localeCompare(b.name, "de"));
}

// ─── Training: Exercise Reorder ───────────────────────────────────────────────

export async function reorderTrainingDayExercises(
  athleteId: string,
  planId: string,
  dayId: string,
  exerciseId: string,
  direction: "up" | "down"
): Promise<TrainingPlan> {
  const a = await getAthlete(athleteId);
  const allPlans = a.trainingPlans ?? (a.trainingPlan ? [a.trainingPlan] : []);
  const planIdx = allPlans.findIndex((p) => p.id === planId);
  if (planIdx === -1) throw new Error("Plan not found");

  const plan = allPlans[planIdx];
  const dayIdx = plan.days.findIndex((d) => d.id === dayId);
  if (dayIdx === -1) throw new Error("Day not found");

  const exercises = [...plan.days[dayIdx].exercises];
  const exIdx = exercises.findIndex((e) => e.id === exerciseId);
  if (exIdx === -1) throw new Error("Exercise not found");

  const swapWith = direction === "up" ? exIdx - 1 : exIdx + 1;
  if (swapWith < 0 || swapWith >= exercises.length) return plan;

  [exercises[exIdx], exercises[swapWith]] = [exercises[swapWith], exercises[exIdx]];

  const updatedPlan: TrainingPlan = {
    ...plan,
    days: plan.days.map((d, i) => (i === dayIdx ? { ...d, exercises } : d)),
  };
  const updatedPlans = allPlans.map((p) => (p.id === planId ? updatedPlan : p));
  const activePlan = updatedPlans.find((p) => p.isActive) ?? updatedPlan;

  await writeTrainingPlans(athleteId, updatedPlans, activePlan);
  return updatedPlan;
}

// ─── Training: Repeat Session ─────────────────────────────────────────────────

export function buildRepeatSession(
  athleteId: string,
  previousLog: TrainingLog,
  today: string
): ActiveSession {
  return {
    athleteId,
    date: today,
    trainingDayId: previousLog.trainingDayId,
    exercises: previousLog.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      laterality: ex.laterality,
      sets: ex.sets.map((s, i) => ({
        setNumber: i + 1,
        weight: s.weight,
        reps: s.reps,
        rir: null,
        weightLeft: s.weightLeft ?? null,
        repsLeft: s.repsLeft ?? null,
        weightRight: s.weightRight ?? null,
        repsRight: s.repsRight ?? null,
      })),
      note: ex.note,
      addedByAthlete: ex.addedByAthlete,
    })),
    note: "",
    trainingBewertung: 3,
    startedAt: new Date().toISOString(),
    pausedAt: null,
    totalPausedMs: 0,
  };
}

export function getLastTrainingLogPerExercise(logs: TrainingLog[]): Map<string, TrainingLog> {
  const result = new Map<string, TrainingLog>();
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  for (const log of sorted) {
    for (const ex of log.exercises) {
      result.set(ex.exerciseId, log);
    }
  }
  return result;
}

// ─── Check-In Done Status (sync / localStorage) ───────────────────────────────

export function loadCheckInDone(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(CHECK_IN_DONE_KEY);
    if (!stored) return {};
    const raw: Record<string, unknown> = JSON.parse(stored);
    const result: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === "string" && v) {
        result[k] = v;
      } else if (v === true) {
        const parts = k.split("_");
        result[k] = parts[parts.length - 1];
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function setCheckInDone(athleteId: string, date: string, done: boolean): Record<string, string> {
  const current = loadCheckInDone();
  const key = `${athleteId}_${date}`;
  const today = new Date().toISOString().slice(0, 10);
  const updated = { ...current };
  if (done) {
    updated[key] = today;
  } else {
    delete updated[key];
  }
  if (typeof window !== "undefined") {
    localStorage.setItem(CHECK_IN_DONE_KEY, JSON.stringify(updated));
  }
  return updated;
}

// ─── Athlete Card Status ───────────────────────────────────────────────────────

export type AthleteCardStatus =
  | "checkin-open"
  | "checkin-done-task-open"
  | "checkin-done"
  | "task-open"
  | "neutral";

export function getAthleteCardStatus(opts: {
  isCheckInDueToday: boolean;
  completedAt: string | undefined;
  hasPendingTasks: boolean;
  today: string;
}): AthleteCardStatus {
  const { isCheckInDueToday, completedAt, hasPendingTasks, today } = opts;
  const isCompletedToday = completedAt === today;
  if (isCheckInDueToday && !isCompletedToday) return "checkin-open";
  if (isCompletedToday && hasPendingTasks) return "checkin-done-task-open";
  if (isCompletedToday) return "checkin-done";
  if (hasPendingTasks) return "task-open";
  return "neutral";
}

// ─── Active Training Session (sync / localStorage) ────────────────────────────

export interface ActiveSession {
  athleteId: string;
  date: string;
  trainingDayId: string;
  exercises: TrainingExerciseLog[];
  note: string;
  trainingBewertung?: number;
  startedAt: string;
  pausedAt: string | null;
  totalPausedMs: number;
}

export function loadActiveSession(): ActiveSession | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return { ...parsed, pausedAt: parsed.pausedAt ?? null, totalPausedMs: parsed.totalPausedMs ?? 0 };
  } catch {
    return null;
  }
}

export function saveActiveSession(session: ActiveSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
}

export function clearActiveSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACTIVE_SESSION_KEY);
}

// ─── Maintenance Mode ─────────────────────────────────────────────────────────

export async function getMaintenanceMode(): Promise<MaintenanceMode | null> {
  return api<MaintenanceMode | null>("/api/maintenance");
}

export async function setMaintenanceMode(m: MaintenanceMode): Promise<void> {
  await api("/api/maintenance", jsonOpts("POST", m));
}

// ─── Onboarding Codes ─────────────────────────────────────────────────────────

export async function createOnboardingCode(code: string): Promise<OnboardingCode> {
  return api<OnboardingCode>("/api/onboarding-codes", jsonOpts("POST", { code }));
}

export async function validateOnboardingCode(code: string): Promise<boolean> {
  const result = await api<{ valid: boolean }>("/api/validate-onboarding-code", jsonOpts("POST", { code }));
  return result.valid;
}

export async function markAthleteSignupSeen(athleteId: string): Promise<void> {
  const a = await getAthlete(athleteId);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { __ns, ...rest } = (a.profile ?? {}) as Record<string, unknown>;
  const merged = Object.keys(rest).length ? rest : null;
  await api(`/api/athletes/${athleteId}`, jsonOpts("PATCH", {
    row: { profile: merged, updated_at: new Date().toISOString() },
  }));
}

export async function exportAthleteData(
  athleteId: string,
  from: string,
  to: string
): Promise<AthleteDataExport> {
  const [athlete, videoFeedbacks] = await Promise.all([
    getAthlete(athleteId),
    loadVideoFeedbacks(athleteId),
  ]);
  const inRange = (date: string) => date >= from && date <= to;
  return {
    meta: {
      athleteId: athlete.id,
      athleteName: athlete.name,
      from,
      to,
      exportedAt: new Date().toISOString(),
    },
    dailyCheckIns: (athlete.dailyCheckIns ?? []).filter((c) => inRange(c.date)),
    weeklyCheckIns: (athlete.weeklyCheckIns ?? []).filter((c) => inRange(c.date)),
    trainingLogs: (athlete.trainingLogs ?? []).filter((l) => inRange(l.date)),
    calorieTrackerDays: (athlete.calorieTrackerDays ?? []).filter((d) => inRange(d.date)),
    weeklyAdjustments: (athlete.weeklyAdjustments ?? []).filter((w) => inRange(w.weekStart)),
    notes: (athlete.notes ?? []).filter((n) => inRange(n.createdAt.slice(0, 10))),
    videoFeedbacks: videoFeedbacks.filter((v) => inRange(v.date)),
    snapshot: {
      profile: athlete.profile,
      legalConsent: athlete.legalConsent,
      startWeight: athlete.startWeight,
      currentWeight: athlete.currentWeight,
      targetWeight: athlete.targetWeight,
      goalType: athlete.goalType,
      goalText: athlete.goalText,
      checkInDay: athlete.checkInDay,
      startDate: athlete.startDate,
      competitionDate: athlete.competitionDate,
      zielBeschreibung: athlete.zielBeschreibung,
      experienceLevel: athlete.experienceLevel,
      trainingHistory: athlete.trainingHistory,
      injuries: athlete.injuries,
      specialNotes: athlete.specialNotes,
      coachNote: athlete.coachNote,
      visibleNote: athlete.visibleNote,
      joinedAt: athlete.joinedAt,
      trainingPlan: athlete.trainingPlan,
      trainingPlans: athlete.trainingPlans ?? (athlete.trainingPlan ? [athlete.trainingPlan] : []),
      mealPlans: athlete.mealPlans ?? [],
      supplementPlan: athlete.supplementPlan,
      supplementPlans: athlete.supplementPlans ?? (athlete.supplementPlan ? [athlete.supplementPlan] : []),
      dailyCheckConfig: athlete.dailyCheckConfig,
      weeklyCheckConfig: athlete.weeklyCheckConfig,
    },
  };
}

export async function exportAthleteQuestionnaireData(athleteId: string): Promise<object> {
  const athlete = await getAthlete(athleteId);
  const p = athlete.profile ?? {};
  return {
    meta: {
      athleteId: athlete.id,
      name: athlete.name,
      email: athlete.email ?? p.personal?.email,
      joinedAt: athlete.joinedAt,
      startDate: athlete.startDate,
    },
    basics: {
      startWeight: athlete.startWeight,
      currentWeight: athlete.currentWeight,
      targetWeight: athlete.targetWeight,
      goalType: athlete.goalType,
      goalText: athlete.goalText,
      checkInDay: athlete.checkInDay,
      experienceLevel: athlete.experienceLevel,
      injuries: athlete.injuries,
      trainingHistory: athlete.trainingHistory,
      specialNotes: athlete.specialNotes,
    },
    personal: p.personal ?? null,
    body: p.body ?? null,
    lifestyle: p.lifestyle ?? null,
    recovery: p.recovery ?? null,
    health: p.health ?? null,
    nutrition: p.nutrition ?? null,
    foodPreferences: p.foodPreferences ?? null,
    supplements: p.supplements ?? null,
    training: p.training ?? null,
    availability: p.availability ?? null,
    goals: p.goals ?? null,
    coachingPreferences: p.coachingPreferences ?? null,
    finalNotes: p.finalNotes ?? null,
  };
}
