import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  TrainingDay,
  Exercise,
  Meal,
  MealEntry,
  FoodItem,
  Supplement,
  ExerciseDBItem,
  SupplementDBItem,
} from "@/types";
import {
  LeanTrainingPlanSchema,
  LeanMealPlanSchema,
  LeanSupplementPlanSchema,
  TrainingPlanSchema,
  MealPlanSchema,
  SupplementPlanSchema,
  type LeanTrainingPlanInput,
  type LeanMealPlanInput,
  type LeanSupplementPlanInput,
  type TrainingPlanInput,
  type MealPlanInput,
  type SupplementPlanInput,
} from "@/lib/planSchemas";
import { foodItems as baseFoodItems } from "@/data/foodItems";

export type PlanType = "training" | "meal" | "supplement";

export interface ImportWarning {
  path: string;
  message: string;
}

export interface NormalizedPlanResult<T> {
  plan: T;
  warnings: ImportWarning[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isLeanInput(obj: Record<string, unknown>): boolean {
  // Lean inputs never carry an id/athleteId/createdAt triple like exports do.
  return (
    obj.id === undefined ||
    obj.athleteId === undefined ||
    obj.createdAt === undefined
  );
}

function round(n: number, decimals: number): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

// ─── Server-side DB loaders (direct Supabase queries) ────────────────────────

async function loadExerciseDBServer(sb: SupabaseClient): Promise<ExerciseDBItem[]> {
  const { data } = await sb.from("exercises").select("*");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group ?? "",
    isTimeBased: row.is_time_based ?? false,
    laterality: row.laterality ?? undefined,
    equipmentType: row.equipment_type ?? undefined,
    notes: row.notes ?? undefined,
  }));
}

async function loadSupplementDBServer(sb: SupabaseClient): Promise<SupplementDBItem[]> {
  const { data } = await sb.from("supplements").select("*");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    category: row.category ?? undefined,
    standardDosage: row.standard_dosage ?? "",
    timing: row.timing ?? "",
    instructions: row.instructions ?? "",
    notes: row.notes ?? undefined,
    link: row.link ?? undefined,
  }));
}

async function loadFoodDBServer(sb: SupabaseClient): Promise<FoodItem[]> {
  const { data: customRows } = await sb.from("custom_foods").select("*");
  const { data: deactRows } = await sb.from("deactivated_foods").select("food_id");
  const deactivated = new Set((deactRows ?? []).map((r: { food_id: string }) => r.food_id));

  const base = baseFoodItems
    .filter((f) => !deactivated.has(f.id))
    .map((f) => ({ ...f, isActive: true }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const custom: FoodItem[] = (customRows ?? []).map((row: any) => ({
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
  }));

  return [...base, ...custom.filter((f) => f.isActive !== false)];
}

// ─── TRAINING ────────────────────────────────────────────────────────────────

export async function normalizeTrainingPlan(
  input: unknown,
  athleteId: string,
  sb: SupabaseClient,
): Promise<NormalizedPlanResult<TrainingPlanInput>> {
  const warnings: ImportWarning[] = [];
  const inputObj = (input ?? {}) as Record<string, unknown>;

  if (!isLeanInput(inputObj)) {
    const strict = TrainingPlanSchema.parse({ ...inputObj, athleteId });
    return { plan: strict, warnings };
  }

  const lean: LeanTrainingPlanInput = LeanTrainingPlanSchema.parse(input);
  const dbItems = await loadExerciseDBServer(sb);
  const byName = new Map(dbItems.map((e) => [normalizeName(e.name), e]));

  const now = new Date().toISOString();

  const days: TrainingDay[] = lean.days.map((d, dayIdx) => {
    const exercises: Exercise[] = d.exercises.map((lex, exIdx) => {
      const match = byName.get(normalizeName(lex.name));
      const ex: Exercise = {
        id: uid("ex"),
        name: match?.name ?? lex.name,
        sets: lex.sets,
        reps: lex.reps !== undefined ? String(lex.reps) : (match?.isTimeBased ? "20-30 Sek." : "8-12"),
        rir: lex.rir,
        rpe: lex.rpe,
        restSeconds: lex.restSeconds,
        note: lex.note,
        videoUrl: lex.videoUrl,
        muscleGroup: lex.muscleGroup ?? match?.muscleGroup,
        laterality: lex.laterality ?? match?.laterality ?? "bilateral",
        equipmentType: lex.equipmentType ?? match?.equipmentType,
        isTimeBased: lex.isTimeBased ?? match?.isTimeBased,
        variantLabel: lex.variantLabel,
        exerciseDbNote: match?.notes,
        exerciseDbId: match?.id,
        cadence: lex.cadence,
      };
      if (!match) {
        warnings.push({
          path: `days[${dayIdx}].exercises[${exIdx}]`,
          message: `Übung "${lex.name}" nicht in ÜbungenDB – als Freitext übernommen.`,
        });
      }
      return ex;
    });

    return {
      id: uid("day"),
      dayName: d.dayName,
      label: d.label ?? "",
      exercises,
      note: d.note,
      cardioNote: d.cardioNote,
    };
  });

  const plan: TrainingPlanInput = TrainingPlanSchema.parse({
    id: uid("tp"),
    athleteId,
    title: lean.title,
    days,
    coachNote: lean.coachNote,
    createdAt: now,
    mode: lean.mode ?? "flexible",
    schritteProTag: lean.schritteProTag,
    cardioMinuten: lean.cardioMinuten,
    cardioFrequenz: lean.cardioFrequenz,
    cardioIntensity: lean.cardioIntensity,
    trackedFields: {
      weight: lean.trackedFields?.weight ?? true,
      reps: lean.trackedFields?.reps ?? true,
      rir: lean.trackedFields?.rir ?? true,
      cadence: lean.trackedFields?.cadence ?? false,
      custom: lean.trackedFields?.custom,
    },
    isActive: lean.isActive,
  });

  return { plan, warnings };
}

// ─── MEAL PLAN ───────────────────────────────────────────────────────────────

export async function normalizeMealPlan(
  input: unknown,
  athleteId: string,
  sb: SupabaseClient,
): Promise<NormalizedPlanResult<MealPlanInput>> {
  const warnings: ImportWarning[] = [];
  const inputObj = (input ?? {}) as Record<string, unknown>;

  if (!isLeanInput(inputObj)) {
    const strict = MealPlanSchema.parse({ ...inputObj, athleteId });
    return { plan: strict, warnings };
  }

  const lean: LeanMealPlanInput = LeanMealPlanSchema.parse(input);
  const dbFoods = await loadFoodDBServer(sb);
  const byName = new Map(dbFoods.map((f) => [normalizeName(f.name), f]));

  const now = new Date().toISOString();

  const meals: Meal[] = lean.meals.map((m, mealIdx) => {
    const entries: MealEntry[] = m.entries.map((e, entryIdx) => {
      const path = `meals[${mealIdx}].entries[${entryIdx}]`;
      const match = byName.get(normalizeName(e.name));

      let amountG: number;
      if (e.amountG !== undefined) {
        amountG = e.amountG;
      } else if (e.amount !== undefined) {
        const isStück = (e.unit ?? "").toLowerCase().includes("st") ||
          (match?.servingLabel?.toLowerCase().includes("stück") ?? false);
        amountG = isStück ? e.amount * 100 : e.amount;
      } else {
        amountG = 100;
      }

      let foodItem: FoodItem;
      if (match) {
        foodItem = match;
      } else {
        // Inline macros represent TOTALS for the given portion — rescale back
        // to the per-100 g form that the rest of the app expects.
        const scaleTo100 = amountG > 0 ? 100 / amountG : 1;
        foodItem = {
          id: uid("cf"),
          name: e.name,
          category: e.category ?? "Sonstiges",
          kcalPer100g: round((e.kcal ?? 0) * scaleTo100, 1),
          proteinPer100g: round((e.protein ?? 0) * scaleTo100, 1),
          carbsPer100g: round((e.carbs ?? 0) * scaleTo100, 1),
          fatPer100g: round((e.fat ?? 0) * scaleTo100, 1),
          fiberPer100g: round((e.fiber ?? 0) * scaleTo100, 1),
          saltPer100g: round((e.salt ?? 0) * scaleTo100, 2),
          servingLabel: "100 g",
          source: "manual",
        };
        warnings.push({
          path,
          message: e.kcal === undefined
            ? `"${e.name}" nicht in FoodDB und ohne kcal-Angabe – alle Makros = 0.`
            : `"${e.name}" nicht in FoodDB – als Inline-Eintrag (nur in diesem Plan) übernommen.`,
        });
      }

      return { foodItemId: foodItem.id, foodItem, amountG };
    });

    return {
      id: uid("meal"),
      name: m.name,
      time: m.time ?? "",
      entries,
      note: m.note,
      isFreeMeal: m.isFreeMeal,
    };
  });

  const plan: MealPlanInput = MealPlanSchema.parse({
    id: uid("mp"),
    athleteId,
    title: lean.title,
    planType: lean.mealPlanType ?? "fixed",
    macroTargets: lean.macroTargets,
    meals,
    coachNote: lean.coachNote,
    createdAt: now,
    isActive: lean.isActive,
  });

  return { plan, warnings };
}

// ─── SUPPLEMENT ──────────────────────────────────────────────────────────────

export async function normalizeSupplementPlan(
  input: unknown,
  athleteId: string,
  sb: SupabaseClient,
): Promise<NormalizedPlanResult<SupplementPlanInput>> {
  const warnings: ImportWarning[] = [];
  const inputObj = (input ?? {}) as Record<string, unknown>;

  if (!isLeanInput(inputObj)) {
    const strict = SupplementPlanSchema.parse({ ...inputObj, athleteId });
    return { plan: strict, warnings };
  }

  const lean: LeanSupplementPlanInput = LeanSupplementPlanSchema.parse(input);
  const dbItems = await loadSupplementDBServer(sb);
  const byName = new Map(dbItems.map((s) => [normalizeName(s.name), s]));

  const now = new Date().toISOString();

  const supplements: Supplement[] = lean.supplements.map((ls, idx) => {
    const match = byName.get(normalizeName(ls.name));
    const s: Supplement = {
      id: uid("supp"),
      name: match?.name ?? ls.name,
      dosage: ls.dosage,
      standardDosage: match?.standardDosage,
      timing: ls.timing ?? match?.timing ?? "",
      instructions: ls.instructions ?? match?.instructions ?? "",
      note: ls.note ?? match?.notes,
      link: ls.link ?? match?.link,
      supplementDBId: match?.id,
    };
    if (!match) {
      warnings.push({
        path: `supplements[${idx}]`,
        message: `Supplement "${ls.name}" nicht in SupplementDB – als Freitext übernommen.`,
      });
    }
    return s;
  });

  const plan: SupplementPlanInput = SupplementPlanSchema.parse({
    id: uid("sp"),
    athleteId,
    title: lean.title,
    supplements,
    coachNote: lean.coachNote,
    createdAt: now,
    isActive: lean.isActive,
  });

  return { plan, warnings };
}
