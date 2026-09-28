import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { getRequestAuth, UNAUTHORIZED, FORBIDDEN } from "@/lib/route-auth";

// Columns an athlete is allowed to write on their own row.
// Coach can write any column.
const ATHLETE_WRITABLE = new Set([
  "daily_check_ins", "weekly_check_ins", "training_logs", "calorie_tracker_days",
  "profile", "current_weight", "exercise_variants", "plan_change_requests",
  "name", "email", "pin", "avatar_initials", "onboarding_completed",
  "start_weight", "target_weight", "goal_type", "goal_text", "check_in_day",
  "start_date", "competition_date", "ziel_beschreibung", "experience_level",
  "training_history", "injuries", "special_notes", "tracking_device",
  "tracking_device_custom", "street", "zip_code", "city", "updated_at",
  // Plan columns: athlete may write their own if planBearbeitungErlaubt is set
  "training_plan", "training_plans", "supplement_plan", "supplement_plans", "meal_plans",
]);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { isCoach, athleteId } = await getRequestAuth(req);
  if (!isCoach && athleteId !== id) return UNAUTHORIZED();

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.from("athletes").select("*").eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { isCoach, athleteId } = await getRequestAuth(req);
  if (!isCoach && athleteId !== id) return FORBIDDEN();

  const body = await req.json();
  // Accept both { row: {...} } and plain object for flexibility
  const row: Record<string, unknown> = body.row ?? body;

  if (!isCoach) {
    const forbidden = Object.keys(row).filter((c) => !ATHLETE_WRITABLE.has(c));
    if (forbidden.length > 0) {
      return NextResponse.json(
        { error: `Forbidden fields: ${forbidden.join(", ")}` },
        { status: 403 }
      );
    }
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("athletes").update(row).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (isCoach) {
    const { data } = await supabase.from("athletes").select("*").order("name");
    return NextResponse.json(data ?? []);
  }
  const { data } = await supabase.from("athletes").select("*").eq("id", id);
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
  const { error } = await supabase.from("athletes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
