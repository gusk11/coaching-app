import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const NOW = "2026-06-04T00:00:00.000Z";

// ─── New exercises ─────────────────────────────────────────────────────────────

const newExercises = [
  { id: "ex-jm-press", name: "JM Press", muscle_group: "Trizeps", equipment: "Smith-Maschine", notes: "An der Multipresse; Stange im untersten Punkt auf Schulterhöhe." },
  { id: "ex-leg-raises", name: "Leg Raises", muscle_group: "Bauch", equipment: "Körpergewicht", notes: "Hüfte einrollen und Richtung Brustbein bringen." },
  { id: "ex-beinstrecker-unilateral", name: "Beinstrecker unilateral", muscle_group: "Quadrizeps", equipment: "Maschine", notes: "Kniegelenk auf Drehgelenk ausrichten. Kontrollierte Exzentrik." },
  { id: "ex-seitheben-brustgestuetzt", name: "Kurzhantel Seitheben brustgestützt", muscle_group: "Schultern", equipment: "Kurzhantel", notes: "Stehend an Bank angelehnt." },
  { id: "ex-lateral-arounds", name: "Lateral Arounds", muscle_group: "Schultern", equipment: "Kabelzug", notes: "Umlenkrolle auf Handhöhe; Position leicht vor dem Kabelturm, cuffed." },
  { id: "ex-t-bar-rudern", name: "T-Bar Rudern brustgestützt", muscle_group: "Rücken", equipment: "Maschine", notes: "Schulterblätter vollständig lösen und kontrahieren; Brust ganze Zeit stolz lassen." },
  { id: "ex-single-arm-cable-pushdown", name: "Single Arm Cable Pushdown", muscle_group: "Trizeps", equipment: "Kabelzug", notes: "Ellbogen fixiert, vollständige Streckung am Ende." },
  { id: "ex-beinbeuger-sitzend", name: "Beinbeuger sitzend", muscle_group: "Beine", equipment: "Maschine", notes: "Aktiv in Polster reinziehen und Bauch anspannen." },
  { id: "ex-peak-contraction-curls", name: "Peak Contraction Curls", muscle_group: "Bizeps", equipment: "Kabelzug", notes: "Maximale Kontraktion am Ende der Bewegung halten." },
  { id: "ex-single-arm-incline-cable-curls", name: "Single Arm Incline Cable Curls", muscle_group: "Bizeps", equipment: "Kabelzug", notes: "Ellbogen hinter dem Körper für maximalen Stretch." },
  { id: "ex-rudermaschine-eng-unilateral", name: "Rudermaschine eng unilateral", muscle_group: "Rücken", equipment: "Maschine", notes: "Stack loaded; unilateral ausführen." },
  { id: "ex-rudermaschine-breit", name: "Rudermaschine breit", muscle_group: "Rücken", equipment: "Maschine", notes: "Schulterblätter vollständig lösen und kontrahieren." },
  { id: "ex-crunch-maschine", name: "Crunch Machine", muscle_group: "Bauch", equipment: "Maschine", notes: "Brustbein zum Schambein ziehen." },
];

// ─── New custom foods ──────────────────────────────────────────────────────────

const newCustomFoods = [
  { id: "cf-ricemeal", name: "Ricemeal", category: "Kohlenhydrate", serving_label: "100 g", kcal_per_100g: 373, protein_per_100g: 8, carbs_per_100g: 82.7, fat_per_100g: 1.3, fiber_per_100g: 0, salt_per_100g: 0, default_amount: 75, is_active: true },
  { id: "cf-zartbitter-85", name: "Zartbitterschokolade >85 %", category: "Fettquelle", serving_label: "100 g", kcal_per_100g: 600, protein_per_100g: 10, carbs_per_100g: 20, fat_per_100g: 50, fiber_per_100g: 11, salt_per_100g: 0.02, default_amount: 20, is_active: true },
  { id: "cf-maltodextrin", name: "Maltodextrin", category: "Kohlenhydrate", serving_label: "100 g", kcal_per_100g: 412, protein_per_100g: 0, carbs_per_100g: 100, fat_per_100g: 0, fiber_per_100g: 0, salt_per_100g: 0, default_amount: 25, is_active: true },
  { id: "cf-elektrolyte", name: "Elektrolyte / Basepowder", category: "Weitere", serving_label: "100 g", kcal_per_100g: 0, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 0, fiber_per_100g: 0, salt_per_100g: 0, default_amount: 5, is_active: true },
  { id: "cf-sauerkraut", name: "Sauerkraut", category: "Gemüse", serving_label: "100 g", kcal_per_100g: 20, protein_per_100g: 2, carbs_per_100g: 4, fat_per_100g: 0, fiber_per_100g: 1.5, salt_per_100g: 0.7, default_amount: 100, is_active: true },
  { id: "cf-toast-gross", name: "Toast groß", category: "Kohlenhydrate", serving_label: "1 Stück", kcal_per_100g: 100, protein_per_100g: 3, carbs_per_100g: 18, fat_per_100g: 2, fiber_per_100g: 1, salt_per_100g: 0.5, default_amount: 1, is_active: true },
  { id: "cf-nuesse-gemischt", name: "Nüsse (gemischt)", category: "Fettquelle", serving_label: "100 g", kcal_per_100g: 630, protein_per_100g: 25, carbs_per_100g: 15, fat_per_100g: 50, fiber_per_100g: 5, salt_per_100g: 0.02, default_amount: 30, is_active: true },
  { id: "cf-omega3-kapsel", name: "Omega 3 Kapsel", category: "Weitere", serving_label: "1 Kapsel", kcal_per_100g: 9, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 1, fiber_per_100g: 0, salt_per_100g: 0, default_amount: 1, is_active: true },
  { id: "cf-ei-standard", name: "Ei", category: "Protein", serving_label: "1 Stück", kcal_per_100g: 74, protein_per_100g: 7, carbs_per_100g: 1, fat_per_100g: 5, fiber_per_100g: 0, salt_per_100g: 0.2, default_amount: 1, is_active: true },
];

// ─── New supplement DB entries ─────────────────────────────────────────────────

const newSupplements = [
  {
    id: "supp-elektrolyte",
    name: "Elektrolyte / Basepowder",
    category: "Mineralstoffe",
    standard_dosage: "5 g täglich",
    timing: "morgens und intra workout",
    instructions: "In Wasser einrühren und trinken.",
    link: "https://vitaminversand24.com/vit4_elektrolyte_powder_big",
  },
  {
    id: "supp-maltodextrin",
    name: "Maltodextrin / Cluster Dextrin",
    category: "Kohlenhydrate",
    standard_dosage: "25–50 g intra workout",
    timing: "intra workout",
    instructions: "In Wasser einrühren und während des Trainings trinken.",
    link: "https://vitaminversand24.com/gen_cyclic_cluster_dextrin",
  },
];

// ─── Food snapshots (camelCase, embedded in MealEntry.foodItem) ───────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function snap(id: string, name: string, category: string, servingLabel: string, kcal: number, protein: number, carbs: number, fat: number, fiber: number, salt: number, isCustom = true): any {
  return { id, name, category, servingLabel, kcalPer100g: kcal, proteinPer100g: protein, carbsPer100g: carbs, fatPer100g: fat, fiberPer100g: fiber, saltPer100g: salt, isCustomFood: isCustom };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FOODS: Record<string, any> = {
  // New custom foods
  "cf-ricemeal":        snap("cf-ricemeal",        "Ricemeal",                 "Kohlenhydrate", "100 g",    373, 8,  82.7, 1.3, 0,    0),
  "cf-zartbitter-85":   snap("cf-zartbitter-85",   "Zartbitterschokolade >85 %","Fettquelle",   "100 g",    600, 10, 20,   50,  11,   0.02),
  "cf-maltodextrin":    snap("cf-maltodextrin",     "Maltodextrin",             "Kohlenhydrate", "100 g",    412, 0,  100,  0,   0,    0),
  "cf-elektrolyte":     snap("cf-elektrolyte",      "Elektrolyte / Basepowder", "Weitere",       "100 g",    0,   0,  0,    0,   0,    0),
  "cf-sauerkraut":      snap("cf-sauerkraut",       "Sauerkraut",               "Gemüse",        "100 g",    20,  2,  4,    0,   1.5,  0.7),
  "cf-toast-gross":     snap("cf-toast-gross",      "Toast groß",               "Kohlenhydrate", "1 Stück",  100, 3,  18,   2,   1,    0.5),
  "cf-nuesse-gemischt": snap("cf-nuesse-gemischt",  "Nüsse (gemischt)",         "Fettquelle",    "100 g",    630, 25, 15,   50,  5,    0.02),
  "cf-omega3-kapsel":   snap("cf-omega3-kapsel",    "Omega 3 Kapsel",           "Weitere",       "1 Kapsel", 9,   0,  0,    1,   0,    0),
  "cf-ei-standard":     snap("cf-ei-standard",      "Ei",                       "Protein",       "1 Stück",  74,  7,  1,    5,   0,    0.2),
  // Existing custom foods (from custom_foods table)
  "food-whey-protein":          snap("food-whey-protein",          "Whey Protein",                  "Protein",       "100 g",  380, 76, 8,  6,    0,   0.5),
  "food-banane":                snap("food-banane",                "Banane",                        "Obst",          "100 g",  89,  1.1,23, 0.3,  2.6, 0.01),
  "food-reis-ungekocht":        snap("food-reis-ungekocht",        "Reis ungekocht",                "Kohlenhydrate", "100 g",  350, 7,  78, 0.8,  1.3, 0.01),
  "food-haehnchenbrust":        snap("food-haehnchenbrust",        "Hähnchenbrust",                 "Protein",       "100 g",  110, 23, 0,  1.5,  0,   0.2),
  "food-gemuesemix-unter-50kcal": snap("food-gemuesemix-unter-50kcal", "Gemüsemix unter 50 kcal pro 100 g", "Gemüse", "100 g", 40, 2,  6,  0.5,  3,   0.05),
  "food-olivenoel":             snap("food-olivenoel",             "Olivenöl",                      "Fettquelle",    "100 g",  884, 0,  0,  100,  0,   0),
  "food-eiklar":                snap("food-eiklar",                "Eiklar",                        "Protein",       "100 g",  48,  11, 0.7,0.2,  0,   0.4),
  "food-avocado":               snap("food-avocado",               "Avocado",                       "Fettquelle",    "100 g",  160, 2,  2,  15,   7,   0.01),
  "food-haferflocken":          snap("food-haferflocken",          "Haferflocken",                  "Kohlenhydrate", "100 g",  370, 13.5,58.7,7,  10,  0.02),
  "food-beerenmix-tk":          snap("food-beerenmix-tk",          "Beerenmix TK",                  "Obst",          "100 g",  45,  1,  8,  0.5,  4,   0.01),
  "food-apfel":                 snap("food-apfel",                 "Apfel",                         "Obst",          "100 g",  52,  0.3,14, 0.2,  2.4, 0.01),
  "food-skyr-natur":            snap("food-skyr-natur",            "Skyr Natur",                    "Protein",       "100 g",  63,  11, 4,  0.2,  0,   0.1),
};

function entry(id: string, foodId: string, amountG: number) {
  const food = FOODS[foodId];
  return { foodItemId: foodId, foodItem: food, amountG, id };
}

// ─── Meal Plans ────────────────────────────────────────────────────────────────

function buildMealPlans(athleteId: string) {
  const trainingDayPlan = {
    id: "mp-f-training-001",
    athleteId,
    title: "Mealplan f – Trainingstag",
    planType: "macro_targets",
    macroTargets: { kcal: 2553, protein: 211, carbs: 292, fat: 55 },
    coachNote: "Mahlzeitenreihenfolge kann rotieren. Pre-Workout-Meal muss immer die letzte Mahlzeit vor dem Training sein. Intra-Workout während des Trainings. Post-Workout ist die erste Mahlzeit danach. Alles im rohen/unverarbeiteten Zustand wiegen. Max. 50 g Zero-Soßen pro Tag.",
    createdAt: NOW,
    meals: [
      {
        id: "m-f-tr-1",
        name: "Meal 1 – Pre Workout",
        entries: [
          entry("me-f-tr-1-1", "cf-ricemeal",      75),
          entry("me-f-tr-1-2", "food-whey-protein", 50),
          entry("me-f-tr-1-3", "food-banane",       100),
          entry("me-f-tr-1-4", "cf-zartbitter-85",  10),
          entry("me-f-tr-1-5", "cf-omega3-kapsel",  400), // 4 Kapseln
        ],
      },
      {
        id: "m-f-tr-1-1",
        name: "Intra Workout",
        entries: [
          entry("me-f-tr-intra-1", "cf-maltodextrin", 25),
          entry("me-f-tr-intra-2", "cf-elektrolyte",  5),
        ],
      },
      {
        id: "m-f-tr-2",
        name: "Meal 2 – Post Workout",
        entries: [
          entry("me-f-tr-2-1", "food-reis-ungekocht",         50),
          entry("me-f-tr-2-2", "food-haehnchenbrust",         200),
          entry("me-f-tr-2-3", "food-gemuesemix-unter-50kcal",200),
          entry("me-f-tr-2-4", "food-olivenoel",              10),
          entry("me-f-tr-2-5", "cf-sauerkraut",               50),
        ],
      },
      {
        id: "m-f-tr-3",
        name: "Meal 3",
        entries: [
          entry("me-f-tr-3-1", "cf-toast-gross",              100), // 1 Stück
          entry("me-f-tr-3-2", "food-eiklar",                 200),
          entry("me-f-tr-3-3", "food-gemuesemix-unter-50kcal",200),
          entry("me-f-tr-3-4", "food-avocado",                50),
          entry("me-f-tr-3-5", "cf-sauerkraut",               50),
        ],
      },
      {
        id: "m-f-tr-4",
        name: "Meal 4",
        entries: [
          entry("me-f-tr-4-1", "food-haferflocken",  50),
          entry("me-f-tr-4-2", "food-whey-protein",  50),
          entry("me-f-tr-4-3", "food-beerenmix-tk",  200),
          entry("me-f-tr-4-4", "cf-nuesse-gemischt", 20),
          entry("me-f-tr-4-5", "food-apfel",         150),
        ],
      },
    ],
  };

  const restDayPlan = {
    id: "mp-f-rest-001",
    athleteId,
    title: "Mealplan f – Ruhetag",
    planType: "macro_targets",
    macroTargets: { kcal: 2133, protein: 204, carbs: 175, fat: 65 },
    coachNote: "Mahlzeitenreihenfolge kann rotieren. Alles im rohen/unverarbeiteten Zustand wiegen. Max. 50 g Zero-Soßen pro Tag.",
    createdAt: NOW,
    meals: [
      {
        id: "m-f-re-1",
        name: "Meal 1",
        entries: [
          // Toast groß with Menge 0 → omitted
          entry("me-f-re-1-1", "cf-ei-standard",              300), // 3 Stück
          entry("me-f-re-1-2", "food-haehnchenbrust",         100),
          entry("me-f-re-1-3", "food-gemuesemix-unter-50kcal",200),
          entry("me-f-re-1-4", "food-apfel",                  150),
          entry("me-f-re-1-5", "cf-omega3-kapsel",            400), // 4 Kapseln
        ],
      },
      {
        id: "m-f-re-2",
        name: "Meal 2",
        entries: [
          entry("me-f-re-2-1", "food-reis-ungekocht",          50),
          entry("me-f-re-2-2", "food-haehnchenbrust",          200),
          entry("me-f-re-2-3", "food-gemuesemix-unter-50kcal", 200),
          entry("me-f-re-2-4", "food-avocado",                 100),
          entry("me-f-re-2-5", "cf-sauerkraut",                100),
        ],
      },
      {
        id: "m-f-re-3",
        name: "Meal 3",
        entries: [
          entry("me-f-re-3-1", "food-haferflocken",   50),
          entry("me-f-re-3-2", "food-whey-protein",   50),
          entry("me-f-re-3-3", "food-beerenmix-tk",   100),
          entry("me-f-re-3-4", "cf-zartbitter-85",    10),
          entry("me-f-re-3-5", "food-skyr-natur",     200),
        ],
      },
      {
        id: "m-f-re-4",
        name: "Meal 4",
        entries: [
          entry("me-f-re-4-1", "food-skyr-natur",     400),
          entry("me-f-re-4-2", "food-beerenmix-tk",   100),
          entry("me-f-re-4-3", "cf-nuesse-gemischt",  30),
          entry("me-f-re-4-4", "cf-ei-standard",      100), // 1 Stück
        ],
      },
    ],
  };

  return [trainingDayPlan, restDayPlan];
}

// ─── Training Plan ─────────────────────────────────────────────────────────────

function buildTrainingPlan(athleteId: string) {
  return {
    id: "tp-f-001",
    athleteId,
    title: "Trainings Programming",
    mode: "weekday",
    generalCardio: "Ziel: 17.000 Schritte/Tag; 90 min Cardio pro Woche.",
    coachNote: "Kadenz: 4 Ziffern = Exzentrik / Pause unten / Konzentrik / Pause oben (z. B. 3010). RIR = Wiederholungen im Tank. Lieber zu lang pausieren als zu kurz.",
    createdAt: NOW,
    days: [
      {
        id: "f-td-mon",
        dayName: "Montag",
        label: "Arms / Chest / Delts",
        exercises: [
          { id: "f-mon-1", name: "Seitheben Maschine",        sets: 2, reps: "7-9",  rir: 0, muscleGroup: "Schultern",  exerciseDbId: "ex-seitheben-maschine",         exerciseDbNote: "Griffe nehmen, Arme gestreckt – gedanklich Fäuste in die Wand drücken.", note: "Kadenz: 3010 | Griffe nicht nutzen, Arme strecken und gedanklich nur Ellenbogen nach oben führen.", videoUrl: "" },
          { id: "f-mon-2", name: "Single Arm Preacher Curls", sets: 2, reps: "7-9",  rir: 0, muscleGroup: "Bizeps",     exerciseDbId: "ex-preacher-curl",              exerciseDbNote: "Handgelenk, Ellbogen und Schultergelenk in 1 Linie.", note: "Kadenz: 3010 | Arm auf leicht schräger Bank aufgelegt; Ellenbogen- und Schultergelenk in einer Linie." },
          { id: "f-mon-3", name: "Trizeps Cable Pushdowns",   sets: 2, reps: "9-11", rir: 0, muscleGroup: "Trizeps",    exerciseDbId: "ex-trizeps-kabel",              exerciseDbNote: "Oberarm parallel zum Kabel. Ellbogen fixiert, vollständige Streckung am Ende.", note: "Kadenz: 3010 | Auf Schrägbank, Oberarm und Kabel parallel.", videoUrl: "https://www.tiktok.com/@kimoliftss/video/7483470382259834134" },
          { id: "f-mon-4", name: "Kurzhantel Hammer Curls",   sets: 1, reps: "7-9",  rir: 0, muscleGroup: "Bizeps",     exerciseDbId: "ex-hammercurls",                exerciseDbNote: "Neutraler Griff, Ellbogen fixiert.", note: "Kadenz: 3011 | Beide Arme gleichzeitig." },
          { id: "f-mon-5", name: "JM Press",                  sets: 1, reps: "7-9",  rir: 0, muscleGroup: "Trizeps",    exerciseDbId: "ex-jm-press",                   exerciseDbNote: "An der Multipresse; Stange im untersten Punkt auf Schulterhöhe.", note: "Kadenz: 3110" },
          { id: "f-mon-6", name: "Cable Fly",                 sets: 1, reps: "9-11", rir: 0, muscleGroup: "Brust",      exerciseDbId: "ex-kabelfliegende",             exerciseDbNote: "Weite Bewegungsbahn, Spannung in der Kontraktion halten.", note: "Kadenz: 3010 | Füße hochlagern, Schulterblätter frei bewegen lassen." },
          { id: "f-mon-7", name: "Incline Chest Press",       sets: 2, reps: "7-9",  rir: 0, muscleGroup: "Brust",      exerciseDbId: "ex-incline-chest-press",        exerciseDbNote: "Ellbogen nah am Körper führen.", note: "Kadenz: 3010 | Stackloaded." },
          { id: "f-mon-8", name: "Leg Raises",                sets: 2, reps: "9-11", rir: 0, muscleGroup: "Bauch",      exerciseDbId: "ex-leg-raises",                 exerciseDbNote: "Hüfte einrollen und Richtung Brustbein bringen.", note: "Kadenz: 3010" },
        ],
      },
      {
        id: "f-td-tue",
        dayName: "Dienstag",
        label: "Legs",
        exercises: [
          { id: "f-tue-1", name: "Beinbeuger stehend",        sets: 2, reps: "9-11", rir: 0, muscleGroup: "Beine",      exerciseDbId: "ex-standing-leg-curl",          exerciseDbNote: "Hüfte stabil halten, kontrollierte Exzentrik.", note: "Kadenz: 3010" },
          { id: "f-tue-2", name: "Hyperextensions",           sets: 2, reps: "7-9",  rir: 0, muscleGroup: "Beine",      exerciseDbId: "ex-hyperextension",             exerciseDbNote: "Polster unter Hüfthöhe, Füße gerade, Knie gebeugt – gedanklich Leg Curl ausführen.", note: "Kadenz: 3110" },
          { id: "f-tue-3", name: "Adduktor Maschine",         sets: 2, reps: "5-7",  rir: 0, muscleGroup: "Adduktoren", exerciseDbId: "ex-adduktoren",                 exerciseDbNote: "Blick nach vorne oben, Beine austrecken, Druck nur vom Knie aus.", note: "Kadenz: 3111 | 1ct Pause in beiden Umkehrpunkten." },
          { id: "f-tue-4", name: "Wadenheben an der Beinpresse", sets: 2, reps: "5-7", rir: 0, muscleGroup: "Waden",   exerciseDbId: "ex-wadenheben-beinpresse",      exerciseDbNote: "Pause im Stretch, nur bis zur Hälfte hoch drücken.", note: "Kadenz: 3310 | 3ct Pause in Dehnung." },
          { id: "f-tue-5", name: "Beinstrecker unilateral",   sets: 1, reps: "7-9",  rir: 0, muscleGroup: "Quadrizeps", exerciseDbId: "ex-beinstrecker-unilateral",    exerciseDbNote: "Kniegelenk auf Drehgelenk ausrichten. Kontrollierte Exzentrik.", note: "Kadenz: 3012 | 2ct Pause." },
          { id: "f-tue-6", name: "Sissy Legpress",            sets: 2, reps: "7-9",  rir: 0, muscleGroup: "Quadrizeps", exerciseDbId: "ex-sissy-leg-press",            exerciseDbNote: "1s Pause im Stretch für maximale Quadrizeps-Aktivierung.", note: "Kadenz: 3110 | 1ct Pause in Dehnung, leichtes Abheben der Fersen erlauben, Fuß mind. 50 % auf Plattform." },
        ],
      },
      {
        id: "f-td-wed",
        dayName: "Mittwoch",
        label: "Delts / Back",
        exercises: [
          { id: "f-wed-1", name: "Kurzhantel Seitheben brustgestützt", sets: 2, reps: "11-14", rir: 0, muscleGroup: "Schultern", exerciseDbId: "ex-seitheben-brustgestuetzt", exerciseDbNote: "Stehend an Bank angelehnt.", note: "Kadenz: 3010" },
          { id: "f-wed-2", name: "Lateral Arounds",            sets: 2, reps: "9-11", rir: 0, muscleGroup: "Schultern", exerciseDbId: "ex-lateral-arounds",            exerciseDbNote: "Umlenkrolle auf Handhöhe; Position leicht vor dem Kabelturm, cuffed.", note: "Kadenz: 3010" },
          { id: "f-wed-3", name: "Überzüge unilateral",        sets: 1, reps: "9-11", rir: 0, muscleGroup: "Rücken",    exerciseDbId: "ex-unilateral-pullover-cable",  exerciseDbNote: "Arm gestreckt halten, Griff fest in der Hand.", note: "Kadenz: 3011 | Bank danebenstellen zum Stabilisieren; max. 90° Schulterflexion; 1ct Pause in Kontraktion." },
          { id: "f-wed-4", name: "Latzug breit",               sets: 2, reps: "9-11", rir: 0, muscleGroup: "Rücken",    exerciseDbId: "ex-lat-pulldown-breit",         exerciseDbNote: "Ellbogen gedanklich zur Hüfte ziehen.", note: "Kadenz: 3010 | Schulterblätter vollständig lösen und kontrahieren; Brust ganze Zeit stolz lassen." },
          { id: "f-wed-5", name: "T-Bar Rudern brustgestützt", sets: 2, reps: "7-9",  rir: 0, muscleGroup: "Rücken",    exerciseDbId: "ex-t-bar-rudern",               exerciseDbNote: "Schulterblätter vollständig lösen und kontrahieren; Brust ganze Zeit stolz lassen.", note: "Kadenz: 3010" },
          { id: "f-wed-6", name: "Reverse Cable Flys",         sets: 2, reps: "9-11", rir: 0, muscleGroup: "Schultern", exerciseDbId: "ex-reverse-fly-cable",          exerciseDbNote: "Schulterblätter fixiert, kontrollierte Bewegung.", note: "Kadenz: 3011 | V-Station, Zug leicht von oben, cuffed, 1ct Pause in Kontraktion." },
        ],
      },
      {
        id: "f-td-thu",
        dayName: "Donnerstag",
        label: "Ruhetag",
        note: "Kein Krafttraining.",
        exercises: [],
      },
      {
        id: "f-td-fri",
        dayName: "Freitag",
        label: "Push FB",
        exercises: [
          { id: "f-fri-1", name: "Seitheben Maschine",         sets: 2, reps: "7-9",  rir: 0, muscleGroup: "Schultern",  exerciseDbId: "ex-seitheben-maschine",        exerciseDbNote: "Griffe nehmen, Arme gestreckt – gedanklich Fäuste in die Wand drücken.", note: "Kadenz: 3010 | Griffe nicht nutzen, Arme strecken und gedanklich nur Ellenbogen nach oben führen." },
          { id: "f-fri-2", name: "Single Arm Cable Pushdowns", sets: 1, reps: "7-9",  rir: 0, muscleGroup: "Trizeps",    exerciseDbId: "ex-single-arm-cable-pushdown", exerciseDbNote: "Ellbogen fixiert, vollständige Streckung am Ende.", note: "Kadenz: 3010" },
          { id: "f-fri-3", name: "Overhead Extensions",        sets: 2, reps: "7-9",  rir: 0, muscleGroup: "Trizeps",    exerciseDbId: "ex-overhead-extension",        exerciseDbNote: "Ellbogen zeigen zur Decke, kontrollierte Bewegung. Vollstreckung am Ende.", note: "Kadenz: 3010 | Auf Bank, mit Loopstraps." },
          { id: "f-fri-4", name: "Carter Flys",                sets: 2, reps: "9-11", rir: 0, muscleGroup: "Brust",      exerciseDbId: "ex-carter-fly",                exerciseDbNote: "Flacher Bankwinkel, Fly-Bewegung mit leichter Ellbogenbeugung. Stretch in der unteren Position betonen.", note: "Kadenz: 3010", videoUrl: "https://www.instagram.com/reel/DGQxSytAkcq/" },
          { id: "f-fri-5", name: "Lying Chest Press",          sets: 1, reps: "5-7",  rir: 0, muscleGroup: "Brust",      exerciseDbId: "ex-flat-chest-press",          exerciseDbNote: "Ellbogen nah am Körper führen.", note: "Kadenz: 3010" },
          { id: "f-fri-6", name: "Adduktor Maschine",          sets: 2, reps: "5-7",  rir: 0, muscleGroup: "Adduktoren", exerciseDbId: "ex-adduktoren",                exerciseDbNote: "Blick nach vorne oben, Beine austrecken, Druck nur vom Knie aus.", note: "Kadenz: 3111 | 1ct Pause in beiden Umkehrpunkten." },
          { id: "f-fri-7", name: "Wadenheben an der Beinpresse", sets: 2, reps: "5-7", rir: 0, muscleGroup: "Waden",    exerciseDbId: "ex-wadenheben-beinpresse",     exerciseDbNote: "Pause im Stretch, nur bis zur Hälfte hoch drücken.", note: "Kadenz: 3310 | 3ct Pause in Dehnung." },
          { id: "f-fri-8", name: "Smith Machine Squats",        sets: 2, reps: "7-9",  rir: 0, muscleGroup: "Beine",     exerciseDbId: "ex-smith-squats",              exerciseDbNote: "Füße leicht vor die Hüfte, kontrolliert absenken, Rumpfspannung halten.", note: "Kadenz: 3110 | 1ct Pause in Dehnung; Ellenbogen unter Stange; aufrecht im Oberkörper bleiben." },
        ],
      },
      {
        id: "f-td-sat",
        dayName: "Samstag",
        label: "Pull FB",
        exercises: [
          { id: "f-sat-1", name: "Beinbeuger liegend",              sets: 2, reps: "7-9",  rir: 0, muscleGroup: "Beine",  exerciseDbId: "ex-leg-curl",                      exerciseDbNote: "Hüfte fixiert lassen. Kontrollierte Exzentrik.", note: "Kadenz: 3011 | Hüfte aktiv gegen Polster drücken; in Kontraktion Oberschenkel leicht abheben; 1ct Pause in Kontraktion." },
          { id: "f-sat-2", name: "Beinbeuger sitzend",              sets: 2, reps: "7-9",  rir: 0, muscleGroup: "Beine",  exerciseDbId: "ex-beinbeuger-sitzend",            exerciseDbNote: "Aktiv in Polster reinziehen und Bauch anspannen.", note: "Kadenz: 3010" },
          { id: "f-sat-3", name: "Peak Contraction Curls",          sets: 2, reps: "7-9",  rir: 0, muscleGroup: "Bizeps", exerciseDbId: "ex-peak-contraction-curls",         exerciseDbNote: "Maximale Kontraktion am Ende der Bewegung halten.", note: "Kadenz: 3010" },
          { id: "f-sat-4", name: "Single Arm Incline Cable Curls",  sets: 1, reps: "7-9",  rir: 0, muscleGroup: "Bizeps", exerciseDbId: "ex-single-arm-incline-cable-curls", exerciseDbNote: "Ellbogen hinter dem Körper für maximalen Stretch.", note: "Kadenz: 3010 | Ellenbogen hinter Körper." },
          { id: "f-sat-5", name: "Ruder Machine eng unilateral",    sets: 2, reps: "7-9",  rir: 0, muscleGroup: "Rücken", exerciseDbId: "ex-rudermaschine-eng-unilateral",   exerciseDbNote: "Stack loaded; unilateral ausführen.", note: "Kadenz: 3010" },
          { id: "f-sat-6", name: "Ruder Maschine breit",            sets: 2, reps: "7-9",  rir: 0, muscleGroup: "Rücken", exerciseDbId: "ex-rudermaschine-breit",            exerciseDbNote: "Schulterblätter vollständig lösen und kontrahieren.", note: "Kadenz: 3010" },
          { id: "f-sat-7", name: "Crunch Machine",                  sets: 2, reps: "9-11", rir: 0, muscleGroup: "Bauch",  exerciseDbId: "ex-crunch-maschine",                exerciseDbNote: "Brustbein zum Schambein ziehen.", note: "Kadenz: 3010" },
        ],
      },
      {
        id: "f-td-sun",
        dayName: "Sonntag",
        label: "Ruhetag",
        note: "Vollständige Erholung.",
        exercises: [],
      },
    ],
  };
}

// ─── Supplement Plan ───────────────────────────────────────────────────────────

function buildSupplementPlan(athleteId: string) {
  return {
    id: "sp-f-001",
    athleteId,
    coachNote: "Anbieter: Vitaminversand / German Elite Nutrition. Dosierungen täglich einhalten.",
    supplements: [
      // Morgens / zu Meal 1
      { id: "spe-f-1",  name: "Kreatin",                   dosage: "8 g",         timing: "Morgens / zu Meal 1",         instructions: "Mit ausreichend Wasser einnehmen.",                                              link: "https://vitaminversand24.com/GEN_Creatin_Mono",              supplementDBId: "supp-kreatin-monohydrat" },
      { id: "spe-f-2",  name: "Elektrolyte / Basepowder",  dosage: "5 g",         timing: "Morgens / zu Meal 1",         instructions: "In Wasser einrühren und trinken.",                                               link: "https://vitaminversand24.com/vit4_elektrolyte_powder_big",   supplementDBId: "supp-elektrolyte" },
      { id: "spe-f-3",  name: "Magnesium",                 dosage: "1 Kapsel",    timing: "Morgens / zu Meal 1",         instructions: "Mit einer Mahlzeit einnehmen.",                                                  link: "https://vitaminversand24.com/magnesium_bisglycinat_365",    supplementDBId: "supp-magnesiumbisglycinat" },
      { id: "spe-f-4",  name: "Vitamin C",                 dosage: "1 Kapsel",    timing: "Morgens / zu Meal 1",         instructions: "Mit oder ohne Mahlzeit möglich.",                                                link: "https://vitaminversand24.com/VitaminC_TR",                   supplementDBId: "supp-vitamin-c" },
      { id: "spe-f-5",  name: "NAC",                       dosage: "1 Kapsel",    timing: "Morgens / zu Meal 1",         instructions: "Mit ausreichend Wasser einnehmen.",                                              link: "https://vitaminversand24.com/vit4_nac_800",                  supplementDBId: "supp-n-acetyl-cystein" },
      { id: "spe-f-6",  name: "D3K2",                      dosage: "1 Kapsel",    timing: "Morgens / zu Meal 1",         instructions: "Mit einer fetthaltigen Mahlzeit einnehmen.",                                     link: "https://vitaminversand24.com/D3_K2_5000_365",               supplementDBId: "supp-d3-k2" },
      { id: "spe-f-7",  name: "Omega 3",                   dosage: "2 Kapseln",   timing: "Morgens / zu Meal 1",         instructions: "Mit einer Mahlzeit einnehmen, idealerweise mit Fettanteil.",                     link: "https://vitaminversand24.com/OmegaIntenso365",              supplementDBId: "supp-omega-3" },
      // Peri Workout
      { id: "spe-f-8",  name: "Maltodextrin / Cluster Dextrin", dosage: "25 g",  timing: "Intra Workout",               instructions: "In Wasser einrühren und während des Trainings trinken.",                         link: "https://vitaminversand24.com/gen_cyclic_cluster_dextrin",   supplementDBId: "supp-maltodextrin" },
      { id: "spe-f-9",  name: "Elektrolyte / Basepowder",  dosage: "5 g",         timing: "Intra Workout",               instructions: "In Wasser einrühren und trinken.",                                               link: "https://vitaminversand24.com/vit4_elektrolyte_powder_big",   supplementDBId: "supp-elektrolyte" },
      { id: "spe-f-10", name: "Magnesium",                 dosage: "1 Kapsel",    timing: "Post Workout",                instructions: "Mit einer Mahlzeit einnehmen.",                                                  link: "https://vitaminversand24.com/magnesium_bisglycinat_365",    supplementDBId: "supp-magnesiumbisglycinat" },
      { id: "spe-f-11", name: "Chrom",                     dosage: "1 Kapsel",    timing: "Post Workout",                instructions: "Mit einer Mahlzeit einnehmen.",                                                  link: "https://vitaminversand24.com/VIT_Chromium",                  supplementDBId: "supp-chrom" },
      // Abends
      { id: "spe-f-12", name: "Zink",                      dosage: "1 Kapsel",    timing: "Pre Bed",                     instructions: "Nicht nüchtern einnehmen, falls Magenprobleme auftreten.",                      link: "https://vitaminversand24.com/vit4_zink_komplex_1",           supplementDBId: "supp-zink" },
      { id: "spe-f-13", name: "Ashwagandha",               dosage: "1 Kapsel",    timing: "Pre Bed",                     instructions: "Mit einer Mahlzeit einnehmen.",                                                  link: "https://vitaminversand24.com/gen_shoden_ashwagandha",        supplementDBId: "supp-ashwagandha" },
      { id: "spe-f-14", name: "Magnesium",                 dosage: "1 Kapsel",    timing: "Pre Bed",                     instructions: "Mit einer Mahlzeit einnehmen.",                                                  link: "https://vitaminversand24.com/magnesium_bisglycinat_365",    supplementDBId: "supp-magnesiumbisglycinat" },
      { id: "spe-f-15", name: "Omega 3",                   dosage: "2 Kapseln",   timing: "Pre Bed",                     instructions: "Mit einer Mahlzeit einnehmen, idealerweise mit Fettanteil.",                     link: "https://vitaminversand24.com/OmegaIntenso365",              supplementDBId: "supp-omega-3" },
      { id: "spe-f-16", name: "Melatonin",                 dosage: "2-4 Kapseln", timing: "2 h vor dem Schlafengehen",   instructions: "Nur bei Bedarf verwenden, nicht dauerhaft ohne individuelle Prüfung.",           link: "https://vitaminversand24.com/VIT_Melatonin",                 supplementDBId: "supp-melatonin" },
      { id: "spe-f-17", name: "Multivitamin",              dosage: "2 Kapseln",   timing: "Pre Bed",                     instructions: "Mit einer Mahlzeit einnehmen, idealerweise mit Fettanteil.",                     link: "https://vitaminversand24.com/VIT_Multi_Intenso_big",         supplementDBId: "supp-multivitamin" },
    ],
  };
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const namePrefix = request.nextUrl.searchParams.get("athlete")?.toLowerCase().trim() ?? "";
  const now = new Date().toISOString();
  const results: Record<string, unknown> = {};

  // 1. Upsert exercises
  const { error: exErr } = await supabase
    .from("exercise_db")
    .upsert(newExercises.map((e) => ({ ...e, created_at: NOW, updated_at: now })), { onConflict: "id" });
  if (exErr) return NextResponse.json({ ok: false, step: "exercises", error: exErr.message }, { status: 500 });
  results.exercises_upserted = newExercises.length;

  // 2. Upsert custom foods
  const { error: foodErr } = await supabase
    .from("custom_foods")
    .upsert(newCustomFoods.map((f) => ({ ...f, created_at: NOW, updated_at: now })), { onConflict: "id" });
  if (foodErr) return NextResponse.json({ ok: false, step: "foods", error: foodErr.message }, { status: 500 });
  results.foods_upserted = newCustomFoods.length;

  // 3. Upsert supplements
  const { error: suppErr } = await supabase
    .from("supplement_db")
    .upsert(newSupplements.map((s) => ({ ...s, created_at: NOW, updated_at: now })), { onConflict: "id" });
  if (suppErr) return NextResponse.json({ ok: false, step: "supplements", error: suppErr.message }, { status: 500 });
  results.supplements_upserted = newSupplements.length;

  // 4. Find athlete
  const { data: athletes, error: athErr } = await supabase
    .from("athletes")
    .select("id, name, meal_plans");
  if (athErr) return NextResponse.json({ ok: false, step: "fetch_athletes", error: athErr.message }, { status: 500 });

  const TEST_IDS = ["test-athlete-001"];
  let athlete = namePrefix
    ? athletes?.find((a: { id: string; name: string }) => a.name.toLowerCase().trim().startsWith(namePrefix))
    : athletes?.find((a: { id: string; name: string }) => !TEST_IDS.includes(a.id));

  if (!athlete) {
    return NextResponse.json({ ok: false, step: "find_athlete", error: `No athlete found (prefix="${namePrefix}"). Pass ?athlete=name to target a specific athlete.`, available: athletes?.map((a: { id: string; name: string }) => a.name) }, { status: 404 });
  }

  // 5. Build and upsert plans
  const mealPlans = buildMealPlans(athlete.id);
  const trainingPlan = buildTrainingPlan(athlete.id);
  const supplementPlan = buildSupplementPlan(athlete.id);

  // Merge new meal plans (keep existing ones that don't share IDs)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingMealPlans: any[] = athlete.meal_plans ?? [];
  const newIds = new Set(mealPlans.map((p) => p.id));
  const merged = [...existingMealPlans.filter((p: { id: string }) => !newIds.has(p.id)), ...mealPlans];

  const { error: updateErr } = await supabase
    .from("athletes")
    .update({ meal_plans: merged, training_plan: trainingPlan, supplement_plan: supplementPlan, updated_at: now })
    .eq("id", athlete.id);

  if (updateErr) return NextResponse.json({ ok: false, step: "update_athlete", error: updateErr.message }, { status: 500 });

  results.athlete = { id: athlete.id, name: athlete.name };
  results.meal_plans_added = mealPlans.map((p) => p.title);
  results.training_plan = trainingPlan.title;
  results.supplement_plan = supplementPlan.id;

  return NextResponse.json({ ok: true, ...results });
}
