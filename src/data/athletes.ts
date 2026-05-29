import { Athlete, DailyCheckIn, MealComplianceType, DailyCheckConfig, TrainingLog, TrainingExerciseLog, TrainingSetLog } from "@/types";
import { foodItems } from "./foodItems";

const f = (id: string) => foodItems.find((item) => item.id === id)!;

// ─── Helpers for deterministic test data generation ──────────────────────────

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function toScale(val: number): 1 | 2 | 3 | 4 | 5 {
  return clamp(Math.round(val), 1, 5) as 1 | 2 | 3 | 4 | 5;
}

function isoDateOffset(year: number, month: number, day: number, offset: number): string {
  const d = new Date(year, month - 1, day + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay(); // 0=Sun … 6=Sat
}

// 60 daily check-ins from 2026-03-29 to 2026-05-27
function generateDailyCheckIns(athleteId: string): DailyCheckIn[] {
  const result: DailyCheckIn[] = [];

  for (let i = 0; i < 60; i++) {
    const date = isoDateOffset(2026, 3, 29, i);
    const wd = weekdayOf(date);

    const isTraining = [1, 2, 4, 5].includes(wd); // Mon Tue Thu Fri
    const weekNum = Math.floor(i / 7);
    const isCardio = [1, 4].includes(wd) && weekNum % 2 === 0; // alternate weeks
    const isWeekend = wd === 0 || wd === 6;

    // Weight: starts 90.2, slight downtrend, realistic wave
    const w = 90.2 - i * 0.013 + 0.4 * Math.sin(i * 0.8) + 0.15 * Math.cos(i * 1.7);
    const weight = Math.round(clamp(w, 89.0, 91.5) * 10) / 10;

    // Sleep
    const sh = (isWeekend ? 7.8 : 7.1) + 0.5 * Math.sin(i * 0.9 + 1);
    const sleepHours = Math.round(clamp(sh, 6.0, 9.0) * 2) / 2;
    const sleepQuality = toScale(
      sleepHours >= 8 ? 4.5 : sleepHours >= 7 ? 3.8 : sleepHours >= 6.5 ? 3.0 : 2.0
    );

    // Stress (higher mid-week)
    const stressBase = isWeekend ? 1.5 : [2, 3, 4].includes(wd) ? 3.0 : 2.5;
    const stressLevel = toScale(stressBase + 0.6 * Math.sin(i * 1.1));

    // Energy & mood derived from sleep and stress
    const energyLevel = toScale(sleepQuality - stressLevel + 4 + 0.3 * Math.sin(i * 0.7));
    const mood = toScale(
      energyLevel + (isWeekend ? 0.5 : 0) - (stressLevel >= 4 ? 0.5 : 0) + 0.2 * Math.sin(i * 1.5)
    );

    const appetite = toScale(3 + (isTraining ? 0.5 : 0) + 0.4 * Math.sin(i * 0.6));
    const digestion = toScale(4 - 0.3 * Math.cos(i * 1.2));
    const trainingQuality = isTraining
      ? toScale(
          3.5 +
            (energyLevel >= 4 ? 0.5 : 0) -
            (stressLevel >= 4 ? 0.5 : 0) +
            0.3 * Math.sin(i * 0.8)
        )
      : (3 as 1 | 2 | 3 | 4 | 5);

    const stepsRaw = (isTraining ? 9500 : isWeekend ? 7000 : 7500) + 1500 * Math.sin(i * 0.9);
    const steps = clamp(Math.round(stepsRaw), 5000, 14000);

    const hrv = clamp(
      Math.round(65 + 12 * Math.sin(i * 0.7) - (stressLevel >= 4 ? 8 : 0)),
      45,
      85
    );
    const restingHeartRate = clamp(
      Math.round(62 - 2 * Math.sin(i * 0.5) + (stressLevel >= 4 ? 3 : 0)),
      55,
      70
    );
    const spO2 = clamp(Math.round(97.5 + 0.8 * Math.sin(i * 0.4)), 96, 99);
    const bpSys = clamp(Math.round(121 + 5 * Math.sin(i * 0.6)), 115, 130);
    const bpDia = clamp(Math.round(76 + 4 * Math.cos(i * 0.5)), 70, 85);

    // Meal compliance – majority full, some deviations
    const cr = (Math.sin(i * 13.7) + 1) / 2;
    const mealCompliance: MealComplianceType =
      cr > 0.95 ? "major_deviation" : cr > 0.75 ? "minor_deviation" : "full";

    const noteMap: Record<number, string> = {
      10: "Starkes Training heute! Neue Bestleistung auf Bankdrücken.",
      25: "Wenig Schlaf, trotzdem gutes Training durchgezogen.",
      38: "Stressige Woche – Erholung priorisieren.",
      45: "Fühle mich sehr gut, Gewicht geht langsam runter.",
      55: "Top Regenerationswoche.",
    };

    result.push({
      id: `dc-${athleteId}-${i}`,
      athleteId,
      date,
      weight,
      measurementTime: "07:15",
      appetite,
      digestion,
      trackingAccuracy: toScale(3.5 + 1.5 * Math.sin(i * 0.9 + 2)),
      caffeine: isTraining ? 200 : 150,
      steps,
      cardio: isCardio,
      cardioDuration: isCardio ? 30 : undefined,
      training: isTraining,
      trainingQuality,
      sleepHours,
      sleepQuality,
      restingHeartRate,
      hrv,
      spO2,
      bloodPressure: { systolic: bpSys, diastolic: bpDia },
      energyLevel,
      stressLevel,
      mood,
      note: noteMap[i] ?? "",
      mealCompliance,
      deviationReason: mealCompliance !== "full" ? "Essen auswärts, grob getrackt." : undefined,
    });
  }

  return result;
}

// ─── Training Log seed data ───────────────────────────────────────────────────

function makeExLog(id: string, name: string, weight: number, repsPerSet: number[]): TrainingExerciseLog {
  return {
    exerciseId: id,
    exerciseName: name,
    sets: repsPerSet.map((reps, i): TrainingSetLog => ({
      setNumber: i + 1,
      weight,
      reps,
      rir: i === repsPerSet.length - 1 ? 1 : 2,
    })),
  };
}

function makePushExercises(s: number): TrainingExerciseLog[] {
  // s = session index 0-7
  const bankW = s < 3 ? 70 : s < 6 ? 72.5 : 75;
  const bankR: [number[], number[], number[], number[], number[], number[], number[], number[]] = [
    [7,6,5],[8,7,6],[8,8,7],[6,6,5],[7,7,6],[8,8,7],[7,6,5],[8,7,6]
  ];
  const schrW = s < 3 ? 22 : s < 6 ? 24 : 26;
  const schrR: [number[], number[], number[], number[], number[], number[], number[], number[]] = [
    [10,9,8],[11,10,9],[12,11,10],[10,9,8],[11,10,9],[12,11,10],[10,9,8],[11,10,9]
  ];
  const sdW = [60,60,62,62,64,64,66,66][s];
  const sdR: [number[], number[], number[], number[], number[], number[], number[], number[]] = [
    [10,9,8],[11,10,9],[10,9,8],[11,10,9],[10,9,8],[11,10,9],[10,9,8],[11,10,9]
  ];
  const shW = s < 3 ? 8 : s < 6 ? 9 : 10;
  const shR: [number[], number[], number[], number[], number[], number[], number[], number[]] = [
    [16,15,14],[17,16,15],[18,17,16],[15,14,13],[16,15,14],[17,16,15],[15,14,13],[16,15,14]
  ];
  const triW = s < 3 ? 27.5 : s < 6 ? 30 : 32.5;
  const triR: [number[], number[], number[], number[], number[], number[], number[], number[]] = [
    [13,12,11],[14,13,12],[15,14,12],[12,11,10],[13,12,11],[14,13,12],[12,11,10],[13,12,11]
  ];
  return [
    makeExLog("ex-max-1", "Bankdrücken (Langhantel)", bankW, bankR[s]),
    makeExLog("ex-max-2", "Schrägbank Kurzhantel", schrW, schrR[s]),
    makeExLog("ex-max-3", "Schulterdrücken (Maschine)", sdW, sdR[s]),
    makeExLog("ex-max-4", "Seitheben (Kabel)", shW, shR[s]),
    makeExLog("ex-max-5", "Trizepsdrücken (Kabel)", triW, triR[s]),
  ];
}

function makePullExercises(s: number): TrainingExerciseLog[] {
  const lzW = s < 2 ? 75 : s < 4 ? 77.5 : s < 6 ? 80 : 82.5;
  const lzR: [number[], number[], number[], number[], number[], number[], number[], number[]] = [
    [9,8,7],[10,9,8],[8,7,7],[9,8,7],[8,7,7],[9,8,7],[8,7,6],[9,8,7]
  ];
  const ruW = s < 3 ? 80 : s < 6 ? 82.5 : 85;
  const ruR: [number[], number[], number[], number[], number[], number[], number[], number[]] = [
    [9,8,7],[9,9,8],[8,7,7],[9,8,7],[9,9,8],[8,7,7],[9,8,7],[9,9,8]
  ];
  const krW = s < 2 ? 55 : s < 4 ? 57.5 : s < 6 ? 60 : 62.5;
  const krR: [number[], number[], number[], number[], number[], number[], number[], number[]] = [
    [13,12,11],[14,13,12],[12,11,10],[13,12,11],[12,11,10],[13,12,11],[12,11,10],[13,12,11]
  ];
  const bzW = s < 3 ? 14 : s < 7 ? 16 : 18;
  const bzR: [number[], number[], number[], number[], number[], number[], number[], number[]] = [
    [10,9,8],[11,10,9],[12,11,10],[10,9,8],[11,10,9],[12,11,10],[12,11,10],[10,9,8]
  ];
  const fpW = s < 3 ? 15 : s < 6 ? 17.5 : 20;
  const fpR: [number[], number[], number[], number[], number[], number[], number[], number[]] = [
    [17,16,15],[18,17,16],[19,18,16],[15,14,13],[16,15,14],[17,16,15],[15,14,13],[16,15,14]
  ];
  return [
    makeExLog("ex-max-6", "Latzug (Maschine)", lzW, lzR[s]),
    makeExLog("ex-max-7", "Rudern (Langhantel)", ruW, ruR[s]),
    makeExLog("ex-max-8", "Kabelrudern", krW, krR[s]),
    makeExLog("ex-max-9", "Bizepscurls (Kurzhantel)", bzW, bzR[s]),
    makeExLog("ex-max-10", "Face Pulls", fpW, fpR[s]),
  ];
}

function makeLegsExercises(s: number): TrainingExerciseLog[] {
  const kbW = s < 2 ? 80 : s < 4 ? 82.5 : s < 6 ? 85 : 87.5;
  const kbR: [number[], number[], number[], number[], number[], number[], number[], number[]] = [
    [8,7,6,5],[8,8,7,6],[7,6,6,5],[8,7,6,5],[7,6,5,5],[8,7,6,6],[7,6,5,5],[8,7,6,5]
  ];
  const bpW = [130,130,140,140,150,150,160,160][s];
  const bpR: [number[], number[], number[], number[], number[], number[], number[], number[]] = [
    [11,10,9],[12,11,10],[10,9,8],[11,10,9],[10,9,8],[11,10,9],[10,9,8],[11,10,9]
  ];
  const bcW = s < 2 ? 40 : s < 4 ? 42.5 : s < 6 ? 45 : 47.5;
  const bcR: [number[], number[], number[], number[], number[], number[], number[], number[]] = [
    [12,11,10],[13,12,11],[11,10,9],[12,11,10],[11,10,9],[12,11,10],[11,10,9],[12,11,10]
  ];
  const whW = s < 2 ? 60 : s < 4 ? 65 : s < 6 ? 70 : 75;
  const whR: [number[], number[], number[], number[], number[], number[], number[], number[]] = [
    [17,16,15,14],[18,17,16,15],[16,15,14,13],[17,16,15,14],[16,15,14,13],[17,16,15,14],[16,15,14,13],[17,16,15,14]
  ];
  return [
    makeExLog("ex-max-11", "Kniebeugen (Langhantel)", kbW, kbR[s]),
    makeExLog("ex-max-12", "Beinpresse", bpW, bpR[s]),
    makeExLog("ex-max-13", "Beincurl (Maschine)", bcW, bcR[s]),
    makeExLog("ex-max-14", "Wadenheben (Maschine)", whW, whR[s]),
  ];
}

function generateTrainingLogs(athleteId: string): TrainingLog[] {
  // 8 sessions each: Push (Mon), Pull (Tue), Legs (Thu)
  // Weeks start 2026-03-30; skip week of May 18 for realism
  const pushDates = ["2026-03-30","2026-04-06","2026-04-13","2026-04-20","2026-04-27","2026-05-04","2026-05-11","2026-05-25"];
  const pullDates = ["2026-03-31","2026-04-07","2026-04-14","2026-04-21","2026-04-28","2026-05-05","2026-05-12","2026-05-26"];
  const legsDates = ["2026-04-02","2026-04-09","2026-04-16","2026-04-23","2026-04-30","2026-05-07","2026-05-14","2026-05-28"];

  const logs: TrainingLog[] = [];
  for (let s = 0; s < 8; s++) {
    logs.push({ id: `tl-${athleteId}-A-${s}`, athleteId, date: pushDates[s], trainingDayId: "td-max-1", trainingDayName: "Training A – Push", exercises: makePushExercises(s) });
    logs.push({ id: `tl-${athleteId}-B-${s}`, athleteId, date: pullDates[s], trainingDayId: "td-max-2", trainingDayName: "Training B – Pull", exercises: makePullExercises(s) });
    logs.push({ id: `tl-${athleteId}-C-${s}`, athleteId, date: legsDates[s], trainingDayId: "td-max-3", trainingDayName: "Training C – Legs", exercises: makeLegsExercises(s) });
  }
  return logs;
}

const MAX_DAILY_CHECK_CONFIG: DailyCheckConfig = {
  bodyweight: true,
  sleepDuration: true,
  sleepQuality: true,
  sleepScore: false,
  steps: true,
  restingHeartRate: true,
  hrv: true,
  spO2: true,
  bloodPressure: true,
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

export const athletes: Athlete[] = [
  {
    id: "max",
    name: "Max Mustermann",
    pin: "1234",
    avatarInitials: "MM",
    startWeight: 90.0,
    currentWeight: 89.4,
    targetWeight: 85.0,
    goalType: "recomp",
    goalText: "Körperkomposition verbessern – Muskelaufbau bei gleichzeitigem Fettabbau",
    checkInDay: 1, // Monday
    height: 180,
    startDate: "2026-03-29",
    experienceLevel: "intermediate",
    trainingHistory: "3 Jahre Krafttraining (25 Jahre alt), Grundbewegungen solide erlernt, bereit für nächste Stufe",
    injuries: "Keine aktuellen Verletzungen",
    specialNotes: "Probeathlet – alle neuen Funktionen testbar",
    trackingDevice: "apple_watch",
    dailyCheckConfig: MAX_DAILY_CHECK_CONFIG,
    coachNote: "Max ist motiviert und diszipliniert. Fokus auf progressive Überlastung, Gewichtstrend beobachten.",
    visibleNote: "Fokus diese Woche: progressive Überlastung und ausreichend Schlaf (mind. 7 h).",
    dailyCheckIns: generateDailyCheckIns("max"),
    weeklyCheckIns: [
      {
        id: "wc-max-1",
        athleteId: "max",
        weekStart: "2026-04-07",
        date: "2026-04-07",
        overallWeekRating: 4,
        weekSatisfaction: 4,
        selfSatisfaction: 3,
        nutritionAdherence: 4,
        hungerCravings: "Leichte Süßigkeiten-Cravings abends.",
        trainingRating: 5,
        recoveryRating: 4,
        sleepAvg: 7.2,
        stressAvg: 2.5,
        energyAvg: 3.8,
        specialEvents: "",
        coachNote: "",
        freeNote: "Gute erste Woche, fühle mich wohl im neuen Plan.",
      },
      {
        id: "wc-max-2",
        athleteId: "max",
        weekStart: "2026-04-28",
        date: "2026-04-28",
        overallWeekRating: 3,
        weekSatisfaction: 3,
        selfSatisfaction: 3,
        nutritionAdherence: 3,
        hungerCravings: "Kaum Hunger, kein Craving.",
        trainingRating: 4,
        recoveryRating: 3,
        sleepAvg: 7.0,
        stressAvg: 3.2,
        energyAvg: 3.2,
        specialEvents: "Stressige Woche auf der Arbeit.",
        coachNote: "",
        freeNote: "Schwierige Woche, aber dran geblieben.",
      },
      {
        id: "wc-max-3",
        athleteId: "max",
        weekStart: "2026-05-19",
        date: "2026-05-19",
        overallWeekRating: 5,
        weekSatisfaction: 5,
        selfSatisfaction: 4,
        nutritionAdherence: 5,
        hungerCravings: "Kein Hunger, kein Craving.",
        trainingRating: 5,
        recoveryRating: 5,
        sleepAvg: 7.6,
        stressAvg: 2.0,
        energyAvg: 4.2,
        specialEvents: "",
        coachNote: "",
        freeNote: "Beste Woche seit dem Start. Fortschritt ist spürbar!",
      },
    ],
    weeklyAdjustments: [],
    trainingLogs: generateTrainingLogs("max"),
    calorieTrackerDays: [],
    mealPlan: {
      id: "mp-max-1",
      athleteId: "max",
      title: "Recomp-Phase – Ausgewogenes Makro-Setup",
      coachNote:
        "Kohlenhydrate um Training herum konzentrieren. Protein mind. 170 g/Tag. An Ruhetagen Carbs leicht reduzieren.",
      createdAt: "2026-03-29",
      meals: [
        {
          id: "m-max-1",
          name: "Frühstück",
          time: "07:30",
          entries: [
            { foodItemId: "haferflocken", foodItem: f("haferflocken"), amountG: 80 },
            { foodItemId: "magerquark", foodItem: f("magerquark"), amountG: 200 },
            { foodItemId: "beerenmix", foodItem: f("beerenmix"), amountG: 100 },
            { foodItemId: "chiasamen", foodItem: f("chiasamen"), amountG: 15 },
          ],
          note: "Nüchtern wiegen, dann essen.",
        },
        {
          id: "m-max-2",
          name: "Pre-Workout",
          time: "12:00",
          entries: [
            { foodItemId: "reis_gekocht", foodItem: f("reis_gekocht"), amountG: 250 },
            { foodItemId: "haehnchenbrust", foodItem: f("haehnchenbrust"), amountG: 150 },
            { foodItemId: "brokkoli", foodItem: f("brokkoli"), amountG: 200 },
            { foodItemId: "olivenoel", foodItem: f("olivenoel"), amountG: 10 },
          ],
        },
        {
          id: "m-max-3",
          name: "Post-Workout Shake",
          time: "15:00",
          entries: [
            { foodItemId: "whey_protein", foodItem: f("whey_protein"), amountG: 30 },
            { foodItemId: "banane", foodItem: f("banane"), amountG: 120 },
          ],
        },
        {
          id: "m-max-4",
          name: "Abendessen",
          time: "19:00",
          entries: [
            { foodItemId: "haehnchenbrust", foodItem: f("haehnchenbrust"), amountG: 200 },
            { foodItemId: "kartoffeln", foodItem: f("kartoffeln"), amountG: 300 },
            { foodItemId: "spinat", foodItem: f("spinat"), amountG: 150 },
            { foodItemId: "olivenoel", foodItem: f("olivenoel"), amountG: 10 },
          ],
          note: "An trainingsfreien Tagen Kartoffeln auf 200 g reduzieren.",
        },
        {
          id: "m-max-5",
          name: "Late Night",
          time: "22:00",
          entries: [
            { foodItemId: "magerquark", foodItem: f("magerquark"), amountG: 250 },
          ],
          note: "Optional – nur bei Hunger.",
        },
      ],
    },
    trainingPlan: {
      id: "tp-max-1",
      athleteId: "max",
      title: "Push / Pull / Legs – Flexibel (3–4 Tage)",
      mode: "flexible",
      coachNote:
        "Fokus auf progressive Überlastung. RIR 2 als Richtlinie. Deload alle 6–8 Wochen.",
      createdAt: "2026-03-29",
      generalCardio:
        "2× pro Woche 30 min LISS (Spazieren, Radfahren, Schwimmen), bevorzugt an Ruhetagen.",
      days: [
        {
          id: "td-max-1",
          dayName: "Training A",
          label: "Push",
          exercises: [
            {
              id: "ex-max-1",
              name: "Bankdrücken (Langhantel)",
              sets: 3,
              reps: "6-8",
              rir: 1,
              note: "Schulterbreiter Griff, Ellbogen ca. 70°",
              muscleGroup: "Brust",
            },
            {
              id: "ex-max-2",
              name: "Schrägbank Kurzhantel",
              sets: 3,
              reps: "10-12",
              rir: 2,
              muscleGroup: "Brust",
            },
            {
              id: "ex-max-3",
              name: "Schulterdrücken (Maschine)",
              sets: 3,
              reps: "10-12",
              rir: 2,
              muscleGroup: "Schulter",
            },
            {
              id: "ex-max-4",
              name: "Seitheben (Kabel)",
              sets: 3,
              reps: "15-20",
              rir: 1,
              muscleGroup: "Schulter",
            },
            {
              id: "ex-max-5",
              name: "Trizepsdrücken (Kabel)",
              sets: 3,
              reps: "12-15",
              rir: 2,
              muscleGroup: "Trizeps",
            },
          ],
        },
        {
          id: "td-max-2",
          dayName: "Training B",
          label: "Pull",
          exercises: [
            {
              id: "ex-max-6",
              name: "Latzug (Maschine)",
              sets: 3,
              reps: "8-12",
              rir: 1,
              note: "Weiter Griff, Schulterblätter nach unten ziehen",
              muscleGroup: "Rücken",
            },
            {
              id: "ex-max-7",
              name: "Rudern (Langhantel)",
              sets: 3,
              reps: "8-10",
              rir: 2,
              muscleGroup: "Rücken",
            },
            {
              id: "ex-max-8",
              name: "Kabelrudern",
              sets: 3,
              reps: "12-15",
              rir: 2,
              muscleGroup: "Rücken",
            },
            {
              id: "ex-max-9",
              name: "Bizepscurls (Kurzhantel)",
              sets: 3,
              reps: "10-12",
              rir: 2,
              muscleGroup: "Bizeps",
            },
            {
              id: "ex-max-10",
              name: "Face Pulls",
              sets: 3,
              reps: "15-20",
              rir: 1,
              muscleGroup: "Schulter / Rotatorenmanschette",
            },
          ],
        },
        {
          id: "td-max-3",
          dayName: "Training C",
          label: "Legs",
          exercises: [
            {
              id: "ex-max-11",
              name: "Kniebeugen (Langhantel)",
              sets: 4,
              reps: "6-10",
              rir: 2,
              note: "Tief, Knie über Zehen, kontrolliert absenken",
              muscleGroup: "Beine",
            },
            {
              id: "ex-max-12",
              name: "Beinpresse",
              sets: 3,
              reps: "10-12",
              rir: 2,
              muscleGroup: "Beine",
            },
            {
              id: "ex-max-13",
              name: "Beincurl (Maschine)",
              sets: 3,
              reps: "10-15",
              rir: 1,
              muscleGroup: "Beinbizeps",
            },
            {
              id: "ex-max-14",
              name: "Wadenheben (Maschine)",
              sets: 4,
              reps: "15-20",
              rir: 1,
              muscleGroup: "Waden",
            },
          ],
        },
        {
          id: "td-max-4",
          dayName: "Training D",
          label: "Upper (Optional)",
          note: "Optionaler 4. Tag – nur wenn Regeneration gut ist.",
          exercises: [
            {
              id: "ex-max-15",
              name: "Schulterdrücken (Langhantel)",
              sets: 3,
              reps: "8-10",
              rir: 2,
              muscleGroup: "Schulter",
            },
            {
              id: "ex-max-16",
              name: "Klimmzüge",
              sets: 3,
              reps: "6-10",
              rir: 2,
              muscleGroup: "Rücken",
            },
            {
              id: "ex-max-17",
              name: "Dips",
              sets: 3,
              reps: "10-12",
              rir: 2,
              muscleGroup: "Brust / Trizeps",
            },
            {
              id: "ex-max-18",
              name: "Hammercurls",
              sets: 3,
              reps: "12-15",
              rir: 2,
              muscleGroup: "Bizeps / Unterarm",
            },
          ],
        },
      ],
    },
    supplementPlan: {
      id: "sp-max-1",
      athleteId: "max",
      coachNote:
        "Basis-Supplements für Recomp. Kreatin täglich, auch an Ruhetagen. Alles optional, kein Ersatz für gute Ernährung.",
      supplements: [
        {
          id: "supp-max-1",
          name: "Kreatin Monohydrat",
          dosage: "5 g",
          timing: "Post-Workout oder morgens",
          instructions: "Mit Wasser oder Shake – täglich auch an Ruhetagen",
          note: "Ladephase nicht notwendig.",
          link: "https://examine.com/supplements/creatine/",
        },
        {
          id: "supp-max-2",
          name: "Omega-3 (Fischöl)",
          dosage: "2 Kapseln",
          timing: "Zum Mittagessen oder Abendessen",
          instructions: "Zu einer fettreichen Mahlzeit für bessere Aufnahme",
        },
        {
          id: "supp-max-3",
          name: "Vitamin D3 + K2",
          dosage: "2000 I.E. D3 / 100 µg K2",
          timing: "Morgens zum Frühstück",
          instructions: "Fettlöslich – zum Essen nehmen",
          note: "Blutwert nach 3 Monaten prüfen lassen.",
        },
        {
          id: "supp-max-4",
          name: "Magnesium (Glycinat)",
          dosage: "300 mg",
          timing: "Abends ca. 30 min vor dem Schlafen",
          instructions: "Hilft bei Schlafqualität und Muskelregeneration",
        },
      ],
    },
    notes: [
      {
        id: "note-max-1",
        athleteId: "max",
        type: "coach_visible",
        content:
          "Max, dein Start ist sehr solide! Gewicht bewegt sich in die richtige Richtung. Weiter so konsequent.",
        createdAt: "2026-04-14",
      },
      {
        id: "note-max-2",
        athleteId: "max",
        type: "coach_internal",
        content:
          "Probeathlet für Systemtest – alle neuen Funktionen (Daily Checks, Analyse, Training, Supplements, Ernährung) geprüft.",
        createdAt: "2026-03-29",
      },
    ],
    joinedAt: "2026-03-29",
  },
];
