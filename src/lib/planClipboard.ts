import { MealPlan, Meal, TrainingPlan, SupplementPlan } from "@/types";

const KEYS = {
  meal: "clipboard_meal_plan",
  mealEntry: "clipboard_meal",
  training: "clipboard_training_plan",
  supplement: "clipboard_supplement_plan",
} as const;

export function copyMealPlan(plan: MealPlan) {
  localStorage.setItem(KEYS.meal, JSON.stringify(plan));
}

export function copyMeal(meal: Meal) {
  localStorage.setItem(KEYS.mealEntry, JSON.stringify(meal));
}

export function getMealClipboard(): Meal | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEYS.mealEntry);
  return raw ? (JSON.parse(raw) as Meal) : null;
}

export function copyTrainingPlan(plan: TrainingPlan) {
  localStorage.setItem(KEYS.training, JSON.stringify(plan));
}

export function copySupplementPlan(plan: SupplementPlan) {
  localStorage.setItem(KEYS.supplement, JSON.stringify(plan));
}

export function getMealPlanClipboard(): MealPlan | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEYS.meal);
  return raw ? (JSON.parse(raw) as MealPlan) : null;
}

export function getTrainingPlanClipboard(): TrainingPlan | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEYS.training);
  return raw ? (JSON.parse(raw) as TrainingPlan) : null;
}

export function getSupplementPlanClipboard(): SupplementPlan | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEYS.supplement);
  return raw ? (JSON.parse(raw) as SupplementPlan) : null;
}
