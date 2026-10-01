import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";

/**
 * POST /api/import-training-plans
 *
 * Body shape:
 * {
 *   "athleteName": "Leo",          // matched case-insensitively against athlete.name
 *   "plan": {
 *     "title": "Push · Pull · Legs",
 *     "mode": "weekday" | "flexible",
 *     "coachNote": "...",           // optional
 *     "days": [{
 *       "dayName": "Montag",
 *       "label": "Push",            // optional
 *       "note": "...",              // optional
 *       "cardioNote": "...",        // optional
 *       "exercises": [{
 *         "name": "Latzug",         // resolved against exercise_db
 *         "sets": 3,
 *         "reps": "8-12",
 *         "rir": 2,                 // optional
 *         "rpe": null,              // optional
 *         "equipmentType": "Kabelzug",
 *         "laterality": "bilateral" | "unilateral",
 *         "note": "...",            // optional per-exercise coach note
 *         "videoUrl": "...",        // optional
 *         "variantLabel": "..."     // optional
 *       }]
 *     }]
 *   }
 * }
 *
 * Returns 400 with { unknownExercises: string[] } if any exercise name cannot be resolved.
 * No partial imports.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { athleteName, plan } = body;

  if (!athleteName || !plan) {
    return NextResponse.json({ error: "athleteName and plan are required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const now = new Date().toISOString();

  // Load exercise_db
  const { data: dbRows, error: dbError } = await supabase.from("exercise_db").select("*");
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  const exerciseDb: Array<{ id: string; name: string; muscle_group: string; is_time_based: boolean; notes: string | null }> = dbRows ?? [];

  function resolveExercise(name: string) {
    const exact = exerciseDb.find((e) => e.name === name);
    if (exact) return exact;
    const ci = exerciseDb.find((e) => e.name.toLowerCase() === name.toLowerCase());
    return ci ?? null;
  }

  // Validate all exercise names first
  const unknownExercises: string[] = [];
  for (const day of plan.days ?? []) {
    for (const ex of day.exercises ?? []) {
      if (!resolveExercise(ex.name)) {
        if (!unknownExercises.includes(ex.name)) unknownExercises.push(ex.name);
      }
    }
  }

  if (unknownExercises.length > 0) {
    return NextResponse.json({ error: "Unbekannte Übungen", unknownExercises }, { status: 400 });
  }

  // Find athlete
  const { data: athletes, error: athError } = await supabase.from("athletes").select("id, name");
  if (athError) return NextResponse.json({ error: athError.message }, { status: 500 });

  const athlete = (athletes ?? []).find(
    (a: { id: string; name: string }) => a.name.toLowerCase().includes(athleteName.toLowerCase())
  );
  if (!athlete) {
    return NextResponse.json({ error: `Athlet "${athleteName}" nicht gefunden` }, { status: 404 });
  }

  // Build plan with resolved exercise data
  const resolvedDays = (plan.days ?? []).map((day: Record<string, unknown>, dIdx: number) => ({
    id: `day-import-${dIdx}-${Date.now()}`,
    dayName: day.dayName,
    label: day.label ?? "",
    note: day.note ?? "",
    cardioNote: day.cardioNote ?? "",
    exercises: ((day.exercises as Record<string, unknown>[]) ?? []).map((ex: Record<string, unknown>, eIdx: number) => {
      const dbItem = resolveExercise(ex.name as string)!;
      return {
        id: `ex-import-${dIdx}-${eIdx}-${Date.now()}`,
        name: ex.name,
        sets: ex.sets ?? 3,
        reps: ex.reps ?? "8-12",
        rir: ex.rir ?? undefined,
        rpe: ex.rpe ?? undefined,
        note: ex.note ?? undefined,
        videoUrl: ex.videoUrl ?? undefined,
        variantLabel: ex.variantLabel ?? undefined,
        equipmentType: ex.equipmentType ?? undefined,
        laterality: ex.laterality ?? "bilateral",
        muscleGroup: dbItem.muscle_group,
        isTimeBased: dbItem.is_time_based,
        exerciseDbNote: dbItem.notes ?? undefined,
        exerciseDbId: dbItem.id,
      };
    }),
  }));

  const resolvedPlan = {
    id: `tp-import-${Date.now()}`,
    athleteId: athlete.id,
    title: plan.title ?? "Importierter Trainingsplan",
    mode: plan.mode ?? "weekday",
    coachNote: plan.coachNote ?? "",
    createdAt: now,
    days: resolvedDays,
  };

  const { error: updateError } = await supabase
    .from("athletes")
    .update({ training_plan: resolvedPlan, updated_at: now })
    .eq("id", athlete.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true, athleteId: athlete.id, athleteName: athlete.name, planId: resolvedPlan.id });
}
