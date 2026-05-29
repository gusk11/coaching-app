export type GoalType = "cut" | "bulk" | "recomp" | "maintenance";

/** Old values kept for backward-compat with localStorage; new form uses the latter three */
export type MealComplianceType =
  | "full"
  | "minor_deviation"
  | "major_deviation"
  | "off_plan"
  | "full_tracking"
  | "fully_followed"
  | "not_followed"
  | "tracked_in_calorie_tracker"
  | "calorie_tracker_used"
  | "meal_plan_followed"
  | "no_exact_info";

export type NutritionStatusType = "calorie_tracker_used" | "meal_plan_followed" | "no_exact_info";

// ─── Calorie Tracker ─────────────────────────────────────────────────────────

export interface CalorieTrackerEntry {
  id: string;
  name: string;
  /** Internal scaling value. For "100 g" items: actual grams. For "1 Stück" items: pieces × 100. */
  amountG: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  salt: number;
  foodItemId?: string;
  /** FoodItem.servingLabel snapshot — used for display ("100 g" → show g, "1 Stück" → show Stück). */
  servingLabel?: string;
}

export interface CalorieTrackerMeal {
  id: string;
  name: string;
  entries: CalorieTrackerEntry[];
}

export interface CalorieTrackerDay {
  id: string;
  athleteId: string;
  date: string; // ISO yyyy-mm-dd
  meals: CalorieTrackerMeal[];
}

export type TrainingPlanMode = "weekday" | "flexible";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "elite";

export type TrackingDevice =
  | "apple_watch"
  | "garmin"
  | "fitbit"
  | "whoop"
  | "oura"
  | "none"
  | "other";

/** Which fields are active in the daily check-in for this athlete */
export interface DailyCheckConfig {
  bodyweight: boolean;
  sleepDuration: boolean;
  sleepQuality: boolean;
  sleepScore: boolean;
  steps: boolean;
  restingHeartRate: boolean;
  hrv: boolean;
  spO2: boolean;
  bloodPressure: boolean;
  stressLevel: boolean;
  energyLevel: boolean;
  mood: boolean;
  appetite: boolean;
  digestion: boolean;
  trainingQuality: boolean;
  cardioCompleted: boolean;
  trainingCompleted: boolean;
  nutritionCompliance: boolean;
  calorieTracking: boolean;
  notes: boolean;
}

export const DEFAULT_DAILY_CHECK_CONFIG: DailyCheckConfig = {
  bodyweight: true,
  sleepDuration: true,
  sleepQuality: true,
  sleepScore: false,
  steps: true,
  restingHeartRate: false,
  hrv: false,
  spO2: false,
  bloodPressure: false,
  stressLevel: true,
  energyLevel: true,
  mood: true,
  appetite: true,
  digestion: true,
  trainingQuality: true,
  cardioCompleted: true,
  trainingCompleted: true,
  nutritionCompliance: true,
  calorieTracking: true,
  notes: true,
};

export interface BloodPressure {
  systolic: number;
  diastolic: number;
}

export interface DailyCheckIn {
  id: string;
  athleteId: string;
  date: string; // ISO yyyy-mm-dd
  weight: number;
  measurementTime: string;
  appetite: 1 | 2 | 3 | 4 | 5;
  digestion: 1 | 2 | 3 | 4 | 5;
  trackingAccuracy?: 1 | 2 | 3 | 4 | 5;
  caffeine: number; // mg
  steps: number;
  cardio: boolean;
  cardioDuration?: number; // minutes
  training: boolean;
  trainingQuality: 1 | 2 | 3 | 4 | 5;
  sleepHours: number;
  sleepQuality: 1 | 2 | 3 | 4 | 5; // 1=sehr schlecht … 5=sehr gut
  sleepScore?: number; // 0-100 (device score)
  restingHeartRate?: number; // bpm
  hrv?: number; // ms (heart rate variability)
  spO2?: number; // % (oxygen saturation)
  bloodPressure?: BloodPressure;
  energyLevel: 1 | 2 | 3 | 4 | 5;
  stressLevel: 1 | 2 | 3 | 4 | 5;
  mood: 1 | 2 | 3 | 4 | 5;
  note: string;
  mealCompliance: MealComplianceType;
  deviationReason?: string;
  /** New nutrition status — takes precedence over mealCompliance when present */
  nutritionStatus?: NutritionStatusType;
  selectedMealPlanId?: string;
  noExactNutritionReason?: string;
  // only for full_tracking (legacy)
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

export interface ProgressImage {
  id: string;
  fileName: string;
  /** base64 dataUrl for local storage; swap for a remote URL when connecting to cloud storage */
  url: string;
  uploadedAt: string; // ISO timestamp
  size?: number; // bytes
  type?: string; // MIME type, e.g. image/jpeg
}

export interface WeeklyCheckIn {
  id: string;
  athleteId: string;
  weekStart: string; // ISO yyyy-mm-dd (Monday)
  date: string;
  overallWeekRating: 1 | 2 | 3 | 4 | 5;
  weekSatisfaction: 1 | 2 | 3 | 4 | 5;
  selfSatisfaction: 1 | 2 | 3 | 4 | 5;
  nutritionAdherence: 1 | 2 | 3 | 4 | 5;
  hungerCravings: string;
  trainingRating: 1 | 2 | 3 | 4 | 5;
  recoveryRating?: 1 | 2 | 3 | 4 | 5;
  sleepAvg?: number;
  stressAvg: number;
  energyAvg: number;
  specialEvents: string;
  coachNote: string;
  freeNote: string;
  progressImages?: ProgressImage[];
  /** @deprecated use progressImages instead */
  photos?: string[];
}

export interface WeeklyAdjustment {
  id: string;
  athleteId: string;
  weekStart: string; // ISO yyyy-mm-dd (Monday)
  category: "nutrition" | "training" | "cardio" | "supplements" | "general";
  title: string;
  description: string;
  relatedItemId?: string;
  visibleToAthlete: boolean;
  createdAt: string;
}

export interface TrainingSetLog {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  rir?: number | null;
  rpe?: number | null;
  notes?: string;
}

export interface TrainingExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: TrainingSetLog[];
}

export interface TrainingLog {
  id: string;
  athleteId: string;
  date: string; // ISO yyyy-mm-dd
  trainingDayId: string;
  trainingDayName: string;
  exercises: TrainingExerciseLog[];
  note?: string;
  durationSeconds?: number;
}

export interface SupplementDBItem {
  id: string;
  name: string;
  standardDosage: string;   // Standarddosierung
  timing: string;           // Einnahmezeitpunkt
  instructions: string;     // Einnahmeanleitung
  notes?: string;           // Weitere Hinweise
  link?: string;            // Externer Link (z.B. Produktseite, Studie)
  createdAt?: string;
  updatedAt?: string;
}

export interface ExerciseDBItem {
  id: string;
  name: string;             // Übungsname
  muscleGroup: string;      // Muskelgruppe
  notes?: string;           // Anmerkungen
  executionLink?: string;   // Link zur Übungsausführung
  createdAt?: string;
  updatedAt?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  saltPer100g: number;
  defaultAmount?: number;
  defaultAmountUnit?: string;
  /** Human-readable serving description, e.g. "100 g", "1 Stück ca. 60 g" */
  servingLabel?: string;
  notes?: string;
  isActive?: boolean;      // undefined = active; false = deactivated
  isCustomFood?: boolean;  // true = added by coach
  createdAt?: string;
  updatedAt?: string;
}

export interface MealEntry {
  foodItemId: string;
  foodItem: FoodItem;
  amountG: number;
}

export interface Meal {
  id: string;
  name: string;
  time?: string | null; // "08:00" or null = no fixed time
  entries: MealEntry[];
  note?: string;
}

export interface MealPlan {
  id: string;
  athleteId: string;
  title: string;
  meals: Meal[];
  coachNote?: string;
  createdAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string; // e.g. "8-12"
  rir?: number;
  rpe?: number;
  restSeconds?: number;
  note?: string;           // individual coach note for this athlete
  videoUrl?: string;       // execution link (mapped from DB's executionLink on import)
  muscleGroup?: string;    // snapshot from ÜbungenDB
  exerciseDbNote?: string; // snapshot of DB notes
  exerciseDbId?: string;   // reference to ExerciseDBItem (snapshot approach)
}

export interface TrainingDay {
  id: string;
  dayName: string; // "Montag" or "Training A"
  label: string; // "Push"
  exercises: Exercise[];
  note?: string;
  cardioNote?: string; // Per-day cardio instructions
}

export interface TrainingPlan {
  id: string;
  athleteId: string;
  title: string;
  days: TrainingDay[];
  coachNote?: string;
  createdAt: string;
  mode?: TrainingPlanMode; // "weekday" = fixed days, "flexible" = Training A/B/C
  generalCardio?: string; // General cardio instructions for this plan
}

export interface Supplement {
  id: string;
  name: string;
  dosage: string;            // individuelle Dosierungsmenge (athletenspezifisch)
  standardDosage?: string;   // Snapshot aus SupplementDB bei Übernahme
  timing: string;
  instructions: string;
  note?: string;
  link?: string;             // Snapshot aus SupplementDB (Produktseite, Studie etc.)
  supplementDBId?: string;   // Referenz auf SupplementDBItem (informativ)
}

export interface SupplementPlan {
  id: string;
  athleteId: string;
  supplements: Supplement[];
  coachNote?: string;
}

export interface Note {
  id: string;
  athleteId: string;
  type: "coach_visible" | "coach_internal" | "athlete_comment";
  content: string;
  createdAt: string;
}

export interface Athlete {
  id: string;
  name: string;
  pin: string;
  avatarInitials: string;
  startWeight: number;
  currentWeight: number;
  targetWeight: number;
  goalType: GoalType;
  goalText?: string;
  checkInDay: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday

  // Coach-internal profile data
  height?: number; // cm
  startDate?: string; // ISO yyyy-mm-dd
  competitionDate?: string; // ISO yyyy-mm-dd
  experienceLevel?: ExperienceLevel;
  trainingHistory?: string;
  injuries?: string;
  specialNotes?: string;
  trackingDevice?: TrackingDevice;
  trackingDeviceCustom?: string;

  // Check-in configuration
  dailyCheckConfig?: DailyCheckConfig;

  coachNote: string;
  visibleNote: string;
  dailyCheckIns: DailyCheckIn[];
  weeklyCheckIns: WeeklyCheckIn[];
  weeklyAdjustments?: WeeklyAdjustment[];
  trainingLogs?: TrainingLog[];
  calorieTrackerDays?: CalorieTrackerDay[];
  mealPlan?: MealPlan;
  mealPlans?: MealPlan[];
  trainingPlan?: TrainingPlan;
  supplementPlan?: SupplementPlan;
  notes: Note[];
  joinedAt: string;
  weeklyTrendTargetPercent?: number;
}

export interface CoachCredentials {
  email: string;
  password: string;
}

export type UserRole = "coach" | "athlete";

export interface AuthState {
  role: UserRole | null;
  athleteId: string | null;
}

export interface WeekAnalysis {
  currentWeekAvg: number;
  previousWeekAvg: number;
  changeKg: number;
  changePercent: number;
  trend: "rising" | "falling" | "stable";
}
