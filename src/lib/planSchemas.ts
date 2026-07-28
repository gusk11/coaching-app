import { z } from "zod";

// ─── Shared primitives ────────────────────────────────────────────────────────

const CadenceSchema = z.object({
  eccentric: z.number(),
  bottomHold: z.number(),
  concentric: z.number(),
  topHold: z.number(),
});

// ─── Training Plan ────────────────────────────────────────────────────────────

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
  trackedFields: z.object({
    weight: z.boolean(),
    reps: z.boolean(),
    rir: z.boolean(),
    cadence: z.boolean(),
    custom: z.object({ label: z.string(), enabled: z.boolean() }).optional(),
  }).optional(),
});

// ─── Meal Plan ────────────────────────────────────────────────────────────────

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
});

// ─── Supplement Plan ──────────────────────────────────────────────────────────

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
});

export type TrainingPlanInput = z.infer<typeof TrainingPlanSchema>;
export type MealPlanInput = z.infer<typeof MealPlanSchema>;
export type SupplementPlanInput = z.infer<typeof SupplementPlanSchema>;
