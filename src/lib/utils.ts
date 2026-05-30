import { Athlete, CalorieTrackerDay, DailyCheckIn, FoodItem, Meal, MealEntry, NutritionStatusType, WeekAnalysis } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getWeekDates(dateStr: string): { start: string; end: string } {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: toISODate(monday),
    end: toISODate(sunday),
  };
}

export function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getCheckInsForWeek(
  checkIns: DailyCheckIn[],
  weekStart: string
): DailyCheckIn[] {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  return checkIns.filter((c) => {
    const d = new Date(c.date);
    return d >= start && d <= end;
  });
}

export function getCheckInsForPreviousWeek(
  checkIns: DailyCheckIn[],
  weekStart: string
): DailyCheckIn[] {
  const prevStart = new Date(weekStart);
  prevStart.setDate(prevStart.getDate() - 7);
  return getCheckInsForWeek(checkIns, toISODate(prevStart));
}

export function calculateCurrentWeekAverage(
  checkIns: DailyCheckIn[],
  todayStr?: string
): number {
  const today = todayStr ?? toISODate(new Date());
  const { start } = getWeekDates(today);
  const week = getCheckInsForWeek(checkIns, start);
  if (!week.length) return 0;
  return week.reduce((s, c) => s + c.weight, 0) / week.length;
}

export function calculatePreviousWeekAverage(
  checkIns: DailyCheckIn[],
  todayStr?: string
): number {
  const today = todayStr ?? toISODate(new Date());
  const { start } = getWeekDates(today);
  const prevWeek = getCheckInsForPreviousWeek(checkIns, start);
  if (!prevWeek.length) return 0;
  return prevWeek.reduce((s, c) => s + c.weight, 0) / prevWeek.length;
}

export function calculateWeightChangeKg(current: number, previous: number): number {
  return Math.round((current - previous) * 100) / 100;
}

export function calculateWeightChangePercent(current: number, previous: number): number {
  if (!previous) return 0;
  return Math.round(((current - previous) / previous) * 10000) / 100;
}

export function calculateDistanceToGoal(
  currentWeight: number,
  targetWeight: number
): number {
  return Math.round((targetWeight - currentWeight) * 10) / 10;
}

export function calculateGoalProgressPercent(
  startWeight: number,
  currentWeight: number,
  targetWeight: number
): number {
  const total = Math.abs(targetWeight - startWeight);
  if (!total) return 100;
  const done = Math.abs(currentWeight - startWeight);
  return Math.min(100, Math.round((done / total) * 100));
}

/**
 * Resolves the canonical NutritionStatusType for a DailyCheckIn.
 * Prefers the new `nutritionStatus` field; falls back to mapping legacy `mealCompliance` values.
 */
export function normalizeNutritionStatus(ci: DailyCheckIn): NutritionStatusType {
  if (ci.nutritionStatus) return ci.nutritionStatus;
  const mc = ci.mealCompliance;
  if (["tracked_in_calorie_tracker", "full_tracking", "calorie_tracker_used"].includes(mc)) {
    return "calorie_tracker_used";
  }
  if (["not_followed", "off_plan", "minor_deviation", "major_deviation", "no_exact_info"].includes(mc)) {
    return "no_exact_info";
  }
  return "meal_plan_followed";
}

export function calculateCalorieTrackerDayMacros(day: CalorieTrackerDay) {
  let kcal = 0, protein = 0, carbs = 0, fat = 0, fiber = 0, salt = 0;
  for (const meal of day.meals) {
    for (const e of meal.entries) {
      kcal += e.kcal; protein += e.protein; carbs += e.carbs;
      fat += e.fat; fiber += e.fiber; salt += e.salt;
    }
  }
  return { kcal, protein, carbs, fat, fiber, salt };
}

export function calculateMealMacros(entries: MealEntry[]) {
  return entries.reduce(
    (acc, e) => {
      if (!e.foodItem) return acc; // guard against stale/missing foodItem refs
      const ratio = e.amountG / 100;
      return {
        kcal: acc.kcal + e.foodItem.kcalPer100g * ratio,
        protein: acc.protein + e.foodItem.proteinPer100g * ratio,
        carbs: acc.carbs + e.foodItem.carbsPer100g * ratio,
        fat: acc.fat + e.foodItem.fatPer100g * ratio,
        fiber: acc.fiber + e.foodItem.fiberPer100g * ratio,
        salt: acc.salt + (e.foodItem.saltPer100g ?? 0) * ratio,
      };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0 }
  );
}

export function calculateDayMacros(meals: Meal[]) {
  return meals.reduce(
    (acc, meal) => {
      const m = calculateMealMacros(meal.entries);
      return {
        kcal: acc.kcal + m.kcal,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
        fiber: acc.fiber + m.fiber,
        salt: acc.salt + m.salt,
      };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0 }
  );
}

export function roundMacro(val: number): number {
  return Math.round(val * 10) / 10;
}

export function roundSalt(val: number): number {
  return Math.round(val * 100) / 100;
}

export function analyzeWeek(
  athlete: Athlete,
  todayStr?: string
): WeekAnalysis {
  const today = todayStr ?? toISODate(new Date());
  const { start } = getWeekDates(today);
  const currentAvg = calculateCurrentWeekAverage(athlete.dailyCheckIns, today);
  const previousAvg = calculatePreviousWeekAverage(athlete.dailyCheckIns, today);
  const changeKg = calculateWeightChangeKg(currentAvg, previousAvg);
  const changePercent = calculateWeightChangePercent(currentAvg, previousAvg);

  let trend: WeekAnalysis["trend"] = "stable";
  if (changeKg > 0.2) trend = "rising";
  else if (changeKg < -0.2) trend = "falling";

  return {
    currentWeekAvg: Math.round(currentAvg * 10) / 10,
    previousWeekAvg: Math.round(previousAvg * 10) / 10,
    changeKg,
    changePercent,
    trend,
  };
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
  });
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function getGoalLabel(goal: string): string {
  const map: Record<string, string> = {
    cut: "Cut",
    bulk: "Bulk",
    recomp: "Recomp",
    maintenance: "Maintenance",
  };
  return map[goal] ?? goal;
}

export function getGoalColor(goal: string): string {
  const map: Record<string, string> = {
    cut: "text-blue-400",
    bulk: "text-green-400",
    recomp: "text-purple-400",
    maintenance: "text-yellow-400",
  };
  return map[goal] ?? "text-gray-400";
}

export function getTrendIcon(trend: string): string {
  if (trend === "rising") return "↑";
  if (trend === "falling") return "↓";
  return "→";
}

export function getTrendColor(trend: string, goal: string): string {
  // for cut: falling is good; for bulk: rising is good
  if (goal === "cut") {
    if (trend === "falling") return "text-green-400";
    if (trend === "rising") return "text-red-400";
  } else if (goal === "bulk") {
    if (trend === "rising") return "text-green-400";
    if (trend === "falling") return "text-red-400";
  }
  return "text-[#8fa3c0]";
}

export function getLastCheckIn(
  checkIns: DailyCheckIn[]
): DailyCheckIn | undefined {
  if (!checkIns.length) return undefined;
  return [...checkIns].sort((a, b) => b.date.localeCompare(a.date))[0];
}

export function isCheckInDay(checkInDay: number): boolean {
  return new Date().getDay() === checkInDay;
}
