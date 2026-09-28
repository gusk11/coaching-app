import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { getRequestAuth, UNAUTHORIZED, FORBIDDEN } from "@/lib/route-auth";

export async function GET(req: NextRequest) {
  const { isCoach, athleteId } = await getRequestAuth(req);
  if (!isCoach && !athleteId) return UNAUTHORIZED();

  const supabase = createSupabaseAdmin();
  const athleteFilter = req.nextUrl.searchParams.get("athleteId");
  const category = req.nextUrl.searchParams.get("category");

  let query = supabase.from("video_feedbacks").select("*").order("created_at", { ascending: false });

  if (isCoach) {
    if (athleteFilter) query = query.eq("athlete_id", athleteFilter);
  } else {
    // Athlete can only see their own feedbacks
    query = query.eq("athlete_id", athleteId);
  }

  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { isCoach } = await getRequestAuth(req);
  if (!isCoach) return FORBIDDEN();

  const body = await req.json();
  const supabase = createSupabaseAdmin();
  const id = `vf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const { error } = await supabase.from("video_feedbacks").insert({
    id,
    athlete_id: body.athleteId,
    title: body.title,
    date: body.date,
    loom_url: body.loomUrl,
    category: body.category,
    linked_exercise_ids: body.linkedExerciseIds ?? null,
    linked_weekly_check_in_id: body.linkedWeeklyCheckInId ?? null,
    created_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = await supabase
    .from("video_feedbacks")
    .select("*")
    .order("created_at", { ascending: false });
  return NextResponse.json(data ?? []);
}
