import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ─── Exercise DB upserts ──────────────────────────────────────────────────────

const exercisesToUpsert = [
  // Updated existing
  { id: "ex-leg-curl", name: "Leg Curl liegend", muscle_group: "Beine", equipment: "Maschine", notes: "Hüfte fixiert lassen. Kontrollierte Exzentrik." },
  { id: "ex-hyperextension", name: "Rückenstrecker (Hyperextension)", muscle_group: "Rücken", equipment: "Körpergewicht", notes: "Polster unter Hüfthöhe, Füße gerade, Knie gebeugt – gedanklich Leg Curl ausführen. Keine Überstreckung." },
  { id: "ex-beinpresse", name: "Beinpresse", muscle_group: "Beine", equipment: "Maschine", notes: "Füße schulterbreit, Knie nicht vollständig strecken. 1s Pause im Stretch." },
  { id: "ex-trizeps-kabel", name: "Trizepsdrücken Kabel", muscle_group: "Trizeps", equipment: "Kabelzug", notes: "Oberarm parallel zum Kabel. Ellbogen fixiert, vollständige Streckung am Ende." },
  // New
  { id: "ex-carter-fly", name: "Carter Fly", muscle_group: "Brust", equipment: "Kurzhantel", notes: "Flacher Bankwinkel, Fly-Bewegung mit leichter Ellbogenbeugung. Stretch in der unteren Position betonen." },
  { id: "ex-chest-fly-maschine", name: "Chest Fly Maschine", muscle_group: "Brust", equipment: "Maschine", notes: "Weite Bewegungsbahn, Spannung in der Kontraktion halten." },
  { id: "ex-flat-chest-press", name: "Flat Chest Press", muscle_group: "Brust", equipment: "Maschine", notes: "Ellbogen nah am Körper führen." },
  { id: "ex-incline-chest-press", name: "Incline Chest Press", muscle_group: "Brust", equipment: "Maschine", notes: "Ellbogen nah am Körper führen." },
  { id: "ex-seitheben-maschine", name: "Seitheben Maschine", muscle_group: "Schultern", equipment: "Maschine", notes: "Griffe nehmen, Arme gestreckt – gedanklich Fäuste in die Wand drücken." },
  { id: "ex-schulterdruecken-smith", name: "Schulterdrücken Smith", muscle_group: "Schultern", equipment: "Smith-Maschine", notes: "Nicht unter Kinnhöhe absenken. Ellbogen weit nach außen, breiter Griff." },
  { id: "ex-schulterdruecken-maschine", name: "Schulterdrücken Maschine", muscle_group: "Schultern", equipment: "Maschine", notes: "Nicht unter Kinnhöhe absenken. Ellbogen weit nach außen, breiter Griff." },
  { id: "ex-overhead-extension", name: "Overhead Extension", muscle_group: "Trizeps", equipment: "Kabelzug", notes: "Ellbogen zeigen zur Decke, kontrollierte Bewegung. Vollstreckung am Ende." },
  { id: "ex-leg-extension", name: "Leg Extension", muscle_group: "Beine", equipment: "Maschine", notes: "Kniegelenk auf Drehgelenk ausrichten, Sitz nach hinten stellen." },
  { id: "ex-standing-leg-curl", name: "Standing Leg Curl", muscle_group: "Beine", equipment: "Maschine", notes: "Hüfte stabil halten, kontrollierte Exzentrik." },
  { id: "ex-sissy-leg-press", name: "Sissy Leg Press", muscle_group: "Beine", equipment: "Maschine", notes: "1s Pause im Stretch für maximale Quadrizeps-Aktivierung." },
  { id: "ex-smith-squats", name: "Smith Squats", muscle_group: "Beine", equipment: "Smith-Maschine", notes: "Füße leicht vor die Hüfte, kontrolliert absenken, Rumpfspannung halten." },
  { id: "ex-adduktoren", name: "Adduktoren Maschine", muscle_group: "Adduktoren", equipment: "Maschine", notes: "Blick nach vorne oben, Beine austrecken, Druck nur vom Knie aus." },
  { id: "ex-wadenheben-beinpresse", name: "Wadenheben Beinpresse", muscle_group: "Waden", equipment: "Maschine", notes: "Pause im Stretch, nur bis zur Hälfte hoch drücken." },
  { id: "ex-preacher-curl", name: "Preacher Curl", muscle_group: "Bizeps", equipment: "Maschine", notes: "Handgelenk, Ellbogen und Schultergelenk in 1 Linie." },
  { id: "ex-cable-hammer-curl", name: "Cable Hammer Curl", muscle_group: "Bizeps", equipment: "Kabelzug", notes: "Neutraler Griff, Ellbogen am Körper fixiert." },
  { id: "ex-lat-pulldown-breit", name: "Lat Pulldown breit", muscle_group: "Rücken", equipment: "Kabelzug", notes: "Ellbogen gedanklich zur Hüfte ziehen." },
  { id: "ex-high-row", name: "High Row", muscle_group: "Rücken", equipment: "Maschine", notes: "Oberarm 90° zum Oberkörper, Brust stolz rausstrecken." },
  { id: "ex-low-row-shrugs", name: "Low Row Shrugs", muscle_group: "Rücken", equipment: "Kabelzug", notes: "1s Pause in der Kontraktion." },
  { id: "ex-unilateral-pullover-cable", name: "Unilateral Pullover Cable", muscle_group: "Rücken", equipment: "Kabelzug", notes: "Arm gestreckt halten, Griff fest in der Hand." },
  { id: "ex-cable-crunch", name: "Cable Crunch", muscle_group: "Bauch", equipment: "Kabelzug", notes: "Kniend am Boden, Abstand vom Kabel. Griff an den Kopf, Brustbein zum Schambein ziehen." },
  { id: "ex-reverse-fly-cable", name: "Reverse Fly Cable", muscle_group: "Schultern", equipment: "Kabelzug", notes: "Schulterblätter fixiert, kontrollierte Bewegung." },
  { id: "ex-reverse-fly-pec-deck", name: "Reverse Fly Pec Deck", muscle_group: "Schultern", equipment: "Maschine", notes: "Kopf nach unten, Schulterblätter fixiert." },
];

// ─── Training Plan data ───────────────────────────────────────────────────────

const leoTrainingPlan = {
  id: "tp-leo-001",
  athleteId: "",
  title: "Push · Legs · Pull – Wochentags-Split",
  mode: "weekday",
  coachNote: "",
  createdAt: "2026-06-03T00:00:00.000Z",
  days: [
    {
      id: "leo-td-push",
      dayName: "Montag",
      label: "Push",
      exercises: [
        { id: "leo-push-1", name: "Carter Fly", sets: 2, reps: "9-11", muscleGroup: "Brust", exerciseDbId: "ex-carter-fly", exerciseDbNote: "Flacher Bankwinkel, Fly-Bewegung mit leichter Ellbogenbeugung. Stretch in der unteren Position betonen." },
        { id: "leo-push-2", name: "Seitheben Maschine", sets: 2, reps: "7-9", muscleGroup: "Schultern", exerciseDbId: "ex-seitheben-maschine", exerciseDbNote: "Griffe nehmen, Arme gestreckt – gedanklich Fäuste in die Wand drücken." },
        { id: "leo-push-3", name: "Flat Chest Press", sets: 2, reps: "9-11", muscleGroup: "Brust", exerciseDbId: "ex-flat-chest-press", exerciseDbNote: "Ellbogen nah am Körper führen." },
        { id: "leo-push-4", name: "Schulterdrücken Smith", sets: 1, reps: "5-7", muscleGroup: "Schultern", exerciseDbId: "ex-schulterdruecken-smith", exerciseDbNote: "Nicht unter Kinnhöhe. Ellbogen weit nach außen, breiter Griff." },
        { id: "leo-push-5", name: "Triceps Pushdown", sets: 2, reps: "7-9", muscleGroup: "Trizeps", exerciseDbId: "ex-trizeps-kabel", exerciseDbNote: "Oberarm parallel zum Kabel. Ellbogen fixiert, vollständige Streckung." },
        { id: "leo-push-6", name: "Overhead Extension", sets: 1, reps: "9-11", muscleGroup: "Trizeps", exerciseDbId: "ex-overhead-extension", exerciseDbNote: "Ellbogen zeigen zur Decke, kontrollierte Bewegung." },
      ],
    },
    {
      id: "leo-td-legs",
      dayName: "Dienstag",
      label: "Legs",
      exercises: [
        { id: "leo-legs-1", name: "Lying Leg Curl", sets: 1, reps: "9-11", muscleGroup: "Beine", exerciseDbId: "ex-leg-curl", exerciseDbNote: "Hüfte fixiert lassen. Kontrollierte Exzentrik." },
        { id: "leo-legs-2", name: "Hyperextension", sets: 2, reps: "7-9", muscleGroup: "Rücken", exerciseDbId: "ex-hyperextension", exerciseDbNote: "Polster unter Hüfthöhe, Füße gerade, Knie gebeugt – gedanklich Leg Curl." },
        { id: "leo-legs-3", name: "Leg Extension", sets: 1, reps: "7-9", muscleGroup: "Beine", exerciseDbId: "ex-leg-extension", exerciseDbNote: "Kniegelenk auf Drehgelenk, Sitz nach hinten stellen." },
        { id: "leo-legs-4", name: "Leg Press", sets: 2, reps: "9-11", muscleGroup: "Beine", exerciseDbId: "ex-beinpresse", exerciseDbNote: "Füße schulterbreit. 1s Pause im Stretch." },
        { id: "leo-legs-5", name: "Adduktoren", sets: 1, reps: "7-9", muscleGroup: "Adduktoren", exerciseDbId: "ex-adduktoren", exerciseDbNote: "Blick nach vorne oben, Beine austrecken, Druck nur vom Knie aus." },
        { id: "leo-legs-6", name: "Wadenheben Beinpresse", sets: 2, reps: "5-7", muscleGroup: "Waden", exerciseDbId: "ex-wadenheben-beinpresse", exerciseDbNote: "Pause im Stretch, nur bis Hälfte hoch." },
      ],
    },
    {
      id: "leo-td-pull",
      dayName: "Mittwoch",
      label: "Pull",
      exercises: [
        { id: "leo-pull-1", name: "Preacher Curl", sets: 2, reps: "7-9", muscleGroup: "Bizeps", exerciseDbId: "ex-preacher-curl", exerciseDbNote: "Handgelenk, Ellbogen und Schultergelenk in 1 Linie." },
        { id: "leo-pull-2", name: "Lat Pulldown breit", sets: 2, reps: "7-9", muscleGroup: "Rücken", exerciseDbId: "ex-lat-pulldown-breit", exerciseDbNote: "Ellbogen gedanklich zur Hüfte ziehen." },
        { id: "leo-pull-3", name: "High Row", sets: 2, reps: "7-9", muscleGroup: "Rücken", exerciseDbId: "ex-high-row", exerciseDbNote: "Oberarm 90° zum Oberkörper, Brust stolz." },
        { id: "leo-pull-4", name: "Unilateral Pullover Cable", sets: 2, reps: "7-9", muscleGroup: "Rücken", exerciseDbId: "ex-unilateral-pullover-cable", exerciseDbNote: "Arm gestreckt, Griff in Hand." },
        { id: "leo-pull-5", name: "Hammer Curl KH", sets: 1, reps: "7-9", muscleGroup: "Bizeps", exerciseDbId: "ex-hammercurls", exerciseDbNote: "Neutraler Griff, Ellbogen fixiert." },
        { id: "leo-pull-6", name: "Cable Crunch", sets: 2, reps: "9-11", muscleGroup: "Bauch", exerciseDbId: "ex-cable-crunch", exerciseDbNote: "Kniend am Boden, Griff an Kopf, Brustbein zum Schambein ziehen." },
      ],
    },
    {
      id: "leo-td-rest-thu",
      dayName: "Donnerstag",
      label: "Ruhetag",
      note: "Kein Krafttraining.",
      exercises: [],
    },
    {
      id: "leo-td-pushfb",
      dayName: "Freitag",
      label: "Push (Full Body)",
      exercises: [
        { id: "leo-pfb-1", name: "Chest Fly", sets: 2, reps: "9-11", muscleGroup: "Brust", exerciseDbId: "ex-chest-fly-maschine", exerciseDbNote: "Weite Bewegungsbahn, Spannung in der Kontraktion." },
        { id: "leo-pfb-2", name: "Seitheben Maschine", sets: 2, reps: "9-11", muscleGroup: "Schultern", exerciseDbId: "ex-seitheben-maschine", exerciseDbNote: "Griffe nehmen, Arme gestreckt – gedanklich Fäuste in die Wand drücken." },
        { id: "leo-pfb-3", name: "Incline Chest Press", sets: 2, reps: "9-11", muscleGroup: "Brust", exerciseDbId: "ex-incline-chest-press", exerciseDbNote: "Ellbogen nah am Körper führen." },
        { id: "leo-pfb-4", name: "Triceps Pushdown", sets: 2, reps: "7-9", muscleGroup: "Trizeps", exerciseDbId: "ex-trizeps-kabel", exerciseDbNote: "Oberarm parallel zum Kabel. Ellbogen fixiert." },
        { id: "leo-pfb-5", name: "Leg Extension", sets: 1, reps: "7-9", muscleGroup: "Beine", exerciseDbId: "ex-leg-extension", exerciseDbNote: "Kniegelenk auf Drehgelenk, Sitz nach hinten stellen." },
        { id: "leo-pfb-6", name: "Smith Squats", sets: 1, reps: "9-11", muscleGroup: "Beine", exerciseDbId: "ex-smith-squats", exerciseDbNote: "Füße leicht vor die Hüfte, kontrolliert absenken." },
        { id: "leo-pfb-7", name: "Adduktoren", sets: 1, reps: "7-9", muscleGroup: "Adduktoren", exerciseDbId: "ex-adduktoren", exerciseDbNote: "Blick nach vorne oben, Druck nur vom Knie." },
      ],
    },
    {
      id: "leo-td-pullfb",
      dayName: "Samstag",
      label: "Pull (Full Body)",
      exercises: [
        { id: "leo-rfb-1", name: "Preacher Curl", sets: 2, reps: "9-11", muscleGroup: "Bizeps", exerciseDbId: "ex-preacher-curl", exerciseDbNote: "Handgelenk, Ellbogen und Schultergelenk in 1 Linie." },
        { id: "leo-rfb-2", name: "Lat Pulldown breit", sets: 1, reps: "9-11", muscleGroup: "Rücken", exerciseDbId: "ex-lat-pulldown-breit", exerciseDbNote: "Ellbogen gedanklich zur Hüfte ziehen." },
        { id: "leo-rfb-3", name: "Low Row Shrugs", sets: 2, reps: "7-9", muscleGroup: "Rücken", exerciseDbId: "ex-low-row-shrugs", exerciseDbNote: "1s Pause in der Kontraktion." },
        { id: "leo-rfb-4", name: "Unilateral Pullover Cable", sets: 2, reps: "9-11", muscleGroup: "Rücken", exerciseDbId: "ex-unilateral-pullover-cable", exerciseDbNote: "Arm gestreckt, Griff in Hand." },
        { id: "leo-rfb-5", name: "Cable Hammer Curl", sets: 1, reps: "7-9", muscleGroup: "Bizeps", exerciseDbId: "ex-cable-hammer-curl", exerciseDbNote: "Neutraler Griff, Ellbogen am Körper fixiert." },
        { id: "leo-rfb-6", name: "Lying Leg Curl", sets: 1, reps: "9-11", muscleGroup: "Beine", exerciseDbId: "ex-leg-curl", exerciseDbNote: "Hüfte fixiert lassen. Kontrollierte Exzentrik." },
        { id: "leo-rfb-7", name: "Hyperextension", sets: 1, reps: "7-9", muscleGroup: "Rücken", exerciseDbId: "ex-hyperextension", exerciseDbNote: "Polster unter Hüfthöhe, Knie gebeugt – gedanklich Leg Curl." },
        { id: "leo-rfb-8", name: "Cable Crunch", sets: 2, reps: "9-11", muscleGroup: "Bauch", exerciseDbId: "ex-cable-crunch", exerciseDbNote: "Kniend am Boden, Griff an Kopf, Brustbein zum Schambein." },
      ],
    },
    {
      id: "leo-td-rest-sun",
      dayName: "Sonntag",
      label: "Ruhetag",
      note: "Vollständige Erholung.",
      exercises: [],
    },
  ],
};

const benjaminTrainingPlan = {
  id: "tp-benjamin-001",
  athleteId: "",
  title: "Push · Legs · Pull – Wochentags-Split",
  mode: "weekday",
  coachNote: "",
  createdAt: "2026-06-03T00:00:00.000Z",
  days: [
    {
      id: "ben-td-push",
      dayName: "Montag",
      label: "Push",
      exercises: [
        { id: "ben-push-1", name: "Chest Fly", sets: 2, reps: "7-9", muscleGroup: "Brust", exerciseDbId: "ex-chest-fly-maschine", exerciseDbNote: "Weite Bewegungsbahn, Spannung in der Kontraktion." },
        { id: "ben-push-2", name: "Seitheben Maschine", sets: 2, reps: "7-9", muscleGroup: "Schultern", exerciseDbId: "ex-seitheben-maschine", exerciseDbNote: "Griffe nehmen, Arme gestreckt – gedanklich Fäuste in die Wand drücken." },
        { id: "ben-push-3", name: "Schulterdrücken Smith", sets: 1, reps: "7-9", muscleGroup: "Schultern", exerciseDbId: "ex-schulterdruecken-smith", exerciseDbNote: "Nicht unter Kinnhöhe. Ellbogen weit nach außen, breiter Griff." },
        { id: "ben-push-4", name: "Incline Chest Press", sets: 2, reps: "7-9", muscleGroup: "Brust", exerciseDbId: "ex-incline-chest-press", exerciseDbNote: "Ellbogen nah am Körper führen." },
        { id: "ben-push-5", name: "Triceps Pushdown", sets: 2, reps: "7-9", muscleGroup: "Trizeps", exerciseDbId: "ex-trizeps-kabel", exerciseDbNote: "Oberarm parallel zum Kabel. Ellbogen fixiert, vollständige Streckung." },
        { id: "ben-push-6", name: "Overhead Extension", sets: 1, reps: "9-11", muscleGroup: "Trizeps", exerciseDbId: "ex-overhead-extension", exerciseDbNote: "Ellbogen zeigen zur Decke, kontrollierte Bewegung." },
      ],
    },
    {
      id: "ben-td-legs",
      dayName: "Dienstag",
      label: "Legs",
      exercises: [
        { id: "ben-legs-1", name: "Standing Leg Curl", sets: 2, reps: "7-9", muscleGroup: "Beine", exerciseDbId: "ex-standing-leg-curl", exerciseDbNote: "Hüfte stabil halten, kontrollierte Exzentrik." },
        { id: "ben-legs-2", name: "Hyperextension", sets: 2, reps: "7-9", muscleGroup: "Rücken", exerciseDbId: "ex-hyperextension", exerciseDbNote: "Polster unter Hüfthöhe, Füße gerade, Knie gebeugt – gedanklich Leg Curl." },
        { id: "ben-legs-3", name: "Leg Extension", sets: 2, reps: "7-9", muscleGroup: "Beine", exerciseDbId: "ex-leg-extension", exerciseDbNote: "Kniegelenk auf Drehgelenk, Sitz nach hinten stellen." },
        { id: "ben-legs-4", name: "Sissy Leg Press", sets: 2, reps: "7-9", muscleGroup: "Beine", exerciseDbId: "ex-sissy-leg-press", exerciseDbNote: "1s Pause im Stretch für maximale Quadrizeps-Aktivierung." },
        { id: "ben-legs-5", name: "Adduktoren", sets: 2, reps: "7-9", muscleGroup: "Adduktoren", exerciseDbId: "ex-adduktoren", exerciseDbNote: "Blick nach vorne oben, Beine austrecken, Druck nur vom Knie aus." },
        { id: "ben-legs-6", name: "Wadenheben Beinpresse", sets: 2, reps: "5-7", muscleGroup: "Waden", exerciseDbId: "ex-wadenheben-beinpresse", exerciseDbNote: "Pause im Stretch, nur bis Hälfte hoch." },
      ],
    },
    {
      id: "ben-td-pull",
      dayName: "Mittwoch",
      label: "Pull",
      exercises: [
        { id: "ben-pull-1", name: "Lat Pulldown breit", sets: 2, reps: "7-9", muscleGroup: "Rücken", exerciseDbId: "ex-lat-pulldown-breit", exerciseDbNote: "Ellbogen gedanklich zur Hüfte ziehen." },
        { id: "ben-pull-2", name: "Low Row Shrugs", sets: 2, reps: "7-9", muscleGroup: "Rücken", exerciseDbId: "ex-low-row-shrugs", exerciseDbNote: "1s Pause in der Kontraktion." },
        { id: "ben-pull-3", name: "Unilateral Pullover Cable", sets: 2, reps: "7-9", muscleGroup: "Rücken", exerciseDbId: "ex-unilateral-pullover-cable", exerciseDbNote: "Arm gestreckt, Griff in Hand." },
        { id: "ben-pull-4", name: "Preacher Curl", sets: 2, reps: "7-9", muscleGroup: "Bizeps", exerciseDbId: "ex-preacher-curl", exerciseDbNote: "Handgelenk, Ellbogen und Schultergelenk in 1 Linie." },
        { id: "ben-pull-5", name: "Hammer Curl KH", sets: 1, reps: "7-9", muscleGroup: "Bizeps", exerciseDbId: "ex-hammercurls", exerciseDbNote: "Neutraler Griff, Ellbogen fixiert." },
        { id: "ben-pull-6", name: "Cable Crunch", sets: 2, reps: "9-11", muscleGroup: "Bauch", exerciseDbId: "ex-cable-crunch", exerciseDbNote: "Kniend am Boden, Griff an Kopf, Brustbein zum Schambein ziehen." },
        { id: "ben-pull-7", name: "Reverse Fly Cable", sets: 1, reps: "9-11", muscleGroup: "Schultern", exerciseDbId: "ex-reverse-fly-cable", exerciseDbNote: "Schulterblätter fixiert, kontrollierte Bewegung." },
      ],
    },
    {
      id: "ben-td-rest-thu",
      dayName: "Donnerstag",
      label: "Ruhetag",
      note: "Kein Krafttraining.",
      exercises: [],
    },
    {
      id: "ben-td-pushfb",
      dayName: "Freitag",
      label: "Push (Full Body)",
      exercises: [
        { id: "ben-pfb-1", name: "Chest Fly", sets: 1, reps: "7-9", muscleGroup: "Brust", exerciseDbId: "ex-chest-fly-maschine", exerciseDbNote: "Weite Bewegungsbahn, Spannung in der Kontraktion." },
        { id: "ben-pfb-2", name: "Seitheben Maschine", sets: 2, reps: "7-9", muscleGroup: "Schultern", exerciseDbId: "ex-seitheben-maschine", exerciseDbNote: "Griffe nehmen, Arme gestreckt – gedanklich Fäuste in die Wand drücken." },
        { id: "ben-pfb-3", name: "Incline Chest Press", sets: 2, reps: "7-9", muscleGroup: "Brust", exerciseDbId: "ex-incline-chest-press", exerciseDbNote: "Ellbogen nah am Körper führen." },
        { id: "ben-pfb-4", name: "Triceps Pushdown", sets: 2, reps: "7-9", muscleGroup: "Trizeps", exerciseDbId: "ex-trizeps-kabel", exerciseDbNote: "Oberarm parallel zum Kabel. Ellbogen fixiert." },
        { id: "ben-pfb-5", name: "Leg Extension", sets: 2, reps: "7-9", muscleGroup: "Beine", exerciseDbId: "ex-leg-extension", exerciseDbNote: "Kniegelenk auf Drehgelenk, Sitz nach hinten stellen." },
        { id: "ben-pfb-6", name: "Smith Squats", sets: 2, reps: "7-9", muscleGroup: "Beine", exerciseDbId: "ex-smith-squats", exerciseDbNote: "Füße leicht vor die Hüfte, kontrolliert absenken." },
        { id: "ben-pfb-7", name: "Adduktoren", sets: 1, reps: "7-9", muscleGroup: "Adduktoren", exerciseDbId: "ex-adduktoren", exerciseDbNote: "Blick nach vorne oben, Druck nur vom Knie." },
      ],
    },
    {
      id: "ben-td-pullfb",
      dayName: "Samstag",
      label: "Pull (Full Body)",
      exercises: [
        { id: "ben-rfb-1", name: "Lat Pulldown breit", sets: 1, reps: "7-9", muscleGroup: "Rücken", exerciseDbId: "ex-lat-pulldown-breit", exerciseDbNote: "Ellbogen gedanklich zur Hüfte ziehen." },
        { id: "ben-rfb-2", name: "Low Row Shrugs", sets: 2, reps: "7-9", muscleGroup: "Rücken", exerciseDbId: "ex-low-row-shrugs", exerciseDbNote: "1s Pause in der Kontraktion." },
        { id: "ben-rfb-3", name: "Unilateral Pullover Cable", sets: 1, reps: "7-9", muscleGroup: "Rücken", exerciseDbId: "ex-unilateral-pullover-cable", exerciseDbNote: "Arm gestreckt, Griff in Hand." },
        { id: "ben-rfb-4", name: "Preacher Curl", sets: 2, reps: "7-9", muscleGroup: "Bizeps", exerciseDbId: "ex-preacher-curl", exerciseDbNote: "Handgelenk, Ellbogen und Schultergelenk in 1 Linie." },
        { id: "ben-rfb-5", name: "Hammer Curl KH", sets: 1, reps: "7-9", muscleGroup: "Bizeps", exerciseDbId: "ex-hammercurls", exerciseDbNote: "Neutraler Griff, Ellbogen fixiert." },
        { id: "ben-rfb-6", name: "Lying Leg Curl", sets: 1, reps: "7-9", muscleGroup: "Beine", exerciseDbId: "ex-leg-curl", exerciseDbNote: "Hüfte fixiert lassen. Kontrollierte Exzentrik." },
        { id: "ben-rfb-7", name: "Hyperextension", sets: 2, reps: "7-9", muscleGroup: "Rücken", exerciseDbId: "ex-hyperextension", exerciseDbNote: "Polster unter Hüfthöhe, Knie gebeugt – gedanklich Leg Curl." },
        { id: "ben-rfb-8", name: "Cable Crunch", sets: 2, reps: "9-11", muscleGroup: "Bauch", exerciseDbId: "ex-cable-crunch", exerciseDbNote: "Kniend am Boden, Griff an Kopf, Brustbein zum Schambein." },
        { id: "ben-rfb-9", name: "Reverse Fly Cable", sets: 1, reps: "9-11", muscleGroup: "Schultern", exerciseDbId: "ex-reverse-fly-cable", exerciseDbNote: "Schulterblätter fixiert, kontrollierte Bewegung." },
      ],
    },
    {
      id: "ben-td-rest-sun",
      dayName: "Sonntag",
      label: "Ruhetag",
      note: "Vollständige Erholung.",
      exercises: [],
    },
  ],
};

// Paul: flexible (fortlaufend), Push → Pull → Beine → Rest → repeat
// dayName uses "Training A/B/C/D" convention for flexible mode
const paulTrainingPlan = {
  id: "tp-paul-001",
  athleteId: "",
  title: "Push · Pull · Beine – Fortlaufender Zyklus",
  mode: "flexible",
  coachNote: "",
  createdAt: "2026-06-03T00:00:00.000Z",
  days: [
    {
      id: "paul-td-push",
      dayName: "Training A",
      label: "Push",
      exercises: [
        { id: "paul-push-1", name: "Chest Fly", sets: 1, reps: "9-11", muscleGroup: "Brust", exerciseDbId: "ex-chest-fly-maschine", exerciseDbNote: "Weite Bewegungsbahn, Spannung in der Kontraktion." },
        { id: "paul-push-2", name: "Seitheben Maschine", sets: 2, reps: "9-11", muscleGroup: "Schultern", exerciseDbId: "ex-seitheben-maschine", exerciseDbNote: "Griffe nehmen, Arme gestreckt – gedanklich Fäuste in die Wand drücken." },
        { id: "paul-push-3", name: "Schulterdrücken Maschine", sets: 1, reps: "7-9", muscleGroup: "Schultern", exerciseDbId: "ex-schulterdruecken-maschine", exerciseDbNote: "Nicht unter Kinnhöhe. Ellbogen weit nach außen, breiter Griff." },
        { id: "paul-push-4", name: "Incline Chest Press", sets: 2, reps: "7-9", muscleGroup: "Brust", exerciseDbId: "ex-incline-chest-press", exerciseDbNote: "Ellbogen nah am Körper führen." },
        { id: "paul-push-5", name: "Triceps Pushdown", sets: 2, reps: "9-11", muscleGroup: "Trizeps", exerciseDbId: "ex-trizeps-kabel", exerciseDbNote: "Oberarm parallel zum Kabel. Ellbogen fixiert, vollständige Streckung." },
        { id: "paul-push-6", name: "Overhead Extension", sets: 1, reps: "9-11", muscleGroup: "Trizeps", exerciseDbId: "ex-overhead-extension", exerciseDbNote: "Ellbogen zeigen zur Decke, kontrollierte Bewegung." },
        { id: "paul-push-7", name: "Cable Crunch", sets: 2, reps: "9-11", muscleGroup: "Bauch", exerciseDbId: "ex-cable-crunch", exerciseDbNote: "Kniend am Boden, Griff an Kopf, Brustbein zum Schambein ziehen." },
      ],
    },
    {
      id: "paul-td-pull",
      dayName: "Training B",
      label: "Pull",
      note: "A/B-Rotation: High Row (A) und Low Row Shrugs (B) pro Session abwechseln.",
      exercises: [
        { id: "paul-pull-1", name: "Lat Pulldown breit", sets: 2, reps: "9-11", muscleGroup: "Rücken", exerciseDbId: "ex-lat-pulldown-breit", exerciseDbNote: "Ellbogen gedanklich zur Hüfte ziehen." },
        { id: "paul-pull-2a", name: "High Row (A)", sets: 2, reps: "9-11", muscleGroup: "Rücken", exerciseDbId: "ex-high-row", exerciseDbNote: "Oberarm 90° zum Oberkörper, Brust stolz.", note: "Session A" },
        { id: "paul-pull-2b", name: "Low Row Shrugs (B)", sets: 2, reps: "9-11", muscleGroup: "Rücken", exerciseDbId: "ex-low-row-shrugs", exerciseDbNote: "1s Pause in der Kontraktion.", note: "Session B" },
        { id: "paul-pull-3", name: "Unilateral Pullover Cable", sets: 2, reps: "9-11", muscleGroup: "Rücken", exerciseDbId: "ex-unilateral-pullover-cable", exerciseDbNote: "Arm gestreckt, Griff in Hand." },
        { id: "paul-pull-4", name: "Preacher Curl", sets: 2, reps: "9-11", muscleGroup: "Bizeps", exerciseDbId: "ex-preacher-curl", exerciseDbNote: "Handgelenk, Ellbogen und Schultergelenk in 1 Linie." },
        { id: "paul-pull-5", name: "Hammer Curl KH", sets: 2, reps: "9-11", muscleGroup: "Bizeps", exerciseDbId: "ex-hammercurls", exerciseDbNote: "Neutraler Griff, Ellbogen fixiert." },
        { id: "paul-pull-6", name: "Reverse Fly Pec Deck", sets: 1, reps: "9-11", muscleGroup: "Schultern", exerciseDbId: "ex-reverse-fly-pec-deck", exerciseDbNote: "Kopf nach unten, Schulterblätter fixiert." },
      ],
    },
    {
      id: "paul-td-beine",
      dayName: "Training C",
      label: "Beine",
      note: "A/B-Rotation: Smith Squats (A) und Beinpresse (B) pro Session abwechseln.",
      exercises: [
        { id: "paul-beine-1", name: "Lying Leg Curl", sets: 2, reps: "9-11", muscleGroup: "Beine", exerciseDbId: "ex-leg-curl", exerciseDbNote: "Hüfte fixiert lassen. Kontrollierte Exzentrik." },
        { id: "paul-beine-2", name: "Hyperextension", sets: 2, reps: "9-11", muscleGroup: "Rücken", exerciseDbId: "ex-hyperextension", exerciseDbNote: "Polster unter Hüfthöhe, Knie gebeugt – gedanklich Leg Curl." },
        { id: "paul-beine-3", name: "Leg Extension", sets: 2, reps: "9-11", muscleGroup: "Beine", exerciseDbId: "ex-leg-extension", exerciseDbNote: "Kniegelenk auf Drehgelenk, Sitz nach hinten stellen." },
        { id: "paul-beine-4a", name: "Smith Squats (A)", sets: 2, reps: "9-11", muscleGroup: "Beine", exerciseDbId: "ex-smith-squats", exerciseDbNote: "Füße leicht vor die Hüfte, kontrolliert absenken.", note: "Session A" },
        { id: "paul-beine-4b", name: "Leg Press (B)", sets: 2, reps: "9-11", muscleGroup: "Beine", exerciseDbId: "ex-beinpresse", exerciseDbNote: "Füße schulterbreit. 1s Pause im Stretch.", note: "Session B" },
        { id: "paul-beine-5", name: "Adduktoren", sets: 1, reps: "9-11", muscleGroup: "Adduktoren", exerciseDbId: "ex-adduktoren", exerciseDbNote: "Blick nach vorne oben, Beine austrecken, Druck nur vom Knie aus." },
        { id: "paul-beine-6", name: "Wadenheben Beinpresse", sets: 2, reps: "9-11", muscleGroup: "Waden", exerciseDbId: "ex-wadenheben-beinpresse", exerciseDbNote: "Pause im Stretch, nur bis Hälfte hoch." },
      ],
    },
    {
      id: "paul-td-rest",
      dayName: "Training D",
      label: "Ruhetag",
      note: "Vollständige Erholung. Danach beginnt der Zyklus wieder mit Training A.",
      exercises: [],
    },
  ],
};

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST() {
  const now = new Date().toISOString();

  // 1. Upsert all exercises
  const { error: exError } = await supabase
    .from("exercise_db")
    .upsert(
      exercisesToUpsert.map((e) => ({ ...e, updated_at: now })),
      { onConflict: "id" }
    );

  if (exError) {
    return NextResponse.json({ ok: false, step: "exercises", error: exError.message }, { status: 500 });
  }

  // 2. Fetch all athletes to find Leo, Benjamin, Paul
  const { data: athletes, error: athError } = await supabase
    .from("athletes")
    .select("id, name");

  if (athError) {
    return NextResponse.json({ ok: false, step: "fetch_athletes", error: athError.message }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const targets: Record<string, any> = {
    leo: leoTrainingPlan,
    benjamin: benjaminTrainingPlan,
    paul: paulTrainingPlan,
  };

  const results: { name: string; id?: string; found: boolean; updated?: boolean; error?: string }[] = [];

  for (const [key, planTemplate] of Object.entries(targets)) {
    const athlete = athletes?.find((a: { id: string; name: string }) =>
      a.name.toLowerCase().trim().startsWith(key)
    );

    if (!athlete) {
      results.push({ name: key, found: false });
      continue;
    }

    const plan = { ...planTemplate, athleteId: athlete.id };

    const { error: updateError } = await supabase
      .from("athletes")
      .update({ training_plan: plan, updated_at: now })
      .eq("id", athlete.id);

    results.push({
      name: athlete.name,
      id: athlete.id,
      found: true,
      updated: !updateError,
      error: updateError?.message,
    });
  }

  return NextResponse.json({
    ok: true,
    exercises_upserted: exercisesToUpsert.length,
    athletes: results,
  });
}
