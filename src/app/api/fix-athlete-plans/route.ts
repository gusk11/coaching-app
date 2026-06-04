/**
 * POST /api/fix-athlete-plans
 * 1. Reverts Leo Schröder: removes f-plans, restores his leo training plan, clears f-supplement plan
 * 2. Applies all f-plans to Gustav Kaufmann
 */
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Leo's original training plan (restored from import-training-plans)
const leoTrainingPlan = {
  id: "tp-leo-001",
  title: "Push · Legs · Pull – Wochentags-Split",
  mode: "weekday",
  coachNote: "",
  createdAt: "2026-06-03T00:00:00.000Z",
  days: [
    {
      id: "leo-td-push", dayName: "Montag", label: "Push",
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
      id: "leo-td-legs", dayName: "Dienstag", label: "Legs",
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
      id: "leo-td-pull", dayName: "Mittwoch", label: "Pull",
      exercises: [
        { id: "leo-pull-1", name: "Preacher Curl", sets: 2, reps: "7-9", muscleGroup: "Bizeps", exerciseDbId: "ex-preacher-curl", exerciseDbNote: "Handgelenk, Ellbogen und Schultergelenk in 1 Linie." },
        { id: "leo-pull-2", name: "Lat Pulldown breit", sets: 2, reps: "7-9", muscleGroup: "Rücken", exerciseDbId: "ex-lat-pulldown-breit", exerciseDbNote: "Ellbogen gedanklich zur Hüfte ziehen." },
        { id: "leo-pull-3", name: "High Row", sets: 2, reps: "7-9", muscleGroup: "Rücken", exerciseDbId: "ex-high-row", exerciseDbNote: "Oberarm 90° zum Oberkörper, Brust stolz." },
        { id: "leo-pull-4", name: "Unilateral Pullover Cable", sets: 2, reps: "7-9", muscleGroup: "Rücken", exerciseDbId: "ex-unilateral-pullover-cable", exerciseDbNote: "Arm gestreckt, Griff in Hand." },
        { id: "leo-pull-5", name: "Hammer Curl KH", sets: 1, reps: "7-9", muscleGroup: "Bizeps", exerciseDbId: "ex-hammercurls", exerciseDbNote: "Neutraler Griff, Ellbogen fixiert." },
        { id: "leo-pull-6", name: "Cable Crunch", sets: 2, reps: "9-11", muscleGroup: "Bauch", exerciseDbId: "ex-cable-crunch", exerciseDbNote: "Kniend am Boden, Griff an Kopf, Brustbein zum Schambein ziehen." },
      ],
    },
    { id: "leo-td-rest-thu", dayName: "Donnerstag", label: "Ruhetag", note: "Kein Krafttraining.", exercises: [] },
    {
      id: "leo-td-pushfb", dayName: "Freitag", label: "Push (Full Body)",
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
      id: "leo-td-pullfb", dayName: "Samstag", label: "Pull (Full Body)",
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
    { id: "leo-td-rest-sun", dayName: "Sonntag", label: "Ruhetag", note: "Vollständige Erholung.", exercises: [] },
  ],
};

const F_MEAL_IDS = new Set(["mp-f-training-001", "mp-f-rest-001"]);
const F_TRAINING_ID = "tp-f-001";
const F_SUPPLEMENT_ID = "sp-f-001";

export async function POST() {
  const now = new Date().toISOString();

  // ── 1. Fetch all athletes ──────────────────────────────────────────────────
  const { data: athletes, error: athErr } = await supabase
    .from("athletes")
    .select("id, name, meal_plans, training_plan, supplement_plan");
  if (athErr) return NextResponse.json({ ok: false, step: "fetch", error: athErr.message }, { status: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leo = athletes?.find((a: any) => a.name.toLowerCase().startsWith("leo"));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gustav = athletes?.find((a: any) => a.name.toLowerCase().startsWith("gustav"));

  if (!leo) return NextResponse.json({ ok: false, step: "find_leo", error: "Leo nicht gefunden" }, { status: 404 });
  if (!gustav) return NextResponse.json({ ok: false, step: "find_gustav", error: "Gustav nicht gefunden", available: athletes?.map((a: any) => a.name) }, { status: 404 });

  // ── 2. Revert Leo ─────────────────────────────────────────────────────────
  // Remove f-meal plans, restore his training plan, clear supplement plan
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leoMealPlans = (leo.meal_plans ?? []).filter((p: any) => !F_MEAL_IDS.has(p.id));
  const leoTrainingPlanRestored = leo.training_plan?.id === F_TRAINING_ID
    ? { ...leoTrainingPlan, athleteId: leo.id }
    : leo.training_plan;
  const leoSupplementPlan = leo.supplement_plan?.id === F_SUPPLEMENT_ID ? null : leo.supplement_plan;

  const { error: leoErr } = await supabase
    .from("athletes")
    .update({ meal_plans: leoMealPlans, training_plan: leoTrainingPlanRestored, supplement_plan: leoSupplementPlan, updated_at: now })
    .eq("id", leo.id);
  if (leoErr) return NextResponse.json({ ok: false, step: "revert_leo", error: leoErr.message }, { status: 500 });

  // ── 3. Apply f-plans to Gustav ────────────────────────────────────────────
  // Import the same plans — call import-athlete-data logic inline via fetch
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const importRes = await fetch(`${base}/api/import-athlete-data?athlete=gustav`, { method: "POST" });
  const importJson = await importRes.json();

  if (!importJson.ok) {
    return NextResponse.json({ ok: false, step: "apply_gustav", error: importJson.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    leo_reverted: { id: leo.id, name: leo.name, meal_plans_kept: leoMealPlans.length },
    gustav_updated: importJson,
  });
}
