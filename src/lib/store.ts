"use client";
import { athletes as initialAthletes } from "@/data/athletes";
import { foodItems as baseFoodItems } from "@/data/foodItems";
import { seedCustomFoods } from "@/data/seedCustomFoods";
import { seedSupplementDB } from "@/data/seedSupplements";
import { seedExerciseDB } from "@/data/seedExercises";
import { Athlete, AthleteProfile, DailyCheckIn, WeeklyCheckIn, WeeklyAdjustment, TrainingLog, TrainingExerciseLog, CalorieTrackerDay, FoodItem, SupplementDBItem, ExerciseDBItem, GoalType, DEFAULT_DAILY_CHECK_CONFIG, LoginHelpRequest } from "@/types";
import { todayISO } from "./utils";

const STORAGE_KEY = "coachOS_athletes";
const AUTH_KEY = "coachOS_auth";
const CUSTOM_FOODS_KEY = "coachOS_customFoods";
const DEACTIVATED_FOODS_KEY = "coachOS_deactivatedFoods";
const SUPPLEMENT_DB_KEY = "coachOS_supplementDB";
const EXERCISE_DB_KEY = "coachOS_exerciseDB";
const CHECK_IN_DONE_KEY = "coachOS_checkInDone";
const ACTIVE_SESSION_KEY = "coachOS_activeSession";
const SEED_VERSION_KEY = "coachOS_seedVersion";
// Bump this string whenever seed data changes to force a localStorage reset.
const SEED_VERSION = "2026-05-30-v2";

const FOOD_SEED_VERSION_KEY = "coachOS_foodSeedVersion";
// Bump when foodItems.ts seed data changes to clear custom/deactivated food state.
const FOOD_SEED_VERSION = "2026-05-30-v2";

const SUPPLEMENT_SEED_VERSION_KEY = "coachOS_supplementSeedVersion";
const SUPPLEMENT_SEED_VERSION = "2026-05-30-v1";

const EXERCISE_SEED_VERSION_KEY = "coachOS_exerciseSeedVersion";
const EXERCISE_SEED_VERSION = "2026-05-30-v1";

export function loadAthletes(): Athlete[] {
  if (typeof window === "undefined") return initialAthletes;
  try {
    // Auto-reset if seed data has been updated
    if (localStorage.getItem(SEED_VERSION_KEY) !== SEED_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    const athletes: Athlete[] = stored ? JSON.parse(stored) : initialAthletes;
    // Migrate legacy singular mealPlan → mealPlans[]
    return athletes.map((a) => {
      if (!a.mealPlans?.length && a.mealPlan) {
        return { ...a, mealPlans: [a.mealPlan] };
      }
      return a;
    });
  } catch {
    return initialAthletes;
  }
}

export function saveAthletes(athletes: Athlete[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(athletes));
}

export function addDailyCheckIn(
  athleteId: string,
  checkIn: Omit<DailyCheckIn, "id" | "athleteId">
): Athlete[] {
  const athletes = loadAthletes();
  const updated = athletes.map((a) => {
    if (a.id !== athleteId) return a;
    const newCheckIn: DailyCheckIn = {
      ...checkIn,
      id: `dc-${athleteId}-${Date.now()}`,
      athleteId,
    };
    const filtered = a.dailyCheckIns.filter((c) => c.date !== checkIn.date);
    return {
      ...a,
      currentWeight: checkIn.weight,
      dailyCheckIns: [...filtered, newCheckIn].sort((x, y) =>
        x.date.localeCompare(y.date)
      ),
    };
  });
  saveAthletes(updated);
  return updated;
}

export function addWeeklyCheckIn(
  athleteId: string,
  checkIn: Omit<WeeklyCheckIn, "id" | "athleteId">
): Athlete[] {
  const athletes = loadAthletes();
  const updated = athletes.map((a) => {
    if (a.id !== athleteId) return a;
    const newCheckIn: WeeklyCheckIn = {
      ...checkIn,
      id: `wc-${athleteId}-${Date.now()}`,
      athleteId,
    };
    const filtered = a.weeklyCheckIns.filter(
      (c) => c.weekStart !== checkIn.weekStart
    );
    return { ...a, weeklyCheckIns: [...filtered, newCheckIn] };
  });
  saveAthletes(updated);
  return updated;
}

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

export function updateAthlete(id: string, updates: Partial<Athlete>): Athlete[] {
  const athletes = loadAthletes();
  const updated = athletes.map((a) => (a.id === id ? { ...a, ...updates } : a));
  saveAthletes(updated);
  return updated;
}

export function addAthlete(athlete: Athlete): Athlete[] {
  const athletes = loadAthletes();
  const updated = [...athletes, athlete];
  saveAthletes(updated);
  return updated;
}

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
}

export function registerAthlete(data: RegistrationData): Athlete {
  const athletes = loadAthletes();
  const emailExists = athletes.some(
    (a) => (a.email || a.profile?.personal?.email || "").toLowerCase() === data.email.toLowerCase()
  );
  if (emailExists) throw new Error("E-Mail-Adresse bereits registriert.");

  const now = new Date().toISOString();
  const today = now.split("T")[0];
  const weight = data.currentWeight ?? 0;
  const newAthlete: Athlete = {
    id: `athlete-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: data.name.trim(),
    email: data.email.toLowerCase().trim(),
    pin: data.pin,
    avatarInitials: getInitials(data.name),
    onboardingCompleted: true,
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
  saveAthletes([...athletes, newAthlete]);
  return newAthlete;
}


function normalizeLoginName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "");
}

export function findAthleteByLogin(nameOrEmail: string, pin: string): Athlete | null {
  const athletes = loadAthletes();
  const key = nameOrEmail.trim().toLowerCase();
  const keyNorm = normalizeLoginName(nameOrEmail);
  return athletes.find((a) => {
    const emailMatch = (a.email || a.profile?.personal?.email || "").toLowerCase() === key;
    const nameMatch = normalizeLoginName(a.name) === keyNorm;
    return (emailMatch || nameMatch) && a.pin === pin;
  }) ?? null;
}

export function addWeeklyAdjustment(
  athleteId: string,
  adj: Omit<WeeklyAdjustment, "id" | "athleteId" | "createdAt">
): Athlete[] {
  const athletes = loadAthletes();
  const updated = athletes.map((a) => {
    if (a.id !== athleteId) return a;
    const newAdj: WeeklyAdjustment = {
      ...adj,
      id: `wa-${athleteId}-${Date.now()}`,
      athleteId,
      createdAt: new Date().toISOString(),
    };
    return { ...a, weeklyAdjustments: [...(a.weeklyAdjustments ?? []), newAdj] };
  });
  saveAthletes(updated);
  return updated;
}

export function deleteWeeklyAdjustment(athleteId: string, adjId: string): Athlete[] {
  const athletes = loadAthletes();
  const updated = athletes.map((a) =>
    a.id !== athleteId
      ? a
      : { ...a, weeklyAdjustments: (a.weeklyAdjustments ?? []).filter((w) => w.id !== adjId) }
  );
  saveAthletes(updated);
  return updated;
}

export function saveCalorieTrackerDay(
  athleteId: string,
  day: Omit<CalorieTrackerDay, "id" | "athleteId">
): Athlete[] {
  const athletes = loadAthletes();
  const updated = athletes.map((a) => {
    if (a.id !== athleteId) return a;
    const newDay: CalorieTrackerDay = {
      ...day,
      id: `ct-${athleteId}-${day.date}`,
      athleteId,
    };
    const filtered = (a.calorieTrackerDays ?? []).filter((d) => d.date !== day.date);
    return { ...a, calorieTrackerDays: [...filtered, newDay].sort((x, y) => x.date.localeCompare(y.date)) };
  });
  saveAthletes(updated);
  return updated;
}

export function saveTrainingLog(
  athleteId: string,
  log: Omit<TrainingLog, "id" | "athleteId">
): Athlete[] {
  const athletes = loadAthletes();
  const updated = athletes.map((a) => {
    if (a.id !== athleteId) return a;
    const newLog: TrainingLog = {
      ...log,
      id: `tl-${athleteId}-${Date.now()}`,
      athleteId,
    };
    const filtered = (a.trainingLogs ?? []).filter((l) => l.date !== log.date || l.trainingDayId !== log.trainingDayId);
    return { ...a, trainingLogs: [...filtered, newLog].sort((x, y) => x.date.localeCompare(y.date)) };
  });
  saveAthletes(updated);
  return updated;
}

export function deleteTrainingLog(athleteId: string, logId: string): Athlete[] {
  const athletes = loadAthletes();
  const updated = athletes.map((a) => {
    if (a.id !== athleteId) return a;
    return { ...a, trainingLogs: (a.trainingLogs ?? []).filter((l) => l.id !== logId) };
  });
  saveAthletes(updated);
  return updated;
}

export function updateTrainingLog(athleteId: string, log: TrainingLog): Athlete[] {
  const athletes = loadAthletes();
  const updated = athletes.map((a) => {
    if (a.id !== athleteId) return a;
    const logs = (a.trainingLogs ?? []).map((l) => l.id === log.id ? log : l);
    return { ...a, trainingLogs: logs.sort((x, y) => x.date.localeCompare(y.date)) };
  });
  saveAthletes(updated);
  return updated;
}

// ─── Food Database ────────────────────────────────────────────────────────────

export function loadCustomFoods(): FoodItem[] {
  if (typeof window === "undefined") return seedCustomFoods;
  try {
    if (localStorage.getItem(FOOD_SEED_VERSION_KEY) !== FOOD_SEED_VERSION) {
      localStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(seedCustomFoods));
      localStorage.removeItem(DEACTIVATED_FOODS_KEY);
      localStorage.setItem(FOOD_SEED_VERSION_KEY, FOOD_SEED_VERSION);
    }
    const stored = localStorage.getItem(CUSTOM_FOODS_KEY);
    return stored ? JSON.parse(stored) : seedCustomFoods;
  } catch {
    return seedCustomFoods;
  }
}

function saveCustomFoods(foods: FoodItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(foods));
}

export function loadDeactivatedFoods(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(DEACTIVATED_FOODS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveDeactivatedFoods(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEACTIVATED_FOODS_KEY, JSON.stringify(ids));
}

/** Returns all active food items: base items (minus deactivated) + custom items */
export function getAllFoodItems(): FoodItem[] {
  const deactivated = loadDeactivatedFoods();
  const custom = loadCustomFoods();
  const base = baseFoodItems
    .map((f) => ({ ...f, isActive: !deactivated.includes(f.id) }));
  return [...base, ...custom.filter((f) => f.isActive !== false)];
}

export function addCustomFood(
  food: Omit<FoodItem, "id" | "isCustomFood" | "createdAt" | "updatedAt">
): FoodItem[] {
  const foods = loadCustomFoods();
  const newFood: FoodItem = {
    ...food,
    id: `cf-${Date.now()}`,
    isCustomFood: true,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  const updated = [...foods, newFood];
  saveCustomFoods(updated);
  return updated;
}

export function updateCustomFood(id: string, updates: Partial<FoodItem>): FoodItem[] {
  const foods = loadCustomFoods();
  const updated = foods.map((f) =>
    f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
  );
  saveCustomFoods(updated);
  return updated;
}

export function deleteCustomFood(id: string): FoodItem[] {
  const foods = loadCustomFoods();
  const updated = foods.filter((f) => f.id !== id);
  saveCustomFoods(updated);
  return updated;
}

/** Toggle active/inactive for any food item (base or custom) */
export function toggleFoodActive(id: string, isCustom: boolean): { deactivated: string[]; customFoods: FoodItem[] } {
  if (isCustom) {
    const foods = loadCustomFoods();
    const food = foods.find((f) => f.id === id);
    const newActive = food ? food.isActive === false : false; // flip
    const updated = foods.map((f) =>
      f.id === id ? { ...f, isActive: newActive, updatedAt: new Date().toISOString() } : f
    );
    saveCustomFoods(updated);
    return { deactivated: loadDeactivatedFoods(), customFoods: updated };
  } else {
    const deactivated = loadDeactivatedFoods();
    const updated = deactivated.includes(id)
      ? deactivated.filter((d) => d !== id)
      : [...deactivated, id];
    saveDeactivatedFoods(updated);
    return { deactivated: updated, customFoods: loadCustomFoods() };
  }
}

/** Permanently hide a base food item (adds to the hidden/deactivated list without toggle) */
export function deleteBaseFoodItem(id: string): string[] {
  const hidden = loadDeactivatedFoods();
  if (hidden.includes(id)) return hidden;
  const updated = [...hidden, id];
  saveDeactivatedFoods(updated);
  return updated;
}

// ─── Supplement Database ──────────────────────────────────────────────────────

export function loadSupplementDB(): SupplementDBItem[] {
  if (typeof window === "undefined") return seedSupplementDB;
  try {
    if (localStorage.getItem(SUPPLEMENT_SEED_VERSION_KEY) !== SUPPLEMENT_SEED_VERSION) {
      localStorage.setItem(SUPPLEMENT_DB_KEY, JSON.stringify(seedSupplementDB));
      localStorage.setItem(SUPPLEMENT_SEED_VERSION_KEY, SUPPLEMENT_SEED_VERSION);
    }
    const stored = localStorage.getItem(SUPPLEMENT_DB_KEY);
    return stored ? JSON.parse(stored) : seedSupplementDB;
  } catch {
    return seedSupplementDB;
  }
}

function saveSupplementDB(items: SupplementDBItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SUPPLEMENT_DB_KEY, JSON.stringify(items));
}

export function addSupplementDBItem(
  item: Omit<SupplementDBItem, "id" | "createdAt" | "updatedAt">
): SupplementDBItem[] {
  const items = loadSupplementDB();
  const newItem: SupplementDBItem = {
    ...item,
    id: `supp-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [...items, newItem];
  saveSupplementDB(updated);
  return updated;
}

export function updateSupplementDBItem(
  id: string,
  updates: Partial<SupplementDBItem>
): SupplementDBItem[] {
  const items = loadSupplementDB();
  const updated = items.map((s) =>
    s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
  );
  saveSupplementDB(updated);
  return updated;
}

export function deleteSupplementDBItem(id: string): SupplementDBItem[] {
  const items = loadSupplementDB();
  const updated = items.filter((s) => s.id !== id);
  saveSupplementDB(updated);
  return updated;
}

// ─── Exercise Database ────────────────────────────────────────────────────────

export function loadExerciseDB(): ExerciseDBItem[] {
  if (typeof window === "undefined") return seedExerciseDB;
  try {
    if (localStorage.getItem(EXERCISE_SEED_VERSION_KEY) !== EXERCISE_SEED_VERSION) {
      localStorage.setItem(EXERCISE_DB_KEY, JSON.stringify(seedExerciseDB));
      localStorage.setItem(EXERCISE_SEED_VERSION_KEY, EXERCISE_SEED_VERSION);
    }
    const stored = localStorage.getItem(EXERCISE_DB_KEY);
    return stored ? JSON.parse(stored) : seedExerciseDB;
  } catch {
    return seedExerciseDB;
  }
}

function saveExerciseDB(items: ExerciseDBItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(EXERCISE_DB_KEY, JSON.stringify(items));
}

export function addExerciseDBItem(
  item: Omit<ExerciseDBItem, "id" | "createdAt" | "updatedAt">
): ExerciseDBItem[] {
  const items = loadExerciseDB();
  const newItem: ExerciseDBItem = {
    ...item,
    id: `ex-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [...items, newItem];
  saveExerciseDB(updated);
  return updated;
}

export function updateExerciseDBItem(
  id: string,
  updates: Partial<ExerciseDBItem>
): ExerciseDBItem[] {
  const items = loadExerciseDB();
  const updated = items.map((e) =>
    e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
  );
  saveExerciseDB(updated);
  return updated;
}

export function deleteExerciseDBItem(id: string): ExerciseDBItem[] {
  const items = loadExerciseDB();
  const updated = items.filter((e) => e.id !== id);
  saveExerciseDB(updated);
  return updated;
}

// ─── Global Login Help Requests ──────────────────────────────────────────────

const LOGIN_HELP_KEY = "coachOS_loginHelpRequests";

export function loadLoginHelpRequests(): LoginHelpRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(LOGIN_HELP_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLoginHelpRequests(requests: LoginHelpRequest[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOGIN_HELP_KEY, JSON.stringify(requests));
}

export function addLoginHelpRequest(enteredName: string, note?: string): LoginHelpRequest[] {
  const requests = loadLoginHelpRequests();
  const newRequest: LoginHelpRequest = {
    id: `lhr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    enteredName: enteredName.trim(),
    note: note?.trim() || undefined,
    requestedAt: new Date().toISOString(),
    status: "open",
  };
  const updated = [...requests, newRequest];
  saveLoginHelpRequests(updated);
  return updated;
}

export function resolveLoginHelpRequest(id: string): LoginHelpRequest[] {
  const requests = loadLoginHelpRequests();
  const updated = requests.map((r) => r.id === id ? { ...r, status: "resolved" as const } : r);
  saveLoginHelpRequests(updated);
  return updated;
}

export function deleteLoginHelpRequest(id: string): LoginHelpRequest[] {
  const requests = loadLoginHelpRequests();
  const updated = requests.filter((r) => r.id !== id);
  saveLoginHelpRequests(updated);
  return updated;
}

// ─── Athlete Credential Update ────────────────────────────────────────────────

export function updateAthleteCredentials(
  athleteId: string,
  updates: { name?: string; email?: string; pin?: string }
): Athlete[] {
  const athletes = loadAthletes();
  const updated = athletes.map((a) => {
    if (a.id !== athleteId) return a;
    const newName = updates.name?.trim() ?? a.name;
    const newEmail = updates.email?.toLowerCase().trim() ?? a.email ?? "";
    const newPin = updates.pin?.trim() ?? a.pin;
    const newInitials = newName
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .slice(0, 2)
      .join("");
    return {
      ...a,
      name: newName,
      email: newEmail || undefined,
      pin: newPin,
      avatarInitials: updates.name ? newInitials : a.avatarInitials,
      profile: a.profile
        ? { ...a.profile, personal: { ...a.profile.personal, email: newEmail || undefined } }
        : a.profile,
    };
  });
  saveAthletes(updated);
  return updated;
}

// ─── Coach Check-In Done Status ───────────────────────────────────────────────

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

// ─── Active Training Session ──────────────────────────────────────────────────

export interface ActiveSession {
  athleteId: string;
  date: string;
  trainingDayId: string;
  exercises: TrainingExerciseLog[];
  note: string;
  startedAt: string; // ISO timestamp
  pausedAt: string | null; // ISO timestamp when paused, null if running
  totalPausedMs: number; // accumulated pause duration from previous pauses
}

export function loadActiveSession(): ActiveSession | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      pausedAt: parsed.pausedAt ?? null,
      totalPausedMs: parsed.totalPausedMs ?? 0,
    };
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
