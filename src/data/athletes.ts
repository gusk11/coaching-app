import {
  Athlete, FoodItem, DailyCheckIn, WeeklyCheckIn, CalorieTrackerDay,
  CalorieTrackerEntry, TrainingLog, TrainingExerciseLog, TrainingSetLog,
  MealComplianceType, DailyCheckConfig, MealPlan,
} from "@/types";

// ─── Last 7 days (today = 2026-05-29) ────────────────────────────────────────
const DAYS = [
  "2026-05-23", "2026-05-24", "2026-05-25", "2026-05-26",
  "2026-05-27", "2026-05-28", "2026-05-29",
];
const WEEK_START = "2026-05-25"; // ISO Monday

// ─── DailyCheckConfig ─────────────────────────────────────────────────────────
const fullConfig: DailyCheckConfig = {
  bodyweight: true, sleepDuration: true, sleepQuality: true, sleepScore: false,
  steps: true, restingHeartRate: true, hrv: true, spO2: true, bloodPressure: true,
  stressLevel: true, energyLevel: true, mood: true, appetite: true, digestion: true,
  trainingQuality: true, cardioCompleted: true, trainingCompleted: true,
  nutritionCompliance: true, calorieTracking: true, notes: true,
};

// ─── Food snapshots (matching seedCustomFoods.ts IDs) ─────────────────────────
const fH: FoodItem = {
  id: "food-haehnchenbrust", name: "Hähnchenbrust", category: "Protein",
  servingLabel: "100 g", kcalPer100g: 110, proteinPer100g: 23, carbsPer100g: 0,
  fatPer100g: 1.5, fiberPer100g: 0, saltPer100g: 0.2,
  defaultAmount: 150, isCustomFood: true, isActive: true,
};
const fR: FoodItem = {
  id: "food-reis-gekocht", name: "Reis gekocht", category: "Kohlenhydrate",
  servingLabel: "100 g", kcalPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28,
  fatPer100g: 0.3, fiberPer100g: 0.4, saltPer100g: 0,
  isCustomFood: true, isActive: true,
};
const fE: FoodItem = {
  id: "food-ei", name: "Ei", category: "Protein",
  servingLabel: "1 Stück", kcalPer100g: 80, proteinPer100g: 7, carbsPer100g: 0.5,
  fatPer100g: 5.5, fiberPer100g: 0, saltPer100g: 0.2,
  defaultAmount: 1, isCustomFood: true, isActive: true,
};
const fB: FoodItem = {
  id: "food-banane", name: "Banane", category: "Obst",
  servingLabel: "1 Stück", kcalPer100g: 105, proteinPer100g: 1.3, carbsPer100g: 24,
  fatPer100g: 0.3, fiberPer100g: 2.6, saltPer100g: 0,
  defaultAmount: 1, isCustomFood: true, isActive: true,
};

// ─── CT entry helper ──────────────────────────────────────────────────────────
function cte(pfx: string, food: FoodItem, amountG: number): CalorieTrackerEntry {
  const r = amountG / 100;
  const rnd = (n: number) => Math.round(n * 100) / 100;
  return {
    id: `ce-${pfx}-${food.id}`,
    name: food.name,
    amountG,
    kcal: rnd(food.kcalPer100g * r),
    protein: rnd(food.proteinPer100g * r),
    carbs: rnd(food.carbsPer100g * r),
    fat: rnd(food.fatPer100g * r),
    fiber: rnd(food.fiberPer100g * r),
    salt: rnd(food.saltPer100g * r),
    foodItemId: food.id,
    servingLabel: food.servingLabel,
  };
}

function ctDay(
  aid: string, date: string,
  frEntries: CalorieTrackerEntry[], hauEntries: CalorieTrackerEntry[],
): CalorieTrackerDay {
  const pfx = `${aid}-${date}`;
  return {
    id: `ct-${pfx}`,
    athleteId: aid,
    date,
    meals: [
      { id: `cm-${pfx}-fs`, name: "Frühstück", entries: frEntries },
      { id: `cm-${pfx}-hm`, name: "Hauptmahlzeit", entries: hauEntries },
    ],
  };
}

// ─── Training log helper ──────────────────────────────────────────────────────
function exLog(exId: string, exName: string, sets: [number, number, (number | undefined)?][]): TrainingExerciseLog {
  return {
    exerciseId: exId,
    exerciseName: exName,
    sets: sets.map(([weight, reps, rir], i): TrainingSetLog => ({
      setNumber: i + 1,
      weight,
      reps,
      rir: rir !== undefined ? rir : (i === sets.length - 1 ? 1 : 2),
    })),
  };
}

// ─── MAX MUSTERMANN ───────────────────────────────────────────────────────────

const maxDailyChecks: DailyCheckIn[] = [
  // 2026-05-23 (Fri) Training A – Ernährungsplan Trainingstag
  { id:"dc-athlete-max-0", athleteId:"athlete-max", date:"2026-05-23", weight:90.1, measurementTime:"07:00", appetite:4, digestion:4, caffeine:200, steps:10000, cardio:false, training:true, trainingQuality:4, sleepHours:7.0, sleepQuality:4, restingHeartRate:62, hrv:67, spO2:98, bloodPressure:{systolic:122,diastolic:76}, energyLevel:4, stressLevel:3, mood:4, note:"Push-Einheit gut. Bankdrücken leicht gestiegen.", mealCompliance:"fully_followed", nutritionStatus:"meal_plan_followed", selectedMealPlanId:"mp-athlete-max-training" },
  // 2026-05-24 (Sat) Rest + Cardio – Ernährungsplan Ruhetag
  { id:"dc-athlete-max-1", athleteId:"athlete-max", date:"2026-05-24", weight:90.0, measurementTime:"07:00", appetite:3, digestion:4, caffeine:100, steps:8500, cardio:true, cardioDuration:30, training:false, trainingQuality:3, sleepHours:7.5, sleepQuality:4, restingHeartRate:60, hrv:72, spO2:98, bloodPressure:{systolic:120,diastolic:74}, energyLevel:3, stressLevel:2, mood:4, note:"Lockerer Spaziergang, gute Erholung.", mealCompliance:"fully_followed", nutritionStatus:"meal_plan_followed", selectedMealPlanId:"mp-athlete-max-rest" },
  // 2026-05-25 (Sun) Training B – Kalorientracker genutzt
  { id:"dc-athlete-max-2", athleteId:"athlete-max", date:"2026-05-25", weight:89.8, measurementTime:"07:00", appetite:4, digestion:4, caffeine:200, steps:9000, cardio:false, training:true, trainingQuality:4, sleepHours:7.5, sleepQuality:5, restingHeartRate:61, hrv:70, spO2:97, bloodPressure:{systolic:121,diastolic:75}, energyLevel:4, stressLevel:2, mood:4, note:"Pull-Einheit stark, Latzug gut.", mealCompliance:"tracked_in_calorie_tracker", nutritionStatus:"calorie_tracker_used" },
  // 2026-05-26 (Mon) Rest – keine genaue Angabe
  { id:"dc-athlete-max-3", athleteId:"athlete-max", date:"2026-05-26", weight:89.9, measurementTime:"07:00", appetite:4, digestion:4, caffeine:100, steps:11000, cardio:false, training:false, trainingQuality:3, sleepHours:6.5, sleepQuality:3, restingHeartRate:64, hrv:60, spO2:98, bloodPressure:{systolic:126,diastolic:80}, energyLevel:3, stressLevel:4, mood:3, note:"Abends mit Familie gegessen, Plan leicht überschritten.", mealCompliance:"not_followed", nutritionStatus:"no_exact_info", noExactNutritionReason:"Abendessen außer Haus – kein Überblick über die genauen Mengen möglich.", deviationReason:"Abendessen außer Haus" },
  // 2026-05-27 (Tue) Training A – Ernährungsplan Trainingstag
  { id:"dc-athlete-max-4", athleteId:"athlete-max", date:"2026-05-27", weight:89.6, measurementTime:"07:00", appetite:4, digestion:4, caffeine:200, steps:8000, cardio:false, training:true, trainingQuality:4, sleepHours:7.0, sleepQuality:4, restingHeartRate:62, hrv:65, spO2:98, bloodPressure:{systolic:122,diastolic:77}, energyLevel:4, stressLevel:3, mood:4, note:"Push-Einheit wieder gut, leichte Steigerung.", mealCompliance:"fully_followed", nutritionStatus:"meal_plan_followed", selectedMealPlanId:"mp-athlete-max-training" },
  // 2026-05-28 (Wed) Rest + Cardio – Kalorientracker genutzt
  { id:"dc-athlete-max-5", athleteId:"athlete-max", date:"2026-05-28", weight:89.5, measurementTime:"07:00", appetite:3, digestion:4, caffeine:100, steps:9500, cardio:true, cardioDuration:30, training:false, trainingQuality:3, sleepHours:7.5, sleepQuality:4, restingHeartRate:60, hrv:73, spO2:98, bloodPressure:{systolic:120,diastolic:74}, energyLevel:3, stressLevel:2, mood:4, note:"Erholung, 30 min spazieren.", mealCompliance:"tracked_in_calorie_tracker", nutritionStatus:"calorie_tracker_used" },
  // 2026-05-29 (Thu) Rest – Kalorientracker genutzt
  { id:"dc-athlete-max-6", athleteId:"athlete-max", date:"2026-05-29", weight:89.4, measurementTime:"07:00", appetite:4, digestion:4, caffeine:100, steps:10500, cardio:false, training:false, trainingQuality:3, sleepHours:7.0, sleepQuality:4, restingHeartRate:61, hrv:68, spO2:98, bloodPressure:{systolic:121,diastolic:76}, energyLevel:4, stressLevel:3, mood:4, note:"", mealCompliance:"tracked_in_calorie_tracker", nutritionStatus:"calorie_tracker_used" },
];

const maxWeeklyChecks: WeeklyCheckIn[] = [
  {
    id: "wc-athlete-max-1",
    athleteId: "athlete-max",
    weekStart: WEEK_START,
    date: "2026-05-29",
    overallWeekRating: 4,
    weekSatisfaction: 4,
    selfSatisfaction: 3,
    nutritionAdherence: 4,
    hungerCravings: "Plan gut eingehalten, abends gelegentlich Hunger.",
    trainingRating: 4,
    recoveryRating: 4,
    sleepAvg: 7.1,
    stressAvg: 2.8,
    energyAvg: 3.6,
    specialEvents: "Essen außer Haus am Montag.",
    coachNote: "",
    freeNote: "Kraftwerte stabil, Push-Einheit gut. Verdauung gut, Hunger an Ruhetagen höher.",
  },
];

const maxCTDays: CalorieTrackerDay[] = DAYS.map((date) => {
  // Deviation 2026-05-26: 2 Bananen statt 1
  const isBananaDev = date === "2026-05-26";
  return ctDay(
    "athlete-max",
    date,
    [
      cte(`max-${date}-fs`, fB, isBananaDev ? 200 : 100),
      cte(`max-${date}-fs2`, fE, 200),
    ],
    [
      cte(`max-${date}-hm`, fH, 180),
      cte(`max-${date}-hm2`, fR, 250),
    ],
  );
});

const maxTrainingLogs: TrainingLog[] = [
  {
    id: "tl-athlete-max-20260523-a",
    athleteId: "athlete-max",
    date: "2026-05-23",
    trainingDayId: "td-max-a",
    trainingDayName: "Training A – Push",
    durationSeconds: 2700,
    note: "Bankdrücken stabil.",
    exercises: [
      exLog("ep-max-bank", "Bankdrücken Langhantel", [[75,8,2],[75,7,2],[75,6,1]]),
      exLog("ep-max-seit", "Seitheben", [[12,15,2],[12,14,2],[12,13,1]]),
    ],
  },
  {
    id: "tl-athlete-max-20260525-b",
    athleteId: "athlete-max",
    date: "2026-05-25",
    trainingDayId: "td-max-b",
    trainingDayName: "Training B – Pull/Legs",
    durationSeconds: 3000,
    note: "Latzug und Kniebeuge gut.",
    exercises: [
      exLog("ep-max-latz", "Latzug", [[65,10],[65,9],[65,8]]),
      exLog("ep-max-knie", "Kniebeuge", [[100,8],[100,7],[100,6]]),
    ],
  },
  {
    id: "tl-athlete-max-20260527-a",
    athleteId: "athlete-max",
    date: "2026-05-27",
    trainingDayId: "td-max-a",
    trainingDayName: "Training A – Push",
    durationSeconds: 2700,
    note: "Steigerung auf 77.5 kg.",
    exercises: [
      exLog("ep-max-bank", "Bankdrücken Langhantel", [[77.5,8,2],[77.5,7,2],[77.5,6,1]]),
      exLog("ep-max-seit", "Seitheben", [[12,16,2],[12,15,2],[12,14,1]]),
    ],
  },
];

// ─── LENA WEBER ───────────────────────────────────────────────────────────────

const lenaDailyChecks: DailyCheckIn[] = [
  // 2026-05-23 (Fri) Training A – Ernährungsplan Trainingstag
  { id:"dc-athlete-lena-0", athleteId:"athlete-lena", date:"2026-05-23", weight:67.8, measurementTime:"07:00", appetite:3, digestion:4, caffeine:150, steps:11000, cardio:false, training:true, trainingQuality:4, sleepHours:7.5, sleepQuality:4, restingHeartRate:64, hrv:65, spO2:99, bloodPressure:{systolic:112,diastolic:70}, energyLevel:4, stressLevel:3, mood:4, note:"Beine stark, Latzug gut umgesetzt.", mealCompliance:"fully_followed", nutritionStatus:"meal_plan_followed", selectedMealPlanId:"mp-athlete-lena-training" },
  // 2026-05-24 (Sat) Cardio – Kalorientracker genutzt
  { id:"dc-athlete-lena-1", athleteId:"athlete-lena", date:"2026-05-24", weight:67.6, measurementTime:"07:00", appetite:3, digestion:4, caffeine:100, steps:9000, cardio:true, cardioDuration:25, training:false, trainingQuality:3, sleepHours:8.0, sleepQuality:5, restingHeartRate:62, hrv:72, spO2:99, bloodPressure:{systolic:110,diastolic:68}, energyLevel:5, stressLevel:2, mood:5, note:"Cardio lockerer Lauf, gute Erholung.", mealCompliance:"tracked_in_calorie_tracker", nutritionStatus:"calorie_tracker_used" },
  // 2026-05-25 (Sun) Training B – Ernährungsplan Trainingstag
  { id:"dc-athlete-lena-2", athleteId:"athlete-lena", date:"2026-05-25", weight:67.5, measurementTime:"07:00", appetite:4, digestion:4, caffeine:150, steps:13000, cardio:false, training:true, trainingQuality:4, sleepHours:7.0, sleepQuality:4, restingHeartRate:63, hrv:68, spO2:98, bloodPressure:{systolic:112,diastolic:70}, energyLevel:3, stressLevel:2, mood:4, note:"Starkes Push-Training, Energie gut.", mealCompliance:"fully_followed", nutritionStatus:"meal_plan_followed", selectedMealPlanId:"mp-athlete-lena-training" },
  // 2026-05-26 (Mon) Cardio – Ernährungsplan Ruhetag
  { id:"dc-athlete-lena-3", athleteId:"athlete-lena", date:"2026-05-26", weight:67.3, measurementTime:"07:00", appetite:3, digestion:4, caffeine:100, steps:10000, cardio:true, cardioDuration:30, training:false, trainingQuality:3, sleepHours:7.5, sleepQuality:4, restingHeartRate:62, hrv:70, spO2:99, bloodPressure:{systolic:111,diastolic:69}, energyLevel:4, stressLevel:3, mood:4, note:"Cardio morgens, dann entspannter Tag.", mealCompliance:"fully_followed", nutritionStatus:"meal_plan_followed", selectedMealPlanId:"mp-athlete-lena-rest" },
  // 2026-05-27 (Tue) Training A – Kalorientracker genutzt
  { id:"dc-athlete-lena-4", athleteId:"athlete-lena", date:"2026-05-27", weight:67.2, measurementTime:"07:00", appetite:4, digestion:5, caffeine:150, steps:12000, cardio:false, training:true, trainingQuality:5, sleepHours:8.0, sleepQuality:5, restingHeartRate:61, hrv:75, spO2:99, bloodPressure:{systolic:110,diastolic:68}, energyLevel:5, stressLevel:2, mood:5, note:"Beste Trainingseinheit diese Woche!", mealCompliance:"tracked_in_calorie_tracker", nutritionStatus:"calorie_tracker_used" },
  // 2026-05-28 (Wed) Rest – keine genaue Angabe
  { id:"dc-athlete-lena-5", athleteId:"athlete-lena", date:"2026-05-28", weight:67.0, measurementTime:"07:00", appetite:3, digestion:4, caffeine:100, steps:9500, cardio:false, training:false, trainingQuality:3, sleepHours:7.0, sleepQuality:4, restingHeartRate:63, hrv:67, spO2:98, bloodPressure:{systolic:112,diastolic:70}, energyLevel:3, stressLevel:2, mood:4, note:"Abends weniger Reis, Hunger okay.", mealCompliance:"not_followed", nutritionStatus:"no_exact_info", noExactNutritionReason:"Abends spontan weniger gegessen – keine genauen Mengen bekannt.", deviationReason:"Abends weniger gegessen als geplant" },
  // 2026-05-29 (Thu) Rest – Kalorientracker genutzt
  { id:"dc-athlete-lena-6", athleteId:"athlete-lena", date:"2026-05-29", weight:66.9, measurementTime:"07:00", appetite:4, digestion:4, caffeine:100, steps:11500, cardio:false, training:false, trainingQuality:3, sleepHours:7.5, sleepQuality:4, restingHeartRate:62, hrv:69, spO2:99, bloodPressure:{systolic:111,diastolic:69}, energyLevel:4, stressLevel:3, mood:4, note:"", mealCompliance:"tracked_in_calorie_tracker", nutritionStatus:"calorie_tracker_used" },
];

const lenaWeeklyChecks: WeeklyCheckIn[] = [
  {
    id: "wc-athlete-lena-1",
    athleteId: "athlete-lena",
    weekStart: WEEK_START,
    date: "2026-05-29",
    overallWeekRating: 4,
    weekSatisfaction: 4,
    selfSatisfaction: 4,
    nutritionAdherence: 5,
    hungerCravings: "Plan sehr gut eingehalten.",
    trainingRating: 5,
    recoveryRating: 4,
    sleepAvg: 7.6,
    stressAvg: 2.3,
    energyAvg: 4.0,
    specialEvents: "",
    coachNote: "",
    freeNote: "Unterkörpertraining stark, Cardio gut umgesetzt. Energie im Alltag besser.",
  },
];

const lenaCTDays: CalorieTrackerDay[] = DAYS.map((date) => {
  // Deviation 2026-05-28: Reis 150g statt 180g
  const isReisDev = date === "2026-05-28";
  return ctDay(
    "athlete-lena",
    date,
    [
      cte(`lena-${date}-fs`, fB, 100),
      cte(`lena-${date}-fs2`, fE, 100),
    ],
    [
      cte(`lena-${date}-hm`, fH, 150),
      cte(`lena-${date}-hm2`, fR, isReisDev ? 150 : 180),
    ],
  );
});

const lenaTrainingLogs: TrainingLog[] = [
  {
    id: "tl-athlete-lena-20260523-a",
    athleteId: "athlete-lena",
    date: "2026-05-23",
    trainingDayId: "td-lena-a",
    trainingDayName: "Training A – Push",
    durationSeconds: 2400,
    note: "Gut durchgezogen.",
    exercises: [
      exLog("ep-lena-bank", "Bankdrücken Langhantel", [[42.5,9],[42.5,8],[42.5,7]]),
      exLog("ep-lena-seit", "Seitheben", [[6,16],[6,15],[6,14]]),
    ],
  },
  {
    id: "tl-athlete-lena-20260525-b",
    athleteId: "athlete-lena",
    date: "2026-05-25",
    trainingDayId: "td-lena-b",
    trainingDayName: "Training B – Pull/Legs",
    durationSeconds: 2700,
    note: "Latzug sauber.",
    exercises: [
      exLog("ep-lena-latz", "Latzug", [[45,11],[45,10],[45,9]]),
      exLog("ep-lena-knie", "Kniebeuge", [[65,8],[65,7],[65,6]]),
    ],
  },
  {
    id: "tl-athlete-lena-20260527-a",
    athleteId: "athlete-lena",
    date: "2026-05-27",
    trainingDayId: "td-lena-a",
    trainingDayName: "Training A – Push",
    durationSeconds: 2400,
    note: "Seitheben Gewicht erhöht.",
    exercises: [
      exLog("ep-lena-bank", "Bankdrücken Langhantel", [[42.5,10],[42.5,9],[42.5,8]]),
      exLog("ep-lena-seit", "Seitheben", [[7,14],[7,13],[7,12]]),
    ],
  },
];

// ─── TOM SCHNEIDER ────────────────────────────────────────────────────────────

const tomDailyChecks: DailyCheckIn[] = [
  // 2026-05-23 (Fri) Training A – Ernährungsplan Trainingstag
  { id:"dc-athlete-tom-0", athleteId:"athlete-tom", date:"2026-05-23", weight:78.0, measurementTime:"07:00", appetite:4, digestion:4, caffeine:100, steps:8000, cardio:false, training:true, trainingQuality:3, sleepHours:7.5, sleepQuality:4, restingHeartRate:66, hrv:58, spO2:98, bloodPressure:{systolic:125,diastolic:78}, energyLevel:3, stressLevel:2, mood:3, note:"Erste Einheit diese Woche, Technik Fokus.", mealCompliance:"fully_followed", nutritionStatus:"meal_plan_followed", selectedMealPlanId:"mp-athlete-tom-training" },
  // 2026-05-24 (Sat) Rest – keine genaue Angabe
  { id:"dc-athlete-tom-1", athleteId:"athlete-tom", date:"2026-05-24", weight:78.1, measurementTime:"07:00", appetite:4, digestion:4, caffeine:100, steps:6500, cardio:false, training:false, trainingQuality:3, sleepHours:8.0, sleepQuality:5, restingHeartRate:64, hrv:65, spO2:98, bloodPressure:{systolic:124,diastolic:76}, energyLevel:4, stressLevel:1, mood:4, note:"", mealCompliance:"not_followed", nutritionStatus:"no_exact_info", noExactNutritionReason:"Spontanes Familientreffen – Mengen nicht erfasst.", deviationReason:"Zusätzliches Frühstück" },
  // 2026-05-25 (Sun) Training B – Kalorientracker genutzt
  { id:"dc-athlete-tom-2", athleteId:"athlete-tom", date:"2026-05-25", weight:78.2, measurementTime:"07:00", appetite:4, digestion:4, caffeine:100, steps:9000, cardio:false, training:true, trainingQuality:3, sleepHours:7.0, sleepQuality:4, restingHeartRate:65, hrv:60, spO2:98, bloodPressure:{systolic:126,diastolic:79}, energyLevel:3, stressLevel:2, mood:3, note:"Latzug und Kniebeuge, Kniebeuge noch holprig.", mealCompliance:"tracked_in_calorie_tracker", nutritionStatus:"calorie_tracker_used" },
  // 2026-05-26 (Mon) Light Cardio – Ernährungsplan Ruhetag
  { id:"dc-athlete-tom-3", athleteId:"athlete-tom", date:"2026-05-26", weight:78.1, measurementTime:"07:00", appetite:4, digestion:4, caffeine:100, steps:7000, cardio:true, cardioDuration:20, training:false, trainingQuality:3, sleepHours:8.5, sleepQuality:5, restingHeartRate:63, hrv:68, spO2:98, bloodPressure:{systolic:124,diastolic:77}, energyLevel:4, stressLevel:3, mood:4, note:"Kurzes Cardio gemacht.", mealCompliance:"fully_followed", nutritionStatus:"meal_plan_followed", selectedMealPlanId:"mp-athlete-tom-rest" },
  // 2026-05-27 (Tue) Training A – Kalorientracker genutzt
  { id:"dc-athlete-tom-4", athleteId:"athlete-tom", date:"2026-05-27", weight:78.3, measurementTime:"07:00", appetite:4, digestion:4, caffeine:100, steps:8500, cardio:false, training:true, trainingQuality:3, sleepHours:7.5, sleepQuality:4, restingHeartRate:65, hrv:61, spO2:98, bloodPressure:{systolic:125,diastolic:78}, energyLevel:3, stressLevel:2, mood:3, note:"Push wieder! Bankdrücken Fortschritt.", mealCompliance:"tracked_in_calorie_tracker", nutritionStatus:"calorie_tracker_used" },
  // 2026-05-28 (Thu) Rest – Ernährungsplan Ruhetag
  { id:"dc-athlete-tom-5", athleteId:"athlete-tom", date:"2026-05-28", weight:78.4, measurementTime:"07:00", appetite:4, digestion:4, caffeine:100, steps:6000, cardio:false, training:false, trainingQuality:3, sleepHours:8.0, sleepQuality:5, restingHeartRate:63, hrv:66, spO2:99, bloodPressure:{systolic:123,diastolic:76}, energyLevel:4, stressLevel:1, mood:4, note:"", mealCompliance:"fully_followed", nutritionStatus:"meal_plan_followed", selectedMealPlanId:"mp-athlete-tom-rest" },
  // 2026-05-29 (Thu) Rest – Kalorientracker genutzt
  { id:"dc-athlete-tom-6", athleteId:"athlete-tom", date:"2026-05-29", weight:78.5, measurementTime:"07:00", appetite:4, digestion:4, caffeine:100, steps:8000, cardio:false, training:false, trainingQuality:3, sleepHours:7.5, sleepQuality:4, restingHeartRate:64, hrv:62, spO2:98, bloodPressure:{systolic:124,diastolic:77}, energyLevel:4, stressLevel:2, mood:4, note:"Gute Woche, Motivation hoch.", mealCompliance:"tracked_in_calorie_tracker", nutritionStatus:"calorie_tracker_used" },
];

const tomWeeklyChecks: WeeklyCheckIn[] = [
  {
    id: "wc-athlete-tom-1",
    athleteId: "athlete-tom",
    weekStart: WEEK_START,
    date: "2026-05-29",
    overallWeekRating: 3,
    weekSatisfaction: 3,
    selfSatisfaction: 3,
    nutritionAdherence: 3,
    hungerCravings: "Protein klappt, Mahlzeitenstruktur noch ausbaufähig.",
    trainingRating: 3,
    recoveryRating: 4,
    sleepAvg: 7.8,
    stressAvg: 1.8,
    energyAvg: 3.5,
    specialEvents: "",
    coachNote: "",
    freeNote: "Technik wird besser, noch unsicher bei Kniebeugen. Motivation hoch, braucht klare Trainingsroutine.",
  },
];

const tomCTDays: CalorieTrackerDay[] = DAYS.map((date) => {
  // Deviation 2026-05-24: 4 Eier statt 3
  const isEiDev = date === "2026-05-24";
  return ctDay(
    "athlete-tom",
    date,
    [
      cte(`tom-${date}-fs`, fB, 200),
      cte(`tom-${date}-fs2`, fE, isEiDev ? 400 : 300),
    ],
    [
      cte(`tom-${date}-hm`, fH, 200),
      cte(`tom-${date}-hm2`, fR, 300),
    ],
  );
});

const tomTrainingLogs: TrainingLog[] = [
  {
    id: "tl-athlete-tom-20260523-a",
    athleteId: "athlete-tom",
    date: "2026-05-23",
    trainingDayId: "td-tom-a",
    trainingDayName: "Training A – Push",
    durationSeconds: 2400,
    note: "Technik Bankdrücken fokussiert.",
    exercises: [
      exLog("ep-tom-bank", "Bankdrücken Langhantel", [[50,8],[50,7],[50,6]]),
      exLog("ep-tom-seit", "Seitheben", [[7,15],[7,14],[7,13]]),
    ],
  },
  {
    id: "tl-athlete-tom-20260525-b",
    athleteId: "athlete-tom",
    date: "2026-05-25",
    trainingDayId: "td-tom-b",
    trainingDayName: "Training B – Pull/Legs",
    durationSeconds: 2700,
    note: "Kniebeuge noch unsicher, Tiefe verbessern.",
    exercises: [
      exLog("ep-tom-latz", "Latzug", [[50,10],[50,9],[50,8]]),
      exLog("ep-tom-knie", "Kniebeuge", [[70,8],[70,7],[70,6]]),
    ],
  },
  {
    id: "tl-athlete-tom-20260527-a",
    athleteId: "athlete-tom",
    date: "2026-05-27",
    trainingDayId: "td-tom-a",
    trainingDayName: "Training A – Push",
    durationSeconds: 2400,
    note: "Gewicht erhöht auf 52.5 kg.",
    exercises: [
      exLog("ep-tom-bank", "Bankdrücken Langhantel", [[52.5,8],[52.5,7],[52.5,6]]),
      exLog("ep-tom-seit", "Seitheben", [[7,16],[7,15],[7,14]]),
    ],
  },
];

// ─── Meal Plans ───────────────────────────────────────────────────────────────

const maxMealPlans: MealPlan[] = [
  {
    id: "mp-athlete-max-training",
    athleteId: "athlete-max",
    title: "Trainingstag",
    coachNote: "Protein mind. 170 g. Kohlenhydrate um Training herum konzentrieren.",
    createdAt: "2026-05-01",
    meals: [
      {
        id: "m-max-t-fs",
        name: "Frühstück",
        time: "07:30",
        entries: [
          { foodItemId: "food-banane", foodItem: fB, amountG: 100 },
          { foodItemId: "food-ei",     foodItem: fE, amountG: 200 },
        ],
      },
      {
        id: "m-max-t-hm",
        name: "Hauptmahlzeit",
        time: "12:30",
        entries: [
          { foodItemId: "food-haehnchenbrust", foodItem: fH, amountG: 180 },
          { foodItemId: "food-reis-gekocht",   foodItem: fR, amountG: 250 },
        ],
      },
    ],
  },
  {
    id: "mp-athlete-max-rest",
    athleteId: "athlete-max",
    title: "Ruhetag",
    coachNote: "Etwas weniger Kohlenhydrate an Ruhetagen, Protein gleich hoch halten.",
    createdAt: "2026-05-01",
    meals: [
      {
        id: "m-max-r-fs",
        name: "Frühstück",
        time: "08:00",
        entries: [
          { foodItemId: "food-banane", foodItem: fB, amountG: 100 },
          { foodItemId: "food-ei",     foodItem: fE, amountG: 200 },
        ],
      },
      {
        id: "m-max-r-hm",
        name: "Hauptmahlzeit",
        time: "12:30",
        entries: [
          { foodItemId: "food-haehnchenbrust", foodItem: fH, amountG: 180 },
          { foodItemId: "food-reis-gekocht",   foodItem: fR, amountG: 150 },
        ],
      },
    ],
  },
];

const lenaMealPlans: MealPlan[] = [
  {
    id: "mp-athlete-lena-training",
    athleteId: "athlete-lena",
    title: "Trainingstag",
    coachNote: "Kaloriendefizit beibehalten, Protein hoch halten.",
    createdAt: "2026-05-08",
    meals: [
      {
        id: "m-lena-t-fs",
        name: "Frühstück",
        time: "08:00",
        entries: [
          { foodItemId: "food-banane", foodItem: fB, amountG: 100 },
          { foodItemId: "food-ei",     foodItem: fE, amountG: 100 },
        ],
      },
      {
        id: "m-lena-t-hm",
        name: "Hauptmahlzeit",
        time: "12:30",
        entries: [
          { foodItemId: "food-haehnchenbrust", foodItem: fH, amountG: 150 },
          { foodItemId: "food-reis-gekocht",   foodItem: fR, amountG: 180 },
        ],
      },
    ],
  },
  {
    id: "mp-athlete-lena-rest",
    athleteId: "athlete-lena",
    title: "Ruhetag",
    coachNote: "Noch leicht reduzierte Kohlenhydrate, Defizit aufrechterhalten.",
    createdAt: "2026-05-08",
    meals: [
      {
        id: "m-lena-r-fs",
        name: "Frühstück",
        time: "08:00",
        entries: [
          { foodItemId: "food-banane", foodItem: fB, amountG: 100 },
          { foodItemId: "food-ei",     foodItem: fE, amountG: 100 },
        ],
      },
      {
        id: "m-lena-r-hm",
        name: "Hauptmahlzeit",
        time: "12:30",
        entries: [
          { foodItemId: "food-haehnchenbrust", foodItem: fH, amountG: 150 },
          { foodItemId: "food-reis-gekocht",   foodItem: fR, amountG: 120 },
        ],
      },
    ],
  },
];

const tomMealPlans: MealPlan[] = [
  {
    id: "mp-athlete-tom-training",
    athleteId: "athlete-tom",
    title: "Trainingstag",
    coachNote: "Kalorienüberschuss halten, ausreichend Protein sicherstellen.",
    createdAt: "2026-05-10",
    meals: [
      {
        id: "m-tom-t-fs",
        name: "Frühstück",
        time: "07:00",
        entries: [
          { foodItemId: "food-banane", foodItem: fB, amountG: 200 },
          { foodItemId: "food-ei",     foodItem: fE, amountG: 300 },
        ],
      },
      {
        id: "m-tom-t-hm",
        name: "Hauptmahlzeit",
        time: "12:00",
        entries: [
          { foodItemId: "food-haehnchenbrust", foodItem: fH, amountG: 200 },
          { foodItemId: "food-reis-gekocht",   foodItem: fR, amountG: 300 },
        ],
      },
    ],
  },
  {
    id: "mp-athlete-tom-rest",
    athleteId: "athlete-tom",
    title: "Ruhetag",
    coachNote: "Leicht reduzierte Kalorien an Ruhetagen, Protein gleich halten.",
    createdAt: "2026-05-10",
    meals: [
      {
        id: "m-tom-r-fs",
        name: "Frühstück",
        time: "07:00",
        entries: [
          { foodItemId: "food-banane", foodItem: fB, amountG: 200 },
          { foodItemId: "food-ei",     foodItem: fE, amountG: 300 },
        ],
      },
      {
        id: "m-tom-r-hm",
        name: "Hauptmahlzeit",
        time: "12:00",
        entries: [
          { foodItemId: "food-haehnchenbrust", foodItem: fH, amountG: 200 },
          { foodItemId: "food-reis-gekocht",   foodItem: fR, amountG: 200 },
        ],
      },
    ],
  },
];

// ─── Athletes export ──────────────────────────────────────────────────────────
export const athletes: Athlete[] = [
  // ── Max Mustermann ──────────────────────────────────────────────────────────
  {
    id: "athlete-max",
    name: "Max Mustermann",
    pin: "1111",
    avatarInitials: "MM",
    startWeight: 91,
    currentWeight: 89.4,
    targetWeight: 85,
    goalType: "recomp",
    goalText: "Körperkomposition verbessern – Muskelaufbau bei gleichzeitigem Fettabbau",
    checkInDay: 5,
    height: 180,
    startDate: "2026-05-01",
    experienceLevel: "advanced",
    trackingDevice: "apple_watch",
    dailyCheckConfig: fullConfig,
    coachNote: "Fokus Recomp: progressive Überlastung, Kalorienbalance beachten.",
    visibleNote: "Diese Woche Fokus auf Technik und ausreichend Schlaf.",
    dailyCheckIns: maxDailyChecks,
    weeklyCheckIns: maxWeeklyChecks,
    weeklyAdjustments: [],
    trainingLogs: maxTrainingLogs,
    calorieTrackerDays: maxCTDays,
    mealPlans: maxMealPlans,
    trainingPlan: {
      id: "tp-athlete-max-1",
      athleteId: "athlete-max",
      title: "Push / Pull-Legs – Flexibel",
      mode: "flexible",
      coachNote: "Fokus auf progressive Überlastung. RIR 1–2 als Richtlinie.",
      createdAt: "2026-05-01",
      days: [
        {
          id: "td-max-a",
          dayName: "Training A",
          label: "Push",
          exercises: [
            { id:"ep-max-bank", name:"Bankdrücken Langhantel", sets:3, reps:"6-10", rir:2, restSeconds:180, muscleGroup:"Brust", videoUrl:"https://example.com/bankdruecken", exerciseDbNote:"Saubere Schulterblattposition, kontrollierte Exzentrik.", exerciseDbId:"ex-bankdruecken" },
            { id:"ep-max-seit", name:"Seitheben", sets:3, reps:"12-20", rir:2, restSeconds:90, muscleGroup:"Schulter", videoUrl:"https://example.com/seitheben", exerciseDbNote:"Kontrollierte Bewegung, nicht schwingen.", exerciseDbId:"ex-seitheben" },
          ],
        },
        {
          id: "td-max-b",
          dayName: "Training B",
          label: "Pull/Legs",
          exercises: [
            { id:"ep-max-latz", name:"Latzug", sets:3, reps:"8-12", rir:2, restSeconds:120, muscleGroup:"Rücken", videoUrl:"https://example.com/latzug", exerciseDbNote:"Ellbogen nach unten ziehen, nicht reißen.", exerciseDbId:"ex-latzug" },
            { id:"ep-max-knie", name:"Kniebeuge", sets:3, reps:"6-10", rir:2, restSeconds:180, muscleGroup:"Beine", videoUrl:"https://example.com/kniebeuge", exerciseDbNote:"Tiefe kontrollieren, Rumpfspannung halten.", exerciseDbId:"ex-kniebeuge" },
          ],
        },
      ],
    },
    supplementPlan: {
      id: "sp-athlete-max-1",
      athleteId: "athlete-max",
      coachNote: "Basis-Supplements für Recomp. Kreatin täglich, Whey nur bei Bedarf.",
      supplements: [
        { id:"supp-max-kreatin", name:"Kreatin Monohydrat", dosage:"5 g", standardDosage:"5 g täglich", timing:"morgens oder nach dem Training", instructions:"Mit Wasser einnehmen, täglich auch an Ruhetagen.", link:"https://example.com/kreatin", supplementDBId:"supp-kreatin" },
        { id:"supp-max-whey", name:"Whey Protein", dosage:"30 g bei Bedarf", standardDosage:"30 g nach Bedarf", timing:"flexibel", instructions:"Bei Bedarf zur Proteinabdeckung nutzen.", link:"https://example.com/whey", supplementDBId:"supp-whey" },
      ],
    },
    notes: [
      { id:"note-max-1", athleteId:"athlete-max", type:"coach_visible", content:"Sehr guter Start! Gewicht bewegt sich in die richtige Richtung.", createdAt:"2026-05-08" },
      { id:"note-max-2", athleteId:"athlete-max", type:"coach_internal", content:"Testathlet für Recomp-Setup. Alle Funktionen testbar.", createdAt:"2026-05-01" },
    ],
    joinedAt: "2026-05-01",
  },

  // ── Lena Weber ──────────────────────────────────────────────────────────────
  {
    id: "athlete-lena",
    name: "Lena Weber",
    pin: "2222",
    avatarInitials: "LW",
    startWeight: 68,
    currentWeight: 66.9,
    targetWeight: 64,
    goalType: "cut",
    goalText: "Definierter werden und Trainingsleistung möglichst halten",
    checkInDay: 3,
    height: 168,
    startDate: "2026-05-08",
    experienceLevel: "intermediate",
    trackingDevice: "garmin",
    dailyCheckConfig: fullConfig,
    coachNote: "Cut-Phase: Defizit halten, Trainingsleistung schützen.",
    visibleNote: "Gut gemacht diese Woche! Kalorienplan weiter halten.",
    dailyCheckIns: lenaDailyChecks,
    weeklyCheckIns: lenaWeeklyChecks,
    weeklyAdjustments: [],
    trainingLogs: lenaTrainingLogs,
    calorieTrackerDays: lenaCTDays,
    mealPlans: lenaMealPlans,
    trainingPlan: {
      id: "tp-athlete-lena-1",
      athleteId: "athlete-lena",
      title: "Push / Pull-Legs – Flexibel",
      mode: "flexible",
      coachNote: "Leistung erhalten im Cut. Volumen bei Bedarf leicht reduzieren.",
      createdAt: "2026-05-08",
      days: [
        {
          id: "td-lena-a",
          dayName: "Training A",
          label: "Push",
          exercises: [
            { id:"ep-lena-bank", name:"Bankdrücken Langhantel", sets:3, reps:"6-10", rir:2, restSeconds:180, muscleGroup:"Brust", videoUrl:"https://example.com/bankdruecken", exerciseDbNote:"Saubere Schulterblattposition, kontrollierte Exzentrik.", exerciseDbId:"ex-bankdruecken" },
            { id:"ep-lena-seit", name:"Seitheben", sets:3, reps:"12-20", rir:2, restSeconds:90, muscleGroup:"Schulter", videoUrl:"https://example.com/seitheben", exerciseDbNote:"Kontrollierte Bewegung, nicht schwingen.", exerciseDbId:"ex-seitheben" },
          ],
        },
        {
          id: "td-lena-b",
          dayName: "Training B",
          label: "Pull/Legs",
          exercises: [
            { id:"ep-lena-latz", name:"Latzug", sets:3, reps:"8-12", rir:2, restSeconds:120, muscleGroup:"Rücken", videoUrl:"https://example.com/latzug", exerciseDbNote:"Ellbogen nach unten ziehen, nicht reißen.", exerciseDbId:"ex-latzug" },
            { id:"ep-lena-knie", name:"Kniebeuge", sets:3, reps:"6-10", rir:2, restSeconds:180, muscleGroup:"Beine", videoUrl:"https://example.com/kniebeuge", exerciseDbNote:"Tiefe kontrollieren, Rumpfspannung halten.", exerciseDbId:"ex-kniebeuge" },
          ],
        },
      ],
    },
    supplementPlan: {
      id: "sp-athlete-lena-1",
      athleteId: "athlete-lena",
      coachNote: "Fokus auf einfache Supplementroutine. Omega-3 optional, Whey bei Proteinlücken.",
      supplements: [
        { id:"supp-lena-omega3", name:"Omega-3", dosage:"2 Kapseln", standardDosage:"2 Kapseln täglich", timing:"zu einer fetthaltigen Mahlzeit", instructions:"Mit einer Mahlzeit einnehmen.", link:"https://example.com/omega3", supplementDBId:"supp-omega3" },
        { id:"supp-lena-whey", name:"Whey Protein", dosage:"25 g bei Bedarf", standardDosage:"30 g nach Bedarf", timing:"flexibel", instructions:"Bei Bedarf zur Proteinabdeckung nutzen.", link:"https://example.com/whey", supplementDBId:"supp-whey" },
      ],
    },
    notes: [
      { id:"note-lena-1", athleteId:"athlete-lena", type:"coach_visible", content:"Konstante Leistung im Cut. Weiter so!", createdAt:"2026-05-15" },
      { id:"note-lena-2", athleteId:"athlete-lena", type:"coach_internal", content:"Fortschritt gut, Gewichtstrend positiv.", createdAt:"2026-05-08" },
    ],
    joinedAt: "2026-05-08",
  },

  // ── Tom Schneider ────────────────────────────────────────────────────────────
  {
    id: "athlete-tom",
    name: "Tom Schneider",
    pin: "3333",
    avatarInitials: "TS",
    startWeight: 78,
    currentWeight: 78.5,
    targetWeight: 83,
    goalType: "bulk",
    goalText: "Muskelaufbau mit kontrollierter Gewichtszunahme",
    checkInDay: 1,
    height: 183,
    startDate: "2026-05-10",
    experienceLevel: "beginner",
    trackingDevice: "none",
    dailyCheckConfig: fullConfig,
    coachNote: "Anfänger – klare Struktur wichtig. Technik vor Gewicht.",
    visibleNote: "Fokus auf regelmäßige Mahlzeiten und Trainingsroutine.",
    dailyCheckIns: tomDailyChecks,
    weeklyCheckIns: tomWeeklyChecks,
    weeklyAdjustments: [],
    trainingLogs: tomTrainingLogs,
    calorieTrackerDays: tomCTDays,
    mealPlans: tomMealPlans,
    trainingPlan: {
      id: "tp-athlete-tom-1",
      athleteId: "athlete-tom",
      title: "Push / Pull-Legs – Flexibel",
      mode: "flexible",
      coachNote: "Technik vor Gewicht. Regelmäßigkeit ist wichtiger als Intensität.",
      createdAt: "2026-05-10",
      days: [
        {
          id: "td-tom-a",
          dayName: "Training A",
          label: "Push",
          exercises: [
            { id:"ep-tom-bank", name:"Bankdrücken Langhantel", sets:3, reps:"6-10", rir:2, restSeconds:180, muscleGroup:"Brust", videoUrl:"https://example.com/bankdruecken", exerciseDbNote:"Saubere Schulterblattposition, kontrollierte Exzentrik.", exerciseDbId:"ex-bankdruecken" },
            { id:"ep-tom-seit", name:"Seitheben", sets:3, reps:"12-20", rir:2, restSeconds:90, muscleGroup:"Schulter", videoUrl:"https://example.com/seitheben", exerciseDbNote:"Kontrollierte Bewegung, nicht schwingen.", exerciseDbId:"ex-seitheben" },
          ],
        },
        {
          id: "td-tom-b",
          dayName: "Training B",
          label: "Pull/Legs",
          exercises: [
            { id:"ep-tom-latz", name:"Latzug", sets:3, reps:"8-12", rir:2, restSeconds:120, muscleGroup:"Rücken", videoUrl:"https://example.com/latzug", exerciseDbNote:"Ellbogen nach unten ziehen, nicht reißen.", exerciseDbId:"ex-latzug" },
            { id:"ep-tom-knie", name:"Kniebeuge", sets:3, reps:"6-10", rir:2, restSeconds:180, muscleGroup:"Beine", videoUrl:"https://example.com/kniebeuge", exerciseDbNote:"Tiefe kontrollieren, Rumpfspannung halten.", exerciseDbId:"ex-kniebeuge" },
          ],
        },
      ],
    },
    supplementPlan: {
      id: "sp-athlete-tom-1",
      athleteId: "athlete-tom",
      coachNote: "Minimal halten: Kreatin täglich, Whey nur wenn Protein nicht erreicht wird.",
      supplements: [
        { id:"supp-tom-kreatin", name:"Kreatin Monohydrat", dosage:"5 g", standardDosage:"5 g täglich", timing:"morgens oder nach dem Training", instructions:"Mit Wasser einnehmen, täglich auch an Ruhetagen.", link:"https://example.com/kreatin", supplementDBId:"supp-kreatin" },
        { id:"supp-tom-whey", name:"Whey Protein", dosage:"30 g bei Bedarf", standardDosage:"30 g nach Bedarf", timing:"flexibel", instructions:"Bei Bedarf zur Proteinabdeckung nutzen.", link:"https://example.com/whey", supplementDBId:"supp-whey" },
      ],
    },
    notes: [
      { id:"note-tom-1", athleteId:"athlete-tom", type:"coach_visible", content:"Guter Start! Fokus auf Regelmäßigkeit.", createdAt:"2026-05-17" },
      { id:"note-tom-2", athleteId:"athlete-tom", type:"coach_internal", content:"Anfänger, braucht klare Struktur und Technikfeedback.", createdAt:"2026-05-10" },
    ],
    joinedAt: "2026-05-10",
  },
];
