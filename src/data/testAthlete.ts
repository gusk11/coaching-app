import { Athlete, FoodItem, DEFAULT_DAILY_CHECK_CONFIG } from "@/types";

export const TEST_ATHLETE_ID = "test-athlete-001";
const ID = TEST_ATHLETE_ID;

// ─── Food snapshots ───────────────────────────────────────────────────────────

const FOODS: Record<string, FoodItem> = {
  haehnchenbrust: { id: "haehnchenbrust", name: "Hähnchenbrust", category: "Protein", servingLabel: "100 g", kcalPer100g: 110, proteinPer100g: 23.0, carbsPer100g: 0.0, fatPer100g: 1.5, fiberPer100g: 0.0, saltPer100g: 0.2, defaultAmount: 100 },
  reis: { id: "reis_gekocht", name: "Reis, gekocht", category: "Kohlenhydrate", servingLabel: "100 g", kcalPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28.0, fatPer100g: 0.3, fiberPer100g: 0.4, saltPer100g: 0.0, defaultAmount: 100 },
  ei: { id: "ei", name: "Ei", category: "Protein", servingLabel: "1 Stück", kcalPer100g: 80, proteinPer100g: 7.0, carbsPer100g: 0.5, fatPer100g: 5.5, fiberPer100g: 0.0, saltPer100g: 0.2, defaultAmount: 1 },
  banane: { id: "banane", name: "Banane", category: "Obst", servingLabel: "1 Stück", kcalPer100g: 105, proteinPer100g: 1.3, carbsPer100g: 24.0, fatPer100g: 0.3, fiberPer100g: 2.6, saltPer100g: 0.0, defaultAmount: 1 },
  haferflocken: { id: "haferflocken", name: "Haferflocken", category: "Kohlenhydrate", servingLabel: "100 g", kcalPer100g: 370, proteinPer100g: 13.0, carbsPer100g: 58.0, fatPer100g: 7.0, fiberPer100g: 10.0, saltPer100g: 0.0, defaultAmount: 80 },
  magerquark: { id: "magerquark", name: "Magerquark", category: "Protein", servingLabel: "100 g", kcalPer100g: 67, proteinPer100g: 12.0, carbsPer100g: 4.0, fatPer100g: 0.3, fiberPer100g: 0.0, saltPer100g: 0.1, defaultAmount: 200 },
  beerenmix: { id: "beerenmix", name: "Beerenmix (TK)", category: "Obst", servingLabel: "100 g", kcalPer100g: 50, proteinPer100g: 0.8, carbsPer100g: 10.0, fatPer100g: 0.4, fiberPer100g: 2.5, saltPer100g: 0.0, defaultAmount: 100 },
  chiasamen: { id: "chiasamen", name: "Chiasamen", category: "Fettquelle", servingLabel: "100 g", kcalPer100g: 486, proteinPer100g: 17.0, carbsPer100g: 8.0, fatPer100g: 31.0, fiberPer100g: 34.0, saltPer100g: 0.1, defaultAmount: 15 },
  brokkoli: { id: "brokkoli", name: "Brokkoli", category: "Gemüse", servingLabel: "100 g", kcalPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 4.0, fatPer100g: 0.4, fiberPer100g: 2.6, saltPer100g: 0.1, defaultAmount: 200 },
  olivenoel: { id: "olivenoel", name: "Olivenöl", category: "Fettquelle", servingLabel: "100 g", kcalPer100g: 884, proteinPer100g: 0.0, carbsPer100g: 0.0, fatPer100g: 100.0, fiberPer100g: 0.0, saltPer100g: 0.0, defaultAmount: 10 },
  whey: { id: "whey_protein", name: "Whey Protein", category: "Protein", servingLabel: "100 g", kcalPer100g: 380, proteinPer100g: 75.0, carbsPer100g: 8.0, fatPer100g: 4.0, fiberPer100g: 0.0, saltPer100g: 0.5, defaultAmount: 30 },
  kartoffeln: { id: "kartoffeln", name: "Kartoffeln, gekocht", category: "Kohlenhydrate", servingLabel: "100 g", kcalPer100g: 87, proteinPer100g: 2.0, carbsPer100g: 18.0, fatPer100g: 0.1, fiberPer100g: 1.8, saltPer100g: 0.0, defaultAmount: 200 },
  spinat: { id: "spinat", name: "Spinat, frisch", category: "Gemüse", servingLabel: "100 g", kcalPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 1.5, fatPer100g: 0.4, fiberPer100g: 2.2, saltPer100g: 0.1, defaultAmount: 150 },
};

// Compute scaled macros (amountG already in internal scaling units)
function m(food: FoodItem, amountG: number) {
  const r = amountG / 100;
  return {
    kcal: Math.round(food.kcalPer100g * r * 10) / 10,
    protein: Math.round(food.proteinPer100g * r * 10) / 10,
    carbs: Math.round(food.carbsPer100g * r * 10) / 10,
    fat: Math.round(food.fatPer100g * r * 10) / 10,
    fiber: Math.round(food.fiberPer100g * r * 10) / 10,
    salt: Math.round(food.saltPer100g * r * 10) / 10,
  };
}

function ctEntry(id: string, food: FoodItem, amountG: number) {
  return { id, name: food.name, amountG, ...m(food, amountG), foodItemId: food.id, servingLabel: food.servingLabel };
}

// ─── Training Plan ────────────────────────────────────────────────────────────

const trainingPlan = {
  id: "tp-test-001",
  athleteId: ID,
  title: "Push / Pull / Legs – 5er Split",
  mode: "weekday" as const,
  generalCardio: "2–3× wöchentlich 20–30 min moderates Cardio (Spaziergang, Bike, Stepper). Intensität: leicht bis moderat.",
  coachNote: "Progressive Überladung: Sobald du alle Sätze im oberen Wiederholungsbereich mit RIR 2+ schaffst, erhöhe das Gewicht um 2,5 kg. Protokolliere jede Einheit.",
  createdAt: "2026-05-19T08:00:00.000Z",
  days: [
    {
      id: "td-push",
      dayName: "Montag",
      label: "Push",
      cardioNote: "Optional: 10 min leichtes Aufwärm-Cardio vor dem Training.",
      exercises: [
        { id: "ex-tp-1", name: "Bankdrücken (Langhantel)", sets: 4, reps: "8–10", rir: 2, restSeconds: 120, muscleGroup: "Brust", note: "Ellbogen leicht anwinkeln, Schulterblätter zusammenziehen." },
        { id: "ex-tp-2", name: "Schrägbankdrücken (Kurzhantel)", sets: 3, reps: "10–12", rir: 2, restSeconds: 90, muscleGroup: "Brust" },
        { id: "ex-tp-3", name: "Schulterdrücken (Langhantel, stehend)", sets: 3, reps: "8–10", rir: 2, restSeconds: 120, muscleGroup: "Schultern" },
        { id: "ex-tp-4", name: "Seitheben (Kurzhantel)", sets: 4, reps: "15–20", rir: 2, restSeconds: 60, muscleGroup: "Schultern", note: "Kontrollierte Bewegung, kein Schwung." },
        { id: "ex-tp-5", name: "Trizeps-Pushdown (Kabelzug)", sets: 3, reps: "12–15", rir: 2, restSeconds: 60, muscleGroup: "Trizeps" },
        { id: "ex-tp-6", name: "Overhead-Extension (Kurzhantel, beidarmig)", sets: 3, reps: "12–15", rir: 2, restSeconds: 60, muscleGroup: "Trizeps" },
      ],
    },
    {
      id: "td-pull",
      dayName: "Dienstag",
      label: "Pull",
      exercises: [
        { id: "ex-tp-7", name: "Klimmzüge (Körpergewicht)", sets: 4, reps: "6–10", rir: 2, restSeconds: 120, muscleGroup: "Rücken", note: "Volles ROM. Falls nötig, Gewichtsscheibe zum Dips-Gürtel hinzufügen." },
        { id: "ex-tp-8", name: "Rudern (Langhantel, vorgebeugt)", sets: 4, reps: "8–10", rir: 2, restSeconds: 120, muscleGroup: "Rücken" },
        { id: "ex-tp-9", name: "Latzug (breiter Griff)", sets: 3, reps: "10–12", rir: 2, restSeconds: 90, muscleGroup: "Rücken" },
        { id: "ex-tp-10", name: "Gesichtsziehen (Kabelzug)", sets: 3, reps: "15–20", rir: 2, restSeconds: 60, muscleGroup: "Schultern hinten" },
        { id: "ex-tp-11", name: "Bizeps-Curls (Langhantel)", sets: 3, reps: "10–12", rir: 2, restSeconds: 60, muscleGroup: "Bizeps" },
        { id: "ex-tp-12", name: "Hammer-Curls (Kurzhantel)", sets: 3, reps: "12–15", rir: 2, restSeconds: 60, muscleGroup: "Bizeps / Unterarm" },
      ],
    },
    {
      id: "td-legs",
      dayName: "Mittwoch",
      label: "Legs",
      cardioNote: "20 min Stepper oder Bike nach dem Training. Moderat.",
      exercises: [
        { id: "ex-tp-13", name: "Kniebeuge (Langhantel, high bar)", sets: 4, reps: "8–10", rir: 2, restSeconds: 150, muscleGroup: "Quadrizeps / Gesäß", note: "Tiefe Kniebeuge, Oberschenkel parallel zum Boden oder tiefer." },
        { id: "ex-tp-14", name: "Rumänisches Kreuzheben (Langhantel)", sets: 3, reps: "10–12", rir: 2, restSeconds: 120, muscleGroup: "Ischiokrurale / Gesäß" },
        { id: "ex-tp-15", name: "Beinpresse (Maschine)", sets: 3, reps: "10–12", rir: 2, restSeconds: 90, muscleGroup: "Quadrizeps / Gesäß" },
        { id: "ex-tp-16", name: "Beinstrecker (Maschine)", sets: 3, reps: "12–15", rir: 2, restSeconds: 60, muscleGroup: "Quadrizeps" },
        { id: "ex-tp-17", name: "Wadenheben (stehend, Maschine)", sets: 4, reps: "15–20", rir: 1, restSeconds: 60, muscleGroup: "Waden" },
      ],
    },
    {
      id: "td-rest-thu",
      dayName: "Donnerstag",
      label: "Aktive Erholung",
      note: "Kein Krafttraining. Spaziergang 30–45 min oder leichtes Mobility-Training.",
      exercises: [],
    },
    {
      id: "td-push-fri",
      dayName: "Freitag",
      label: "Push",
      cardioNote: "Optional: 10 min leichtes Aufwärm-Cardio.",
      exercises: [
        { id: "ex-tp-18", name: "Bankdrücken (Langhantel)", sets: 4, reps: "8–10", rir: 2, restSeconds: 120, muscleGroup: "Brust" },
        { id: "ex-tp-19", name: "Schrägbankdrücken (Kurzhantel)", sets: 3, reps: "10–12", rir: 2, restSeconds: 90, muscleGroup: "Brust" },
        { id: "ex-tp-20", name: "Schulterdrücken (Langhantel, stehend)", sets: 3, reps: "8–10", rir: 2, restSeconds: 120, muscleGroup: "Schultern" },
        { id: "ex-tp-21", name: "Seitheben (Kurzhantel)", sets: 4, reps: "15–20", rir: 2, restSeconds: 60, muscleGroup: "Schultern" },
        { id: "ex-tp-22", name: "Trizeps-Pushdown (Kabelzug)", sets: 3, reps: "12–15", rir: 2, restSeconds: 60, muscleGroup: "Trizeps" },
        { id: "ex-tp-23", name: "Overhead-Extension (Kurzhantel)", sets: 3, reps: "12–15", rir: 2, restSeconds: 60, muscleGroup: "Trizeps" },
      ],
    },
    {
      id: "td-pull-sat",
      dayName: "Samstag",
      label: "Pull",
      exercises: [
        { id: "ex-tp-24", name: "Klimmzüge (Körpergewicht)", sets: 4, reps: "6–10", rir: 2, restSeconds: 120, muscleGroup: "Rücken" },
        { id: "ex-tp-25", name: "Rudern (Langhantel, vorgebeugt)", sets: 4, reps: "8–10", rir: 2, restSeconds: 120, muscleGroup: "Rücken" },
        { id: "ex-tp-26", name: "Latzug (breiter Griff)", sets: 3, reps: "10–12", rir: 2, restSeconds: 90, muscleGroup: "Rücken" },
        { id: "ex-tp-27", name: "Gesichtsziehen (Kabelzug)", sets: 3, reps: "15–20", rir: 2, restSeconds: 60, muscleGroup: "Schultern hinten" },
        { id: "ex-tp-28", name: "Bizeps-Curls (Langhantel)", sets: 3, reps: "10–12", rir: 2, restSeconds: 60, muscleGroup: "Bizeps" },
        { id: "ex-tp-29", name: "Hammer-Curls (Kurzhantel)", sets: 3, reps: "12–15", rir: 2, restSeconds: 60, muscleGroup: "Bizeps" },
      ],
    },
    {
      id: "td-rest-sun",
      dayName: "Sonntag",
      label: "Ruhetag",
      note: "Vollständige Erholung. Fokus auf Schlaf und Ernährung.",
      exercises: [],
    },
  ],
};

// ─── Meal Plan ────────────────────────────────────────────────────────────────

const mealPlan = {
  id: "mp-test-001",
  athleteId: ID,
  title: "Cut-Phase – ~2100 kcal / ~200g Protein",
  coachNote: "Halte dich möglichst genau an den Plan. An Trainingstagen ist der Pre-Workout-Snack besonders wichtig. An Ruhetagen kannst du den Snack weglassen oder durch einen kleinen Salat ersetzen. Wiege die Lebensmittel roh/ungegart, außer Reis und Kartoffeln (die Angaben sind für den gekochten Zustand).",
  createdAt: "2026-05-19T08:00:00.000Z",
  meals: [
    {
      id: "meal-fruehstueck",
      name: "Frühstück",
      time: "07:30",
      note: "Quark und Beeren können im Voraus vorbereitet werden.",
      entries: [
        { foodItemId: "haferflocken", foodItem: FOODS.haferflocken, amountG: 80 },
        { foodItemId: "magerquark", foodItem: FOODS.magerquark, amountG: 200 },
        { foodItemId: "beerenmix", foodItem: FOODS.beerenmix, amountG: 100 },
      ],
    },
    {
      id: "meal-mittagessen",
      name: "Mittagessen",
      time: "12:30",
      note: "Kan vorgekocht werden (Meal-Prep). Olivenöl erst kurz vor dem Essen hinzufügen.",
      entries: [
        { foodItemId: "haehnchenbrust", foodItem: FOODS.haehnchenbrust, amountG: 200 },
        { foodItemId: "reis_gekocht", foodItem: FOODS.reis, amountG: 200 },
        { foodItemId: "brokkoli", foodItem: FOODS.brokkoli, amountG: 200 },
        { foodItemId: "olivenoel", foodItem: FOODS.olivenoel, amountG: 10 },
      ],
    },
    {
      id: "meal-preworkout",
      name: "Pre-Workout Snack",
      time: "16:00",
      note: "Nur an Trainingstagen. An Ruhetagen weglassen.",
      entries: [
        { foodItemId: "banane", foodItem: FOODS.banane, amountG: 100 },
        { foodItemId: "whey_protein", foodItem: FOODS.whey, amountG: 30 },
      ],
    },
    {
      id: "meal-abendessen",
      name: "Abendessen",
      time: "19:00",
      entries: [
        { foodItemId: "haehnchenbrust", foodItem: FOODS.haehnchenbrust, amountG: 200 },
        { foodItemId: "kartoffeln", foodItem: FOODS.kartoffeln, amountG: 300 },
        { foodItemId: "spinat", foodItem: FOODS.spinat, amountG: 150 },
        { foodItemId: "olivenoel", foodItem: FOODS.olivenoel, amountG: 10 },
      ],
    },
    {
      id: "meal-abendsnack",
      name: "Abend-Snack",
      time: "21:00",
      note: "Hilft gegen Abend-Hunger. Chiasamen enthalten viel Ballaststoffe – gut für die Sättigung.",
      entries: [
        { foodItemId: "magerquark", foodItem: FOODS.magerquark, amountG: 200 },
        { foodItemId: "chiasamen", foodItem: FOODS.chiasamen, amountG: 15 },
      ],
    },
  ],
};

// ─── Supplement Plan ──────────────────────────────────────────────────────────

const supplementPlan = {
  id: "sp-test-001",
  athleteId: ID,
  coachNote: "Supplements sind kein Ersatz für eine vollwertige Ernährung. Halte dich an die angegebenen Dosierungen. Bei Fragen oder Unverträglichkeiten melde dich sofort.",
  supplements: [
    { id: "s-1", name: "Kreatin Monohydrat", dosage: "5 g", standardDosage: "3–5 g täglich", timing: "morgens", instructions: "Täglich mit einem großen Glas Wasser einnehmen. Kein Loading-Protokoll nötig. Wirkung setzt nach 4–6 Wochen ein.", supplementDBId: "supp-kreatin-monohydrat" },
    { id: "s-2", name: "Whey Protein", dosage: "30 g", timing: "direkt nach dem Training", instructions: "In 250–300 ml Wasser oder Milch einrühren. Nur an Trainingstagen als Post-Workout-Shake.", note: "Zählt als Mahlzeit (Pre-Workout-Snack im Plan)." },
    { id: "s-3", name: "Vitamin D3 + K2", dosage: "2000 IE D3 + 100 µg K2", timing: "morgens zu einer fettreichen Mahlzeit", instructions: "Da Vitamin D fettlöslich ist, am besten zum Mittagessen oder Abendessen mit Olivenöl einnehmen." },
    { id: "s-4", name: "Omega-3 (Fischöl)", dosage: "2 g EPA/DHA täglich", timing: "zu einer Hauptmahlzeit", instructions: "Mit dem Mittagessen oder Abendessen einnehmen. Hilft bei Entzündungsreduktion und Regeneration.", link: "https://examine.com/supplements/fish-oil/" },
    { id: "s-5", name: "Magnesium (Bisglycinat)", dosage: "300 mg", timing: "30–60 min vor dem Schlafengehen", instructions: "Bisglycinat hat die beste Bioverfügbarkeit und ist schonend für den Magen. Unterstützt Schlafqualität und Regeneration.", supplementDBId: "supp-glycin" },
  ],
};

// ─── Daily Check-Ins (last 7 days: 2026-05-25 to 2026-05-31) ─────────────────

const dailyCheckIns = [
  {
    id: `dc-${ID}-2026-05-25`, athleteId: ID, date: "2026-05-25",
    weight: 83.8, measurementTime: "07:15",
    sleepHours: 8.0, sleepQuality: 4 as const, energyLevel: 3 as const, stressLevel: 2 as const, mood: 4 as const,
    appetite: 3 as const, digestion: 4 as const, caffeine: 200, steps: 6500,
    cardio: false, training: false, trainingQuality: 3 as const,
    nutritionStatus: "meal_plan_followed" as const,
    mealCompliance: "meal_plan_followed" as const,
    note: "Ruhiger Sonntag, gut erholt. Meal-Prep für die Woche erledigt.",
  },
  {
    id: `dc-${ID}-2026-05-26`, athleteId: ID, date: "2026-05-26",
    weight: 83.5, measurementTime: "07:00",
    sleepHours: 7.5, sleepQuality: 4 as const, energyLevel: 4 as const, stressLevel: 3 as const, mood: 4 as const,
    appetite: 4 as const, digestion: 4 as const, caffeine: 300, steps: 9200,
    cardio: false, training: true, trainingQuality: 4 as const,
    nutritionStatus: "meal_plan_followed" as const,
    mealCompliance: "meal_plan_followed" as const,
    note: "Starkes Push-Training, alle Sätze geschafft. Bankdrücken läuft gut.",
  },
  {
    id: `dc-${ID}-2026-05-27`, athleteId: ID, date: "2026-05-27",
    weight: 83.7, measurementTime: "07:10",
    sleepHours: 7.0, sleepQuality: 3 as const, energyLevel: 3 as const, stressLevel: 3 as const, mood: 3 as const,
    appetite: 3 as const, digestion: 3 as const, caffeine: 300, steps: 8800,
    cardio: false, training: true, trainingQuality: 4 as const,
    nutritionStatus: "meal_plan_followed" as const,
    mealCompliance: "meal_plan_followed" as const,
    note: "Etwas müde, Schlaf war nicht ideal. Pull-Training trotzdem solide.",
  },
  {
    id: `dc-${ID}-2026-05-28`, athleteId: ID, date: "2026-05-28",
    weight: 84.1, measurementTime: "07:05",
    sleepHours: 8.0, sleepQuality: 4 as const, energyLevel: 5 as const, stressLevel: 2 as const, mood: 5 as const,
    appetite: 4 as const, digestion: 4 as const, caffeine: 400, steps: 10500,
    cardio: false, training: true, trainingQuality: 5 as const,
    nutritionStatus: "meal_plan_followed" as const,
    mealCompliance: "meal_plan_followed" as const,
    note: "Bestes Training der Woche! Kniebeuge neuer Rekord. Energie auf Top-Niveau.",
  },
  {
    id: `dc-${ID}-2026-05-29`, athleteId: ID, date: "2026-05-29",
    weight: 83.9, measurementTime: "07:20",
    sleepHours: 7.5, sleepQuality: 4 as const, energyLevel: 3 as const, stressLevel: 2 as const, mood: 4 as const,
    appetite: 3 as const, digestion: 4 as const, caffeine: 200, steps: 7200,
    cardio: true, cardioDuration: 30, training: false, trainingQuality: 3 as const,
    nutritionStatus: "meal_plan_followed" as const,
    mealCompliance: "meal_plan_followed" as const,
    note: "Aktiver Ruhetag, 30 min lockerer Spaziergang. Leichter Heißhunger abends – Magerquark hat geholfen.",
  },
  {
    id: `dc-${ID}-2026-05-30`, athleteId: ID, date: "2026-05-30",
    weight: 83.6, measurementTime: "07:00",
    sleepHours: 7.0, sleepQuality: 3 as const, energyLevel: 4 as const, stressLevel: 3 as const, mood: 4 as const,
    appetite: 4 as const, digestion: 3 as const, caffeine: 300, steps: 9000,
    cardio: false, training: true, trainingQuality: 4 as const,
    nutritionStatus: "meal_plan_followed" as const,
    mealCompliance: "meal_plan_followed" as const,
    note: "Freitagstraining gut. Bankdrücken +2,5 kg gegenüber Montag. Verdauung leicht träge.",
  },
  {
    id: `dc-${ID}-2026-05-31`, athleteId: ID, date: "2026-05-31",
    weight: 83.4, measurementTime: "08:00",
    sleepHours: 8.5, sleepQuality: 5 as const, energyLevel: 4 as const, stressLevel: 2 as const, mood: 4 as const,
    appetite: 3 as const, digestion: 4 as const, caffeine: 200, steps: 7800,
    cardio: false, training: true, trainingQuality: 4 as const,
    nutritionStatus: "meal_plan_followed" as const,
    mealCompliance: "meal_plan_followed" as const,
    note: "Sehr gut geschlafen. Pull-Training solide. Gewicht Tiefstand diese Woche.",
  },
];

// ─── Weekly Check-In ──────────────────────────────────────────────────────────

const weeklyCheckIns = [
  {
    id: `wc-${ID}-2026-05-26`,
    athleteId: ID,
    weekStart: "2026-05-26",
    date: "2026-05-31",
    overallWeekRating: 4 as const,
    weekSatisfaction: 4 as const,
    selfSatisfaction: 4 as const,
    nutritionAdherence: 5 as const,
    hungerCravings: "Donnerstagabend etwas Heißhunger auf Süßes, aber gut beherrschbar. Magerquark als Abend-Snack hat sehr geholfen.",
    trainingRating: 4 as const,
    recoveryRating: 4 as const,
    sleepAvg: 7.6,
    stressAvg: 2.5,
    energyAvg: 3.9,
    specialEvents: "Keine besonderen Ereignisse diese Woche.",
    coachNote: "",
    freeNote: "Sehr motivierte erste Woche. Alle 5 geplanten Trainingseinheiten absolviert. Ernährung war top. Freue mich auf die nächste Woche und bin gespannt auf den weiteren Fortschritt. Das Kniebeuge-Training war besonders stark – neuer Rekord!",
  },
];

// ─── Training Logs ────────────────────────────────────────────────────────────

const trainingLogs = [
  // Monday Push (05-26)
  {
    id: `tl-${ID}-2026-05-26`, athleteId: ID, date: "2026-05-26",
    trainingDayId: "td-push", trainingDayName: "Push",
    durationSeconds: 4200,
    note: "Starke Einheit. Alle Sätze wie geplant.",
    exercises: [
      { exerciseId: "ex-tp-1", exerciseName: "Bankdrücken (Langhantel)", sets: [
        { setNumber: 1, weight: 80, reps: 9, rir: 2 },
        { setNumber: 2, weight: 80, reps: 9, rir: 2 },
        { setNumber: 3, weight: 80, reps: 8, rir: 2 },
        { setNumber: 4, weight: 80, reps: 8, rir: 1 },
      ]},
      { exerciseId: "ex-tp-2", exerciseName: "Schrägbankdrücken (Kurzhantel)", sets: [
        { setNumber: 1, weight: 28, reps: 12, rir: 2 },
        { setNumber: 2, weight: 28, reps: 11, rir: 2 },
        { setNumber: 3, weight: 28, reps: 10, rir: 2 },
      ]},
      { exerciseId: "ex-tp-3", exerciseName: "Schulterdrücken (Langhantel, stehend)", sets: [
        { setNumber: 1, weight: 55, reps: 9, rir: 2 },
        { setNumber: 2, weight: 55, reps: 8, rir: 2 },
        { setNumber: 3, weight: 55, reps: 8, rir: 2 },
      ]},
      { exerciseId: "ex-tp-4", exerciseName: "Seitheben (Kurzhantel)", sets: [
        { setNumber: 1, weight: 10, reps: 18, rir: 2 },
        { setNumber: 2, weight: 10, reps: 17, rir: 2 },
        { setNumber: 3, weight: 10, reps: 16, rir: 2 },
        { setNumber: 4, weight: 10, reps: 15, rir: 1 },
      ]},
      { exerciseId: "ex-tp-5", exerciseName: "Trizeps-Pushdown (Kabelzug)", sets: [
        { setNumber: 1, weight: 30, reps: 14, rir: 2 },
        { setNumber: 2, weight: 30, reps: 13, rir: 2 },
        { setNumber: 3, weight: 30, reps: 12, rir: 2 },
      ]},
      { exerciseId: "ex-tp-6", exerciseName: "Overhead-Extension (Kurzhantel, beidarmig)", sets: [
        { setNumber: 1, weight: 22, reps: 13, rir: 2 },
        { setNumber: 2, weight: 22, reps: 12, rir: 2 },
        { setNumber: 3, weight: 22, reps: 11, rir: 2 },
      ]},
    ],
  },
  // Tuesday Pull (05-27)
  {
    id: `tl-${ID}-2026-05-27`, athleteId: ID, date: "2026-05-27",
    trainingDayId: "td-pull", trainingDayName: "Pull",
    durationSeconds: 3900,
    note: "Klimmzüge gut, etwas müde bei den Bizeps-Übungen.",
    exercises: [
      { exerciseId: "ex-tp-7", exerciseName: "Klimmzüge (Körpergewicht)", sets: [
        { setNumber: 1, weight: null, reps: 9, rir: 2 },
        { setNumber: 2, weight: null, reps: 8, rir: 2 },
        { setNumber: 3, weight: null, reps: 7, rir: 2 },
        { setNumber: 4, weight: null, reps: 7, rir: 1 },
      ]},
      { exerciseId: "ex-tp-8", exerciseName: "Rudern (Langhantel, vorgebeugt)", sets: [
        { setNumber: 1, weight: 70, reps: 9, rir: 2 },
        { setNumber: 2, weight: 70, reps: 9, rir: 2 },
        { setNumber: 3, weight: 70, reps: 8, rir: 2 },
        { setNumber: 4, weight: 70, reps: 8, rir: 1 },
      ]},
      { exerciseId: "ex-tp-9", exerciseName: "Latzug (breiter Griff)", sets: [
        { setNumber: 1, weight: 65, reps: 11, rir: 2 },
        { setNumber: 2, weight: 65, reps: 11, rir: 2 },
        { setNumber: 3, weight: 65, reps: 10, rir: 2 },
      ]},
      { exerciseId: "ex-tp-10", exerciseName: "Gesichtsziehen (Kabelzug)", sets: [
        { setNumber: 1, weight: 20, reps: 18, rir: 2 },
        { setNumber: 2, weight: 20, reps: 17, rir: 2 },
        { setNumber: 3, weight: 20, reps: 15, rir: 2 },
      ]},
      { exerciseId: "ex-tp-11", exerciseName: "Bizeps-Curls (Langhantel)", sets: [
        { setNumber: 1, weight: 40, reps: 11, rir: 2 },
        { setNumber: 2, weight: 40, reps: 10, rir: 2 },
        { setNumber: 3, weight: 40, reps: 9, rir: 2 },
      ]},
      { exerciseId: "ex-tp-12", exerciseName: "Hammer-Curls (Kurzhantel)", sets: [
        { setNumber: 1, weight: 16, reps: 13, rir: 2 },
        { setNumber: 2, weight: 16, reps: 12, rir: 2 },
        { setNumber: 3, weight: 16, reps: 11, rir: 2 },
      ]},
    ],
  },
  // Wednesday Legs (05-28)
  {
    id: `tl-${ID}-2026-05-28`, athleteId: ID, date: "2026-05-28",
    trainingDayId: "td-legs", trainingDayName: "Legs",
    durationSeconds: 4800,
    note: "BESTES Leg-Training bisher! Kniebeuge 95kg × 10 neuer Rekord. Energie war top.",
    exercises: [
      { exerciseId: "ex-tp-13", exerciseName: "Kniebeuge (Langhantel, high bar)", sets: [
        { setNumber: 1, weight: 90, reps: 10, rir: 2 },
        { setNumber: 2, weight: 90, reps: 10, rir: 2 },
        { setNumber: 3, weight: 95, reps: 9, rir: 2 },
        { setNumber: 4, weight: 95, reps: 9, rir: 1 },
      ]},
      { exerciseId: "ex-tp-14", exerciseName: "Rumänisches Kreuzheben (Langhantel)", sets: [
        { setNumber: 1, weight: 80, reps: 11, rir: 2 },
        { setNumber: 2, weight: 80, reps: 11, rir: 2 },
        { setNumber: 3, weight: 80, reps: 10, rir: 2 },
      ]},
      { exerciseId: "ex-tp-15", exerciseName: "Beinpresse (Maschine)", sets: [
        { setNumber: 1, weight: 140, reps: 12, rir: 2 },
        { setNumber: 2, weight: 140, reps: 12, rir: 2 },
        { setNumber: 3, weight: 140, reps: 11, rir: 2 },
      ]},
      { exerciseId: "ex-tp-16", exerciseName: "Beinstrecker (Maschine)", sets: [
        { setNumber: 1, weight: 55, reps: 14, rir: 2 },
        { setNumber: 2, weight: 55, reps: 14, rir: 2 },
        { setNumber: 3, weight: 55, reps: 12, rir: 2 },
      ]},
      { exerciseId: "ex-tp-17", exerciseName: "Wadenheben (stehend, Maschine)", sets: [
        { setNumber: 1, weight: 80, reps: 18, rir: 1 },
        { setNumber: 2, weight: 80, reps: 17, rir: 1 },
        { setNumber: 3, weight: 80, reps: 16, rir: 1 },
        { setNumber: 4, weight: 80, reps: 15, rir: 1 },
      ]},
    ],
  },
  // Friday Push (05-30)
  {
    id: `tl-${ID}-2026-05-30`, athleteId: ID, date: "2026-05-30",
    trainingDayId: "td-push-fri", trainingDayName: "Push",
    durationSeconds: 4200,
    note: "Bankdrücken +2,5 kg, alle Sätze im Bereich.",
    exercises: [
      { exerciseId: "ex-tp-18", exerciseName: "Bankdrücken (Langhantel)", sets: [
        { setNumber: 1, weight: 82.5, reps: 9, rir: 2 },
        { setNumber: 2, weight: 82.5, reps: 9, rir: 2 },
        { setNumber: 3, weight: 82.5, reps: 8, rir: 2 },
        { setNumber: 4, weight: 82.5, reps: 8, rir: 1 },
      ]},
      { exerciseId: "ex-tp-19", exerciseName: "Schrägbankdrücken (Kurzhantel)", sets: [
        { setNumber: 1, weight: 28, reps: 12, rir: 2 },
        { setNumber: 2, weight: 28, reps: 11, rir: 2 },
        { setNumber: 3, weight: 28, reps: 11, rir: 2 },
      ]},
      { exerciseId: "ex-tp-20", exerciseName: "Schulterdrücken (Langhantel, stehend)", sets: [
        { setNumber: 1, weight: 57.5, reps: 8, rir: 2 },
        { setNumber: 2, weight: 57.5, reps: 8, rir: 2 },
        { setNumber: 3, weight: 57.5, reps: 8, rir: 2 },
      ]},
      { exerciseId: "ex-tp-21", exerciseName: "Seitheben (Kurzhantel)", sets: [
        { setNumber: 1, weight: 10, reps: 18, rir: 2 },
        { setNumber: 2, weight: 10, reps: 17, rir: 2 },
        { setNumber: 3, weight: 10, reps: 16, rir: 2 },
        { setNumber: 4, weight: 10, reps: 15, rir: 2 },
      ]},
      { exerciseId: "ex-tp-22", exerciseName: "Trizeps-Pushdown (Kabelzug)", sets: [
        { setNumber: 1, weight: 32.5, reps: 13, rir: 2 },
        { setNumber: 2, weight: 32.5, reps: 12, rir: 2 },
        { setNumber: 3, weight: 32.5, reps: 12, rir: 2 },
      ]},
      { exerciseId: "ex-tp-23", exerciseName: "Overhead-Extension (Kurzhantel)", sets: [
        { setNumber: 1, weight: 22, reps: 13, rir: 2 },
        { setNumber: 2, weight: 22, reps: 12, rir: 2 },
        { setNumber: 3, weight: 22, reps: 11, rir: 2 },
      ]},
    ],
  },
  // Saturday Pull (05-31)
  {
    id: `tl-${ID}-2026-05-31`, athleteId: ID, date: "2026-05-31",
    trainingDayId: "td-pull-sat", trainingDayName: "Pull",
    durationSeconds: 3960,
    note: "Gutes Samstagstraining. Klimmzüge +1 Wdh gegenüber letzter Woche.",
    exercises: [
      { exerciseId: "ex-tp-24", exerciseName: "Klimmzüge (Körpergewicht)", sets: [
        { setNumber: 1, weight: null, reps: 10, rir: 2 },
        { setNumber: 2, weight: null, reps: 9, rir: 2 },
        { setNumber: 3, weight: null, reps: 8, rir: 2 },
        { setNumber: 4, weight: null, reps: 7, rir: 2 },
      ]},
      { exerciseId: "ex-tp-25", exerciseName: "Rudern (Langhantel, vorgebeugt)", sets: [
        { setNumber: 1, weight: 72.5, reps: 9, rir: 2 },
        { setNumber: 2, weight: 72.5, reps: 9, rir: 2 },
        { setNumber: 3, weight: 72.5, reps: 8, rir: 2 },
        { setNumber: 4, weight: 72.5, reps: 8, rir: 2 },
      ]},
      { exerciseId: "ex-tp-26", exerciseName: "Latzug (breiter Griff)", sets: [
        { setNumber: 1, weight: 67.5, reps: 11, rir: 2 },
        { setNumber: 2, weight: 67.5, reps: 10, rir: 2 },
        { setNumber: 3, weight: 67.5, reps: 10, rir: 2 },
      ]},
      { exerciseId: "ex-tp-27", exerciseName: "Gesichtsziehen (Kabelzug)", sets: [
        { setNumber: 1, weight: 20, reps: 18, rir: 2 },
        { setNumber: 2, weight: 20, reps: 17, rir: 2 },
        { setNumber: 3, weight: 20, reps: 16, rir: 2 },
      ]},
      { exerciseId: "ex-tp-28", exerciseName: "Bizeps-Curls (Langhantel)", sets: [
        { setNumber: 1, weight: 40, reps: 11, rir: 2 },
        { setNumber: 2, weight: 40, reps: 10, rir: 2 },
        { setNumber: 3, weight: 40, reps: 10, rir: 2 },
      ]},
      { exerciseId: "ex-tp-29", exerciseName: "Hammer-Curls (Kurzhantel)", sets: [
        { setNumber: 1, weight: 16, reps: 14, rir: 2 },
        { setNumber: 2, weight: 16, reps: 13, rir: 2 },
        { setNumber: 3, weight: 16, reps: 12, rir: 2 },
      ]},
    ],
  },
];

// ─── Calorie Tracker Days ─────────────────────────────────────────────────────

function makeMeals(date: string, isTrainingDay: boolean) {
  const d = date.replace(/-/g, "");
  const frueh = {
    id: `meal-f-${d}`, name: "Frühstück",
    entries: [
      ctEntry(`e-f1-${d}`, FOODS.haferflocken, 80),
      ctEntry(`e-f2-${d}`, FOODS.magerquark, 200),
      ctEntry(`e-f3-${d}`, FOODS.beerenmix, 100),
    ],
  };
  const mittag = {
    id: `meal-m-${d}`, name: "Mittagessen",
    entries: [
      ctEntry(`e-m1-${d}`, FOODS.haehnchenbrust, 200),
      ctEntry(`e-m2-${d}`, FOODS.reis, 200),
      ctEntry(`e-m3-${d}`, FOODS.brokkoli, 200),
      ctEntry(`e-m4-${d}`, FOODS.olivenoel, 10),
    ],
  };
  const preworkout = isTrainingDay ? {
    id: `meal-pw-${d}`, name: "Pre-Workout Snack",
    entries: [
      ctEntry(`e-pw1-${d}`, FOODS.banane, 100),
      ctEntry(`e-pw2-${d}`, FOODS.whey, 30),
    ],
  } : null;
  const abend = {
    id: `meal-a-${d}`, name: "Abendessen",
    entries: [
      ctEntry(`e-a1-${d}`, FOODS.haehnchenbrust, 200),
      ctEntry(`e-a2-${d}`, FOODS.kartoffeln, isTrainingDay ? 300 : 200),
      ctEntry(`e-a3-${d}`, FOODS.spinat, 150),
      ctEntry(`e-a4-${d}`, FOODS.olivenoel, 10),
    ],
  };
  const snack = {
    id: `meal-s-${d}`, name: "Abend-Snack",
    entries: [
      ctEntry(`e-s1-${d}`, FOODS.magerquark, 200),
      ctEntry(`e-s2-${d}`, FOODS.chiasamen, 15),
    ],
  };
  return [frueh, mittag, ...(preworkout ? [preworkout] : []), abend, snack];
}

const calorieTrackerDays = [
  { id: `ct-${ID}-2026-05-25`, athleteId: ID, date: "2026-05-25", meals: makeMeals("2026-05-25", false) },
  { id: `ct-${ID}-2026-05-26`, athleteId: ID, date: "2026-05-26", meals: makeMeals("2026-05-26", true) },
  { id: `ct-${ID}-2026-05-27`, athleteId: ID, date: "2026-05-27", meals: makeMeals("2026-05-27", true) },
  { id: `ct-${ID}-2026-05-28`, athleteId: ID, date: "2026-05-28", meals: makeMeals("2026-05-28", true) },
  { id: `ct-${ID}-2026-05-29`, athleteId: ID, date: "2026-05-29", meals: makeMeals("2026-05-29", false) },
  { id: `ct-${ID}-2026-05-30`, athleteId: ID, date: "2026-05-30", meals: makeMeals("2026-05-30", true) },
  { id: `ct-${ID}-2026-05-31`, athleteId: ID, date: "2026-05-31", meals: makeMeals("2026-05-31", true) },
];

// ─── Weekly Adjustments ───────────────────────────────────────────────────────

const weeklyAdjustments = [
  {
    id: `adj-${ID}-001`, athleteId: ID, weekStart: "2026-05-26",
    category: "nutrition" as const,
    title: "Proteinzufuhr prüfen",
    description: "Sehr gute erste Woche! Ziel für nächste Woche: Protein auf mindestens 200g täglich erhöhen. Füge nach Bedarf einen zusätzlichen Whey-Shake hinzu. Die Kalorien bleiben bei ~2100 kcal.",
    visibleToAthlete: true,
    createdAt: "2026-05-31T09:00:00.000Z",
  },
  {
    id: `adj-${ID}-002`, athleteId: ID, weekStart: "2026-05-26",
    category: "training" as const,
    title: "Progressive Überladung – nächste Schritte",
    description: "Bankdrücken: Nächste Woche mit 82,5 kg beginnen (bereits erreicht, weiter zu 85 kg). Klimmzüge: Wenn du 10 Wdh. im ersten Satz schaffst, add 2,5 kg Zusatzgewicht. Kniebeuge: Bei 95 kg × 10 in allen Sätzen → auf 100 kg erhöhen.",
    visibleToAthlete: true,
    createdAt: "2026-05-31T09:05:00.000Z",
  },
  {
    id: `adj-${ID}-003`, athleteId: ID, weekStart: "2026-05-26",
    category: "general" as const,
    title: "Erste Woche – Auswertung",
    description: "Hervorragende erste Woche! Alle 5 Trainingseinheiten durchgeführt, Ernährung 100% konsequent. Gewicht sank um 0,4 kg (83,8 → 83,4 kg). Weiter so! Trend ist sehr positiv.",
    visibleToAthlete: false,
    createdAt: "2026-05-31T09:10:00.000Z",
  },
];

// ─── Notes ────────────────────────────────────────────────────────────────────

const notes = [
  {
    id: `note-${ID}-001`, athleteId: ID,
    type: "coach_internal" as const,
    content: "Sehr motivierter und disziplinierter Athlet. Erste Woche mit perfekter Compliance. Alle Trainingseinheiten absolviert, Ernährung 100% sauber. Gewicht entwickelt sich positiv. Progression im Training gut – neuer Kniebeuge-Rekord am Mittwoch.",
    createdAt: "2026-05-31T09:15:00.000Z",
  },
  {
    id: `note-${ID}-002`, athleteId: ID,
    type: "coach_visible" as const,
    content: "Fantastische erste Woche! Du hast alle Trainingseinheiten absolviert und dich zu 100% an den Ernährungsplan gehalten. Das Gewicht ist bereits um 400g gesunken – ein sehr guter Start. Dein Kniebeuge-Rekord am Mittwoch zeigt, dass du trotz Kaloriendefizit Kraft aufbaust. Weiter so!",
    createdAt: "2026-05-31T09:15:00.000Z",
  },
];

// ─── Main Athlete Export ──────────────────────────────────────────────────────

export const testAthlete: Athlete = {
  id: ID,
  name: "Test",
  email: "test@coaching.app",
  pin: "1234",
  avatarInitials: "TE",
  onboardingCompleted: true,

  legalConsent: {
    privacyAccepted: true,
    privacyAcceptedAt: "2026-05-19T10:00:00.000Z",
    contractAccepted: true,
    contractAcceptedAt: "2026-05-19T10:01:00.000Z",
    signedName: "Test Athlet",
    legalVersion: "1.0",
  },

  profile: {
    personal: { email: "test@coaching.app", birthDate: "1995-03-15" },
    body: { lowestWeightThreeYears: 78, highestWeightThreeYears: 91 },
    lifestyle: { occupation: "Büroangestellter", weeklyWorkloadHours: 40, stressLevel: 3, averageSteps: 8000, currentCardio: "2× wöchentlich 20 min lockeres Laufen oder Radfahren" },
    recovery: { sleepHours: 7.5, sleepQuality: 4, morningRecovery: 3, sleepScheduleRegularity: 4 },
    health: { hasInjuries: "nein", hasHealthIssues: "nein", medications: "keine", hasDigestionIssues: "nein" },
    nutrition: { dietType: ["Omnivor"], currentTrackingStatus: "gelegentlich", currentCalories: 2500, calorieCountingConfidence: 3, macroConfidence: 3, mealPlanAdherenceConfidence: 4 },
    foodPreferences: { proteinSources: ["Hähnchen", "Eier", "Magerquark", "Whey Protein"], favoriteFoods: "Hähnchen, Reis, Haferflocken, Bananen, Magerquark", dislikedFoods: "Fisch (außer Thunfisch aus der Dose)", triggerFoods: "Süßigkeiten und Chips abends nach 20 Uhr" },
    supplements: { currentSupplements: ["Kreatin", "Whey Protein"], caffeineMg: 200, caffeineSources: ["Kaffee"] },
    training: { trainingAge: "4 Jahre", structuredTrainingAge: "2 Jahre", weeklySessions: 5, currentSessionDuration: 60, bestLifts: "Bankdrücken 80 kg × 8, Kniebeuge 90 kg × 8, Kreuzheben 120 kg × 5", freeWeightsOrMachines: "Freie Gewichte bevorzugt, Maschinen ergänzend" },
    availability: { realisticTrainingDays: 5, availableWeekdays: [1, 2, 3, 5, 6], sessionTimeAvailable: 75, trainingLocation: "Fitnessstudio", equipment: "Langhantel, Kurzhanteln (bis 40 kg), Maschinen, Kabelzug, Beinpresse" },
    goals: { shortTermGoal: "In 4 Wochen 2 kg abnehmen ohne sichtbaren Muskelverlust", longTermGoal: "In 16 Wochen 10 kg Körperfett verlieren und dabei möglichst viel Muskelmasse erhalten", priorities: ["Körperkomposition verbessern", "Kraft erhalten"], physiqueImportance: 5, strengthImportance: 4, lifestyleImportance: 3 },
    coachingPreferences: { feedbackDirectness: 4, explanationDepth: "mittel", checkInReliability: 5, preferredCheckInDay: 1 },
    finalNotes: { coachShouldKnow: "Bin sehr motiviert und bereit alles umzusetzen. Abendlicher Hunger ist meine größte Herausforderung.", supportFocus: "Ernährungsstrategie gegen Abend-Hunger, Trainingsplanung für Progressive Überladung", confirmed: true },
  },

  startWeight: 85.0,
  currentWeight: 83.4,
  targetWeight: 75.0,
  goalType: "cut",
  goalText: "10 kg Körperfett abbauen in 16 Wochen, Muskelmasse erhalten",
  checkInDay: 1,

  height: 181,
  startDate: "2026-05-19",
  experienceLevel: "intermediate",
  trainingHistory: "4 Jahre Krafttraining, davon 2 Jahre strukturiert. Push/Pull/Legs Split. Früher auch Fußball (bis 18 Jahre).",
  injuries: "Keine aktuellen Verletzungen. Vor 2 Jahren leichte Schulterprellung, vollständig ausgeheilt.",
  specialNotes: "Testathlet – vollständige Beispieldaten für alle App-Funktionen. PIN: 1234",
  trackingDevice: "apple_watch",

  dailyCheckConfig: { ...DEFAULT_DAILY_CHECK_CONFIG },

  coachNote: "Sehr konsistenter Athlet mit hoher Compliance. Erste Woche perfekt durchgezogen. Besonders stark bei Beinen (Kniebeuge-Rekord). Nächster Fokus: Bankdrücken auf 90 kg bringen.",
  visibleNote: "Großartige erste Woche! Du bist auf dem richtigen Weg. Halte die Konsistenz aufrecht – das ist dein stärkstes Werkzeug. Nächstes Ziel: 83,0 kg bis Ende nächster Woche.",

  dailyCheckIns,
  weeklyCheckIns,
  weeklyAdjustments,
  trainingLogs,
  calorieTrackerDays,
  mealPlans: [mealPlan],
  trainingPlan,
  supplementPlan,
  notes,
  joinedAt: "2026-05-19",
  weeklyTrendTargetPercent: -0.5,
};
