import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { getRequestAuth, UNAUTHORIZED, FORBIDDEN } from "@/lib/route-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { isCoach, athleteId } = await getRequestAuth(req);
  if (!isCoach && !athleteId) return UNAUTHORIZED();

  const body = await req.json();
  const supabase = createSupabaseAdmin();

  // Athletes can only mark own feedbacks as seen
  if (!isCoach) {
    const { data: vf } = await supabase
      .from("video_feedbacks")
      .select("athlete_id")
      .eq("id", id)
      .single();
    if (!vf || vf.athlete_id !== athleteId) return FORBIDDEN();

    const { error } = await supabase
      .from("video_feedbacks")
      .update({ seen_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Coach: full update (seen_at, linked_exercise_ids, linked_weekly_check_in_id, etc.)
  const update: Record<string, unknown> = {};
  if ("seenAt" in body) update.seen_at = body.seenAt;
  if ("linkedExerciseIds" in body) update.linked_exercise_ids = body.linkedExerciseIds;
  if ("linkedWeeklyCheckInId" in body) update.linked_weekly_check_in_id = body.linkedWeeklyCheckInId;

  const { error } = await supabase.from("video_feedbacks").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { isCoach } = await getRequestAuth(req);
  if (!isCoach) return FORBIDDEN();

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("video_feedbacks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = await supabase
    .from("video_feedbacks")
    .select("*")
    .order("created_at", { ascending: false });
  return NextResponse.json(data ?? []);
}
