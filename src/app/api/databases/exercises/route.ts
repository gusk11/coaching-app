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
      id: e.id, name: e.name, muscle_group: e.muscleGroup,
      is_time_based: e.isTimeBased ?? false,
      notes: e.notes ?? null,
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
    id: `ex-${Date.now()}`,
    name: body.name,
    muscle_group: body.muscleGroup ?? null,
    is_time_based: body.isTimeBased ?? false,
    notes: body.notes ?? null,
  });
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: `Eine Übung mit dem Namen "${body.name}" existiert bereits.` }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = await supabase.from("exercise_db").select("*").order("name");
  return NextResponse.json(data ?? []);
}
