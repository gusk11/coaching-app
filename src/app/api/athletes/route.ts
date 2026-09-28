import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { getRequestAuth, UNAUTHORIZED, FORBIDDEN } from "@/lib/route-auth";
import { athletes as initialAthletes } from "@/data/athletes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function athleteToRow(a: any): Record<string, unknown> {
  const profileWithLegal = {
    ...(a.profile ?? {}),
    ...(a.legalConsent ? { __lc: a.legalConsent } : {}),
    ...(a.introVideoSeen ? { __ivs: true } : {}),
    ...(a.isNewSignup ? { __ns: true } : {}),
  };
  return {
    id: a.id, name: a.name, email: a.email ?? null, pin: a.pin,
    athlete_number: a.athleteNumber ?? null, avatar_initials: a.avatarInitials ?? null,
    onboarding_completed: a.onboardingCompleted ?? false,
    profile: Object.keys(profileWithLegal).length ? profileWithLegal : null,
    profile_image: a.profileImage ?? null,
    start_weight: a.startWeight ?? null, current_weight: a.currentWeight ?? null,
    target_weight: a.targetWeight ?? null, goal_type: a.goalType ?? null,
    goal_text: a.goalText ?? null, check_in_day: a.checkInDay ?? 1,
    start_date: a.startDate ?? null, competition_date: a.competitionDate ?? null,
    ziel_beschreibung: a.zielBeschreibung ?? null, experience_level: a.experienceLevel ?? null,
    training_history: a.trainingHistory ?? null, injuries: a.injuries ?? null,
    special_notes: a.specialNotes ?? null, tracking_device: a.trackingDevice ?? null,
    tracking_device_custom: a.trackingDeviceCustom ?? null,
    street: a.street ?? null, zip_code: a.zipCode ?? null, city: a.city ?? null,
    is_hidden: a.isHidden ?? null, exercise_variants: a.exerciseVariants ?? [],
    daily_check_config: a.dailyCheckConfig ?? null,
    coach_note: a.coachNote ?? "", visible_note: a.visibleNote ?? "",
    daily_check_ins: a.dailyCheckIns ?? [], weekly_check_ins: a.weeklyCheckIns ?? [],
    weekly_adjustments: a.weeklyAdjustments ?? [], training_logs: a.trainingLogs ?? [],
    calorie_tracker_days: a.calorieTrackerDays ?? [], meal_plans: a.mealPlans ?? [],
    training_plan: a.trainingPlan ?? null, supplement_plan: a.supplementPlan ?? null,
    notes: a.notes ?? [], joined_at: a.joinedAt ?? null,
    weekly_trend_target_percent: a.weeklyTrendTargetPercent ?? null,
    plan_bearbeitung_erlaubt: a.planBearbeitungErlaubt ?? false,
    plan_change_requests: a.planChangeRequests ?? [],
  };
}

async function nextAthleteNumber(supabase: ReturnType<typeof createSupabaseAdmin>): Promise<string> {
  const { data } = await supabase.from("athletes").select("athlete_number");
  const max = (data ?? []).reduce((acc: number, row: { athlete_number: string | null }) => {
    const n = parseInt(row.athlete_number ?? "0", 10);
    return isNaN(n) ? acc : Math.max(acc, n);
  }, 0);
  return String(max + 1).padStart(4, "0");
}

export async function GET(req: NextRequest) {
  const { isCoach, athleteId } = await getRequestAuth(req);
  if (!isCoach && !athleteId) return UNAUTHORIZED();

  const supabase = createSupabaseAdmin();

  if (isCoach) {
    let { data, error } = await supabase.from("athletes").select("*").order("name");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) {
      const rows = initialAthletes.map(athleteToRow);
      await supabase.from("athletes").insert(rows);
      return NextResponse.json(rows);
    }
    return NextResponse.json(data);
  }

  // Athlete: return only own row
  const { data, error } = await supabase
    .from("athletes")
    .select("*")
    .eq("id", athleteId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { isCoach } = await getRequestAuth(req);
  if (!isCoach) return FORBIDDEN();

  const supabase = createSupabaseAdmin();
  const body = await req.json();
  const athleteNumber = body.athleteNumber ?? (await nextAthleteNumber(supabase));
  const row = athleteToRow({ ...body, athleteNumber });

  const { error } = await supabase.from("athletes").insert(row);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = await supabase.from("athletes").select("*").order("name");
  return NextResponse.json(data ?? []);
}
