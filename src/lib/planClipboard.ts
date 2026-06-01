import { MealPlan, TrainingPlan, SupplementPlan } from "@/types";

const KEYS = {
  meal: "clipboard_meal_plan",
  training: "clipboard_training_plan",
  supplement: "clipboard_supplement_plan",
} as const;

export function copyMealPlan(plan: MealPlan) {
  localStorage.setItem(KEYS.meal, JSON.stringify(plan));
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
