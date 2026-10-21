import { z } from "zod";

// ─── Shared primitives ────────────────────────────────────────────────────────

const CadenceSchema = z.object({
  eccentric: z.number(),
  bottomHold: z.number(),
  concentric: z.number(),
  topHold: z.number(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// STRICT schemas — accept the exact runtime shape (used e.g. by exported JSON).
// ═══════════════════════════════════════════════════════════════════════════════

const ExerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  sets: z.number(),
  reps: z.string(),
  rir: z.number().optional(),
  rpe: z.number().optional(),
  restSeconds: z.number().optional(),
  note: z.string().optional(),
  videoUrl: z.string().optional(),
  muscleGroup: z.string().optional(),
  laterality: z.enum(["bilateral", "unilateral"]).optional(),
  equipmentType: z.string().optional(),
  isTimeBased: z.boolean().optional(),
  variantLabel: z.string().optional(),
  exerciseDbNote: z.string().optional(),
  exerciseDbId: z.string().optional(),
  cadence: CadenceSchema.optional(),
  customValue: z.number().optional(),
});

const TrainingDaySchema = z.object({
  id: z.string(),
  dayName: z.string(),
  label: z.string(),
  exercises: z.array(ExerciseSchema),
  note: z.string().optional(),
  cardioNote: z.string().optional(),
});

export const TrainingPlanSchema = z.object({
  id: z.string(),
  athleteId: z.string(),
  title: z.string(),
  days: z.array(TrainingDaySchema),
  coachNote: z.string().optional(),
  createdAt: z.string(),
  mode: z.enum(["weekday", "flexible"]).optional(),
  schritteProTag: z.number().optional(),
  cardioMinuten: z.number().optional(),
  cardioFrequenz: z.enum(["woche", "taeglich"]).optional(),
  cardioIntensity: z.string().optional(),
  trackedFields: z.object({
    weight: z.boolean(),
    reps: z.boolean(),
    rir: z.boolean(),
    cadence: z.boolean(),
    custom: z.object({ label: z.string(), enabled: z.boolean() }).optional(),
  }).optional(),
  isActive: z.boolean().optional(),
});

const FoodItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  kcalPer100g: z.number(),
  proteinPer100g: z.number(),
  carbsPer100g: z.number(),
  fatPer100g: z.number(),
  fiberPer100g: z.number(),
  saltPer100g: z.number(),
  defaultAmount: z.number().optional(),
  defaultAmountUnit: z.string().optional(),
  servingLabel: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
  source: z.enum(["manual", "external"]).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();

const MealEntrySchema = z.object({
  foodItemId: z.string(),
  foodItem: FoodItemSchema,
  amountG: z.number(),
});

const MealSchema = z.object({
  id: z.string(),
  name: z.string(),
  time: z.string().nullable().optional(),
  entries: z.array(MealEntrySchema),
  note: z.string().optional(),
  isFreeMeal: z.boolean().optional(),
});

const MacroTargetsSchema = z.object({
  kcal: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  fiber: z.number().optional(),
});

export const MealPlanSchema = z.object({
  id: z.string(),
  athleteId: z.string(),
  title: z.string(),
  planType: z.enum(["fixed", "macro_targets"]).optional(),
  macroTargets: MacroTargetsSchema.optional(),
  meals: z.array(MealSchema),
  coachNote: z.string().optional(),
  createdAt: z.string(),
  isActive: z.boolean().optional(),
});

const SupplementSchema = z.object({
  id: z.string(),
  name: z.string(),
  dosage: z.string(),
  standardDosage: z.string().optional(),
  timing: z.string(),
  instructions: z.string(),
  note: z.string().optional(),
  link: z.string().optional(),
  supplementDBId: z.string().optional(),
});

export const SupplementPlanSchema = z.object({
  id: z.string(),
  athleteId: z.string(),
  title: z.string().optional(),
  supplements: z.array(SupplementSchema),
  coachNote: z.string().optional(),
  createdAt: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type TrainingPlanInput = z.infer<typeof TrainingPlanSchema>;
export type MealPlanInput = z.infer<typeof MealPlanSchema>;
export type SupplementPlanInput = z.infer<typeof SupplementPlanSchema>;

// ═══════════════════════════════════════════════════════════════════════════════
// LEAN schemas — coach-friendly input format intended for hand-written / Claude-
// generated JSON. All IDs, timestamps, DB joins and derived values are optional;
// the import pipeline fills in the missing pieces.
// ═══════════════════════════════════════════════════════════════════════════════

export const LEAN_SCHEMA_VERSION = 1 as const;

// — Training ─────────────────────────────────────────────────────────────────
const LeanExerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.number().int().positive(),
  reps: z.union([z.string(), z.number()]).optional(),
  rir: z.number().optional(),
  rpe: z.number().optional(),
  restSeconds: z.number().optional(),
  note: z.string().optional(),
  videoUrl: z.string().optional(),
  muscleGroup: z.string().optional(),
  laterality: z.enum(["bilateral", "unilateral"]).optional(),
  equipmentType: z.string().optional(),
  isTimeBased: z.boolean().optional(),
  variantLabel: z.string().optional(),
  cadence: CadenceSchema.optional(),
});

const LeanTrainingDaySchema = z.object({
  dayName: z.string().min(1),
  label: z.string().optional(),
  exercises: z.array(LeanExerciseSchema).default([]),
  note: z.string().optional(),
  cardioNote: z.string().optional(),
});

export const LeanTrainingPlanSchema = z.object({
  schemaVersion: z.literal(LEAN_SCHEMA_VERSION).optional(),
  planType: z.literal("training").optional(),
  title: z.string().min(1),
  mode: z.enum(["weekday", "flexible"]).optional(),
  coachNote: z.string().optional(),
  schritteProTag: z.number().optional(),
  cardioMinuten: z.number().optional(),
  cardioFrequenz: z.enum(["woche", "taeglich"]).optional(),
  cardioIntensity: z.string().optional(),
  trackedFields: z.object({
    weight: z.boolean().optional(),
    reps: z.boolean().optional(),
    rir: z.boolean().optional(),
    cadence: z.boolean().optional(),
    custom: z.object({ label: z.string(), enabled: z.boolean() }).optional(),
  }).optional(),
  days: z.array(LeanTrainingDaySchema).min(1),
  isActive: z.boolean().optional(),
});

// — Meal plan ────────────────────────────────────────────────────────────────
// A food entry can be either a reference (by name) to an existing FoodItem in
// the FoodDB, or an inline definition carrying its own macros. If both are
// supplied, the DB match wins and the inline macros are used only as fallback.
const LeanFoodEntrySchema = z.object({
  name: z.string().min(1),
  amountG: z.number().positive().optional(),
  amount: z.number().positive().optional(),
  unit: z.enum(["g", "stück", "piece"]).optional(),
  // Inline macros (per the given amount; NOT per 100 g — makes it easier to
  // transcribe meals that only list totals, like the Tag-1 screenshot).
  kcal: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
  fiber: z.number().optional(),
  salt: z.number().optional(),
  category: z.string().optional(),
}).refine(
  (v) => v.amountG !== undefined || v.amount !== undefined || v.kcal !== undefined,
  { message: "Entry needs at least an amount or inline kcal value." }
);

const LeanMealSchema = z.object({
  name: z.string().min(1),
  time: z.string().nullable().optional(),
  note: z.string().optional(),
  entries: z.array(LeanFoodEntrySchema).default([]),
  isFreeMeal: z.boolean().optional(),
});

export const LeanMealPlanSchema = z.object({
  schemaVersion: z.literal(LEAN_SCHEMA_VERSION).optional(),
  planType: z.literal("meal").optional(),
  title: z.string().min(1),
  mealPlanType: z.enum(["fixed", "macro_targets"]).optional(),
  macroTargets: MacroTargetsSchema.optional(),
  coachNote: z.string().optional(),
  meals: z.array(LeanMealSchema).default([]),
  isActive: z.boolean().optional(),
});

// — Supplement plan ──────────────────────────────────────────────────────────
const LeanSupplementSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().min(1),
  timing: z.string().optional(),
  instructions: z.string().optional(),
  note: z.string().optional(),
  link: z.string().optional(),
});

export const LeanSupplementPlanSchema = z.object({
  schemaVersion: z.literal(LEAN_SCHEMA_VERSION).optional(),
  planType: z.literal("supplement").optional(),
  title: z.string().optional(),
  coachNote: z.string().optional(),
  supplements: z.array(LeanSupplementSchema).min(1),
  isActive: z.boolean().optional(),
});

export type LeanTrainingPlanInput = z.infer<typeof LeanTrainingPlanSchema>;
export type LeanMealPlanInput = z.infer<typeof LeanMealPlanSchema>;
export type LeanSupplementPlanInput = z.infer<typeof LeanSupplementPlanSchema>;
