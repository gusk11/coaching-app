"use client";
import { supabase } from "@/lib/supabase";
import { athletes as initialAthletes } from "@/data/athletes";
import { foodItems as baseFoodItems } from "@/data/foodItems";
import { seedCustomFoods } from "@/data/seedCustomFoods";
import { seedSupplementDB } from "@/data/seedSupplements";
import { seedExerciseDB } from "@/data/seedExercises";
import {
  Athlete, AthleteProfile, LegalConsent, DailyCheckIn, WeeklyCheckIn,
  WeeklyAdjustment, TrainingLog, TrainingExerciseLog, CalorieTrackerDay,
  FoodItem, SupplementDBItem, ExerciseDBItem, GoalType,
  DEFAULT_DAILY_CHECK_CONFIG, LoginHelpRequest,
} from "@/types";

const AUTH_KEY = "coachOS_auth";
const CHECK_IN_DONE_KEY = "coachOS_checkInDone";
const ACTIVE_SESSION_KEY = "coachOS_activeSession";

// ─── Row Mappers ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToAthlete(row: any): Athlete {
  // legalConsent is embedded in profile JSONB under __lc to avoid an extra column
  const rawProfile = row.profile ?? undefined;
  const legalConsent: LegalConsent | undefined = rawProfile?.__lc ?? undefined;
  let profile: AthleteProfile | undefined;
  if (rawProfile) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { __lc, ...rest } = rawProfile;
    profile = Object.keys(rest).length ? (rest as AthleteProfile) : undefined;
  }
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? undefined,
    pin: row.pin,
    avatarInitials: row.avatar_initials ?? "",
    onboardingCompleted: row.onboarding_completed ?? false,
    legalConsent,
    profile,
    profileImage: row.profile_image ?? undefined,
    startWeight: row.start_weight ?? 0,
    currentWeight: row.current_weight ?? 0,
    targetWeight: row.target_weight ?? 0,
    goalType: row.goal_type ?? "maintenance",
    goalText: row.goal_text ?? undefined,
    checkInDay: row.check_in_day ?? 1,
    height: row.height ?? undefined,
    startDate: row.start_date ?? undefined,
    competitionDate: row.competition_date ?? undefined,
    experienceLevel: row.experience_level ?? undefined,
    trainingHistory: row.training_history ?? undefined,
    injuries: row.injuries ?? undefined,
    specialNotes: row.special_notes ?? undefined,
    trackingDevice: row.tracking_device ?? undefined,
    trackingDeviceCustom: row.tracking_device_custom ?? undefined,
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
    supplementPlan: row.supplement_plan ?? undefined,
    notes: row.notes ?? [],
    joinedAt: row.joined_at ?? new Date().toISOString().split("T")[0],
    weeklyTrendTargetPercent: row.weekly_trend_target_percent ?? undefined,
  };
}

function athleteToRow(a: Athlete): Record<string, unknown> {
  // Embed legalConsent in profile JSONB under __lc
  const profileWithLegal = a.legalConsent
    ? { ...(a.profile ?? {}), __lc: a.legalConsent }
    : (a.profile ?? null);
  return {
    id: a.id,
    name: a.name,
    email: a.email ?? null,
    pin: a.pin,
    avatar_initials: a.avatarInitials ?? null,
    onboarding_completed: a.onboardingCompleted ?? false,
    profile: profileWithLegal,
    profile_image: a.profileImage ?? null,
    start_weight: a.startWeight ?? null,
    current_weight: a.currentWeight ?? null,
    target_weight: a.targetWeight ?? null,
    goal_type: a.goalType ?? null,
    goal_text: a.goalText ?? null,
    check_in_day: a.checkInDay ?? 1,
    height: a.height ?? null,
    start_date: a.startDate ?? null,
    competition_date: a.competitionDate ?? null,
    experience_level: a.experienceLevel ?? null,
    training_history: a.trainingHistory ?? null,
    injuries: a.injuries ?? null,
    special_notes: a.specialNotes ?? null,
    tracking_device: a.trackingDevice ?? null,
    tracking_device_custom: a.trackingDeviceCustom ?? null,
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
    isCustomFood: true,
    isActive: row.is_active ?? true,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

function foodItemToRow(f: FoodItem): Record<string, unknown> {
  return {
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
    equipment: row.equipment ?? undefined,
    notes: row.notes ?? undefined,
    executionLink: row.execution_link ?? undefined,
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

// ─── Athletes ─────────────────────────────────────────────────────────────────

export async function loadAthletes(): Promise<Athlete[]> {
  const { data, error } = await supabase.from("athletes").select("*").order("name");
  if (error) throw error;
  if (!data || data.length === 0) {
    const rows = initialAthletes.map(athleteToRow);
    const { error: seedError } = await supabase.from("athletes").insert(rows);
    if (seedError) console.error("Seed athletes error:", seedError);
    return initialAthletes;
  }
  return data.map(rowToAthlete);
}

export async function addAthlete(athlete: Athlete): Promise<Athlete[]> {
  const { error } = await supabase.from("athletes").insert(athleteToRow(athlete));
  if (error) throw error;
  return loadAthletes();
}

export async function updateAthlete(id: string, updates: Partial<Athlete>): Promise<Athlete[]> {
  const row: Record<string, unknown> = {};
  if ("name" in updates) row.name = updates.name;
  if ("email" in updates) row.email = updates.email ?? null;
  if ("pin" in updates) row.pin = updates.pin;
  if ("avatarInitials" in updates) row.avatar_initials = updates.avatarInitials ?? null;
  if ("onboardingCompleted" in updates) row.onboarding_completed = updates.onboardingCompleted;
  if ("legalConsent" in updates || "profile" in updates) {
    // Merge legalConsent back into profile JSONB
    const p = updates.profile ?? undefined;
    const lc = updates.legalConsent ?? undefined;
    row.profile = lc ? { ...(p ?? {}), __lc: lc } : (p ?? null);
  }
  if ("profileImage" in updates) row.profile_image = updates.profileImage ?? null;
  if ("startWeight" in updates) row.start_weight = updates.startWeight ?? null;
  if ("currentWeight" in updates) row.current_weight = updates.currentWeight ?? null;
  if ("targetWeight" in updates) row.target_weight = updates.targetWeight ?? null;
  if ("goalType" in updates) row.goal_type = updates.goalType ?? null;
  if ("goalText" in updates) row.goal_text = updates.goalText ?? null;
  if ("checkInDay" in updates) row.check_in_day = updates.checkInDay;
  if ("height" in updates) row.height = updates.height ?? null;
  if ("startDate" in updates) row.start_date = updates.startDate ?? null;
  if ("competitionDate" in updates) row.competition_date = updates.competitionDate ?? null;
  if ("experienceLevel" in updates) row.experience_level = updates.experienceLevel ?? null;
  if ("trainingHistory" in updates) row.training_history = updates.trainingHistory ?? null;
  if ("injuries" in updates) row.injuries = updates.injuries ?? null;
  if ("specialNotes" in updates) row.special_notes = updates.specialNotes ?? null;
  if ("trackingDevice" in updates) row.tracking_device = updates.trackingDevice ?? null;
  if ("trackingDeviceCustom" in updates) row.tracking_device_custom = updates.trackingDeviceCustom ?? null;
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
  row.updated_at = new Date().toISOString();
  const { error } = await supabase.from("athletes").update(row).eq("id", id);
  if (error) throw error;
  return loadAthletes();
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
  height?: number;
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
}

export async function registerAthlete(data: RegistrationData): Promise<Athlete> {
  const { data: existing, error: checkError } = await supabase
    .from("athletes")
    .select("id")
    .ilike("email", data.email.trim());
  if (checkError) throw checkError;
  if (existing && existing.length > 0) throw new Error("E-Mail-Adresse bereits registriert.");

  const today = new Date().toISOString().split("T")[0];
  const weight = data.currentWeight ?? 0;
  const newAthlete: Athlete = {
    id: `athlete-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: data.name.trim(),
    email: data.email.toLowerCase().trim(),
    pin: data.pin,
    avatarInitials: getInitials(data.name),
    onboardingCompleted: true,
    legalConsent: data.legalConsent,
    profile: { ...data.profile, personal: { email: data.email.toLowerCase().trim(), birthDate: data.birthDate } },
    startWeight: weight,
    currentWeight: weight,
    targetWeight: data.targetWeight ?? weight,
    goalType: deriveGoalType(data.goalPriorities ?? []),
    goalText: data.goalText,
    checkInDay: data.checkInDay ?? 1,
    height: data.height,
    experienceLevel: (data.experienceLevel as Athlete["experienceLevel"]) ?? undefined,
    injuries: data.injuries,
    trainingHistory: data.trainingHistory,
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
  const { error } = await supabase.from("athletes").insert(athleteToRow(newAthlete));
  if (error) throw error;
  return newAthlete;
}

function normalizeLoginName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "");
}

export async function findAthleteByLogin(nameOrEmail: string, pin: string): Promise<Athlete | null> {
  const { data, error } = await supabase.from("athletes").select("*");
  if (error) throw error;
  if (!data) return null;
  const key = nameOrEmail.trim().toLowerCase();
  const keyNorm = normalizeLoginName(nameOrEmail);
  return data.map(rowToAthlete).find((a) => {
    const emailMatch = (a.email || a.profile?.personal?.email || "").toLowerCase() === key;
    const nameMatch = normalizeLoginName(a.name) === keyNorm;
    return (emailMatch || nameMatch) && a.pin === pin;
  }) ?? null;
}

export async function updateAthleteCredentials(
  athleteId: string,
  updates: { name?: string; email?: string; pin?: string }
): Promise<Athlete[]> {
  const { data, error: fetchError } = await supabase
    .from("athletes").select("*").eq("id", athleteId).single();
  if (fetchError) throw fetchError;
  const current = rowToAthlete(data);
  const newName = updates.name?.trim() ?? current.name;
  const newEmail = updates.email?.toLowerCase().trim() ?? current.email ?? "";
  const newPin = updates.pin?.trim() ?? current.pin;
  const newInitials = newName.split(/\s+/).map((w) => w[0]?.toUpperCase() ?? "").slice(0, 2).join("");
  const updatedProfile = current.profile
    ? { ...current.profile, personal: { ...current.profile.personal, email: newEmail || undefined } }
    : undefined;
  const profileWithLegal = current.legalConsent
    ? { ...(updatedProfile ?? {}), __lc: current.legalConsent }
    : (updatedProfile ?? null);
  const { error } = await supabase.from("athletes").update({
    name: newName,
    email: newEmail || null,
    pin: newPin,
    avatar_initials: updates.name ? newInitials : current.avatarInitials,
    profile: profileWithLegal,
    updated_at: new Date().toISOString(),
  }).eq("id", athleteId);
  if (error) throw error;
  return loadAthletes();
}

// ─── JSONB array mutation helpers ─────────────────────────────────────────────

async function getAthlete(id: string): Promise<Athlete> {
  const { data, error } = await supabase.from("athletes").select("*").eq("id", id).single();
  if (error) throw error;
  return rowToAthlete(data);
}

export async function addDailyCheckIn(
  athleteId: string,
  checkIn: Omit<DailyCheckIn, "id" | "athleteId">
): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const newCheckIn: DailyCheckIn = { ...checkIn, id: `dc-${athleteId}-${Date.now()}`, athleteId };
  const filtered = a.dailyCheckIns.filter((c) => c.date !== checkIn.date);
  const daily_check_ins = [...filtered, newCheckIn].sort((x, y) => x.date.localeCompare(y.date));
  const { error } = await supabase.from("athletes")
    .update({ daily_check_ins, current_weight: checkIn.weight, updated_at: new Date().toISOString() })
    .eq("id", athleteId);
  if (error) throw error;
  return loadAthletes();
}

export async function addWeeklyCheckIn(
  athleteId: string,
  checkIn: Omit<WeeklyCheckIn, "id" | "athleteId">
): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const newCheckIn: WeeklyCheckIn = { ...checkIn, id: `wc-${athleteId}-${Date.now()}`, athleteId };
  const filtered = a.weeklyCheckIns.filter((c) => c.weekStart !== checkIn.weekStart);
  const weekly_check_ins = [...filtered, newCheckIn];
  const { error } = await supabase.from("athletes")
    .update({ weekly_check_ins, updated_at: new Date().toISOString() })
    .eq("id", athleteId);
  if (error) throw error;
  return loadAthletes();
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
  const { error } = await supabase.from("athletes")
    .update({ weekly_adjustments, updated_at: new Date().toISOString() })
    .eq("id", athleteId);
  if (error) throw error;
  return loadAthletes();
}

export async function deleteWeeklyAdjustment(athleteId: string, adjId: string): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const weekly_adjustments = (a.weeklyAdjustments ?? []).filter((w) => w.id !== adjId);
  const { error } = await supabase.from("athletes")
    .update({ weekly_adjustments, updated_at: new Date().toISOString() })
    .eq("id", athleteId);
  if (error) throw error;
  return loadAthletes();
}

export async function saveCalorieTrackerDay(
  athleteId: string,
  day: Omit<CalorieTrackerDay, "id" | "athleteId">
): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const newDay: CalorieTrackerDay = { ...day, id: `ct-${athleteId}-${day.date}`, athleteId };
  const filtered = (a.calorieTrackerDays ?? []).filter((d) => d.date !== day.date);
  const calorie_tracker_days = [...filtered, newDay].sort((x, y) => x.date.localeCompare(y.date));
  const { error } = await supabase.from("athletes")
    .update({ calorie_tracker_days, updated_at: new Date().toISOString() })
    .eq("id", athleteId);
  if (error) throw error;
  return loadAthletes();
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
  const { error } = await supabase.from("athletes")
    .update({ training_logs, updated_at: new Date().toISOString() })
    .eq("id", athleteId);
  if (error) throw error;
  return loadAthletes();
}

export async function deleteTrainingLog(athleteId: string, logId: string): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const training_logs = (a.trainingLogs ?? []).filter((l) => l.id !== logId);
  const { error } = await supabase.from("athletes")
    .update({ training_logs, updated_at: new Date().toISOString() })
    .eq("id", athleteId);
  if (error) throw error;
  return loadAthletes();
}

export async function updateTrainingLog(athleteId: string, log: TrainingLog): Promise<Athlete[]> {
  const a = await getAthlete(athleteId);
  const training_logs = (a.trainingLogs ?? [])
    .map((l) => l.id === log.id ? log : l)
    .sort((x, y) => x.date.localeCompare(y.date));
  const { error } = await supabase.from("athletes")
    .update({ training_logs, updated_at: new Date().toISOString() })
    .eq("id", athleteId);
  if (error) throw error;
  return loadAthletes();
}

// ─── Food Database ────────────────────────────────────────────────────────────

export async function loadCustomFoods(): Promise<FoodItem[]> {
  const { data, error } = await supabase.from("custom_foods").select("*").order("name");
  if (error) throw error;
  if (!data || data.length === 0) {
    const rows = seedCustomFoods.map(foodItemToRow);
    const { error: seedError } = await supabase.from("custom_foods").insert(rows);
    if (seedError) console.error("Seed custom foods error:", seedError);
    return seedCustomFoods;
  }
  return data.map(rowToFoodItem);
}

export async function loadDeactivatedFoods(): Promise<string[]> {
  const { data, error } = await supabase.from("deactivated_foods").select("food_id");
  if (error) throw error;
  return (data ?? []).map((row: { food_id: string }) => row.food_id);
}

export async function getAllFoodItems(): Promise<FoodItem[]> {
  const [deactivated, custom] = await Promise.all([loadDeactivatedFoods(), loadCustomFoods()]);
  const base = baseFoodItems.map((f) => ({ ...f, isActive: !deactivated.includes(f.id) }));
  return [...base, ...custom.filter((f) => f.isActive !== false)];
}

export async function addCustomFood(
  food: Omit<FoodItem, "id" | "isCustomFood" | "createdAt" | "updatedAt">
): Promise<FoodItem[]> {
  const newFood: FoodItem = {
    ...food,
    id: `cf-${Date.now()}`,
    isCustomFood: true,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  const { error } = await supabase.from("custom_foods").insert(foodItemToRow(newFood));
  if (error) throw error;
  return loadCustomFoods();
}

export async function updateCustomFood(id: string, updates: Partial<FoodItem>): Promise<FoodItem[]> {
  const row: Record<string, unknown> = {};
  if ("name" in updates) row.name = updates.name;
  if ("category" in updates) row.category = updates.category ?? null;
  if ("kcalPer100g" in updates) row.kcal_per_100g = updates.kcalPer100g ?? null;
  if ("proteinPer100g" in updates) row.protein_per_100g = updates.proteinPer100g ?? null;
  if ("carbsPer100g" in updates) row.carbs_per_100g = updates.carbsPer100g ?? null;
  if ("fatPer100g" in updates) row.fat_per_100g = updates.fatPer100g ?? null;
  if ("fiberPer100g" in updates) row.fiber_per_100g = updates.fiberPer100g ?? null;
  if ("saltPer100g" in updates) row.salt_per_100g = updates.saltPer100g ?? null;
  if ("defaultAmount" in updates) row.default_amount = updates.defaultAmount ?? null;
  if ("defaultAmountUnit" in updates) row.default_amount_unit = updates.defaultAmountUnit ?? null;
  if ("servingLabel" in updates) row.serving_label = updates.servingLabel ?? null;
  if ("notes" in updates) row.notes = updates.notes ?? null;
  if ("isActive" in updates) row.is_active = updates.isActive;
  row.updated_at = new Date().toISOString();
  const { error } = await supabase.from("custom_foods").update(row).eq("id", id);
  if (error) throw error;
  return loadCustomFoods();
}

export async function deleteCustomFood(id: string): Promise<FoodItem[]> {
  const { error } = await supabase.from("custom_foods").delete().eq("id", id);
  if (error) throw error;
  return loadCustomFoods();
}

export async function deleteBaseFoodItem(id: string): Promise<string[]> {
  const hidden = await loadDeactivatedFoods();
  if (hidden.includes(id)) return hidden;
  const { error } = await supabase.from("deactivated_foods").insert({ food_id: id });
  if (error) throw error;
  return [...hidden, id];
}

export async function toggleFoodActive(
  id: string,
  isCustom: boolean
): Promise<{ deactivated: string[]; customFoods: FoodItem[] }> {
  if (isCustom) {
    const { data, error: fetchError } = await supabase
      .from("custom_foods").select("is_active").eq("id", id).single();
    if (fetchError) throw fetchError;
    const newActive = !(data?.is_active ?? true);
    const { error } = await supabase.from("custom_foods")
      .update({ is_active: newActive, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  } else {
    const hidden = await loadDeactivatedFoods();
    if (hidden.includes(id)) {
      const { error } = await supabase.from("deactivated_foods").delete().eq("food_id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("deactivated_foods").insert({ food_id: id });
      if (error) throw error;
    }
  }
  const [deactivated, customFoods] = await Promise.all([loadDeactivatedFoods(), loadCustomFoods()]);
  return { deactivated, customFoods };
}

// ─── Supplement Database ──────────────────────────────────────────────────────

export async function loadSupplementDB(): Promise<SupplementDBItem[]> {
  const { data, error } = await supabase.from("supplement_db").select("*").order("name");
  if (error) throw error;
  if (!data || data.length === 0) {
    const rows = seedSupplementDB.map((s) => ({
      id: s.id, name: s.name, category: s.category ?? null,
      standard_dosage: s.standardDosage ?? null, timing: s.timing ?? null,
      instructions: s.instructions ?? null, notes: s.notes ?? null, link: s.link ?? null,
    }));
    const { error: seedError } = await supabase.from("supplement_db").insert(rows);
    if (seedError) console.error("Seed supplement_db error:", seedError);
    return seedSupplementDB;
  }
  return data.map(rowToSupplement);
}

export async function addSupplementDBItem(
  item: Omit<SupplementDBItem, "id" | "createdAt" | "updatedAt">
): Promise<SupplementDBItem[]> {
  const { error } = await supabase.from("supplement_db").insert({
    id: `supp-${Date.now()}`, name: item.name, category: item.category ?? null,
    standard_dosage: item.standardDosage ?? null, timing: item.timing ?? null,
    instructions: item.instructions ?? null, notes: item.notes ?? null, link: item.link ?? null,
  });
  if (error) throw error;
  return loadSupplementDB();
}

export async function updateSupplementDBItem(
  id: string,
  updates: Partial<SupplementDBItem>
): Promise<SupplementDBItem[]> {
  const row: Record<string, unknown> = {};
  if ("name" in updates) row.name = updates.name;
  if ("category" in updates) row.category = updates.category ?? null;
  if ("standardDosage" in updates) row.standard_dosage = updates.standardDosage ?? null;
  if ("timing" in updates) row.timing = updates.timing ?? null;
  if ("instructions" in updates) row.instructions = updates.instructions ?? null;
  if ("notes" in updates) row.notes = updates.notes ?? null;
  if ("link" in updates) row.link = updates.link ?? null;
  row.updated_at = new Date().toISOString();
  const { error } = await supabase.from("supplement_db").update(row).eq("id", id);
  if (error) throw error;
  return loadSupplementDB();
}

export async function deleteSupplementDBItem(id: string): Promise<SupplementDBItem[]> {
  const { error } = await supabase.from("supplement_db").delete().eq("id", id);
  if (error) throw error;
  return loadSupplementDB();
}

// ─── Exercise Database ────────────────────────────────────────────────────────

export async function loadExerciseDB(): Promise<ExerciseDBItem[]> {
  const { data, error } = await supabase.from("exercise_db").select("*").order("name");
  if (error) throw error;
  if (!data || data.length === 0) {
    const rows = seedExerciseDB.map((e) => ({
      id: e.id, name: e.name, muscle_group: e.muscleGroup ?? null,
      equipment: e.equipment ?? null, notes: e.notes ?? null, execution_link: e.executionLink ?? null,
    }));
    const { error: seedError } = await supabase.from("exercise_db").insert(rows);
    if (seedError) console.error("Seed exercise_db error:", seedError);
    return seedExerciseDB;
  }
  return data.map(rowToExercise);
}

export async function addExerciseDBItem(
  item: Omit<ExerciseDBItem, "id" | "createdAt" | "updatedAt">
): Promise<ExerciseDBItem[]> {
  const { error } = await supabase.from("exercise_db").insert({
    id: `ex-${Date.now()}`, name: item.name, muscle_group: item.muscleGroup ?? null,
    equipment: item.equipment ?? null, notes: item.notes ?? null, execution_link: item.executionLink ?? null,
  });
  if (error) throw error;
  return loadExerciseDB();
}

export async function updateExerciseDBItem(
  id: string,
  updates: Partial<ExerciseDBItem>
): Promise<ExerciseDBItem[]> {
  const row: Record<string, unknown> = {};
  if ("name" in updates) row.name = updates.name;
  if ("muscleGroup" in updates) row.muscle_group = updates.muscleGroup ?? null;
  if ("equipment" in updates) row.equipment = updates.equipment ?? null;
  if ("notes" in updates) row.notes = updates.notes ?? null;
  if ("executionLink" in updates) row.execution_link = updates.executionLink ?? null;
  row.updated_at = new Date().toISOString();
  const { error } = await supabase.from("exercise_db").update(row).eq("id", id);
  if (error) throw error;
  return loadExerciseDB();
}

export async function deleteExerciseDBItem(id: string): Promise<ExerciseDBItem[]> {
  const { error } = await supabase.from("exercise_db").delete().eq("id", id);
  if (error) throw error;
  return loadExerciseDB();
}

// ─── Login Help Requests ──────────────────────────────────────────────────────

export async function loadLoginHelpRequests(): Promise<LoginHelpRequest[]> {
  const { data, error } = await supabase
    .from("login_help_requests")
    .select("*")
    .order("requested_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToLoginHelpRequest);
}

export async function addLoginHelpRequest(enteredName: string, note?: string): Promise<LoginHelpRequest[]> {
  const { error } = await supabase.from("login_help_requests").insert({
    id: `lhr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    entered_name: enteredName.trim(),
    note: note?.trim() || null,
    status: "open",
  });
  if (error) throw error;
  return loadLoginHelpRequests();
}

export async function resolveLoginHelpRequest(id: string): Promise<LoginHelpRequest[]> {
  const { error } = await supabase
    .from("login_help_requests").update({ status: "resolved" }).eq("id", id);
  if (error) throw error;
  return loadLoginHelpRequests();
}

export async function deleteLoginHelpRequest(id: string): Promise<LoginHelpRequest[]> {
  const { error } = await supabase.from("login_help_requests").delete().eq("id", id);
  if (error) throw error;
  return loadLoginHelpRequests();
}

// ─── Check-In Done Status (sync / localStorage) ───────────────────────────────

export function loadCheckInDone(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(CHECK_IN_DONE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function setCheckInDone(athleteId: string, date: string, done: boolean): Record<string, boolean> {
  const current = loadCheckInDone();
  const key = `${athleteId}_${date}`;
  const updated = { ...current, [key]: done };
  if (typeof window !== "undefined") {
    localStorage.setItem(CHECK_IN_DONE_KEY, JSON.stringify(updated));
  }
  return updated;
}

// ─── Active Training Session (sync / localStorage) ────────────────────────────

export interface ActiveSession {
  athleteId: string;
  date: string;
  trainingDayId: string;
  exercises: TrainingExerciseLog[];
  note: string;
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
