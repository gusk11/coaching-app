import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { getRequestAuth, FORBIDDEN } from "@/lib/route-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { isCoach } = await getRequestAuth(req);
  if (!isCoach) return FORBIDDEN();

  const body = await req.json();
  const supabase = createSupabaseAdmin();
  const row: Record<string, unknown> = {};
  if ("name" in body) row.name = body.name;
  if ("muscleGroup" in body) row.muscle_group = body.muscleGroup ?? null;
  if ("isTimeBased" in body) row.is_time_based = body.isTimeBased ?? false;
  if ("notes" in body) row.notes = body.notes ?? null;
  row.updated_at = new Date().toISOString();

  const { error } = await supabase.from("exercise_db").update(row).eq("id", id);
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: `Eine Übung mit diesem Namen existiert bereits.` }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = await supabase.from("exercise_db").select("*").order("name");
  return NextResponse.json(data ?? []);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { isCoach } = await getRequestAuth(req);
  if (!isCoach) return FORBIDDEN();

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("exercise_db").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = await supabase.from("exercise_db").select("*").order("name");
  return NextResponse.json(data ?? []);
}
