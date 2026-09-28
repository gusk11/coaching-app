import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { getRequestAuth, UNAUTHORIZED, FORBIDDEN } from "@/lib/route-auth";
import { seedExerciseDB } from "@/data/seedExercises";

export async function GET(req: NextRequest) {
  const { isCoach, athleteId } = await getRequestAuth(req);
  if (!isCoach && !athleteId) return UNAUTHORIZED();

  const supabase = createSupabaseAdmin();
  let { data, error } = await supabase.from("exercise_db").select("*").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data || data.length === 0) {
    const rows = seedExerciseDB.map((e) => ({
      id: e.id, name: e.name, muscle_group: e.muscleGroup ?? null,
      equipment: e.equipmentType ?? null, laterality: e.laterality ?? "bilateral",
      is_time_based: e.isTimeBased ?? false,
      notes: e.notes ?? null, execution_link: e.executionLink ?? null,
    }));
    await supabase.from("exercise_db").insert(rows);
    return NextResponse.json(rows);
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { isCoach } = await getRequestAuth(req);
  if (!isCoach) return FORBIDDEN();

  const body = await req.json();
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("exercise_db").insert({
    id: `ex-${Date.now()}`, name: body.name, muscle_group: body.muscleGroup ?? null,
    equipment: body.equipmentType ?? null, laterality: body.laterality ?? "bilateral",
    is_time_based: body.isTimeBased ?? false,
    notes: body.notes ?? null, execution_link: body.executionLink ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = await supabase.from("exercise_db").select("*").order("name");
  return NextResponse.json(data ?? []);
}
