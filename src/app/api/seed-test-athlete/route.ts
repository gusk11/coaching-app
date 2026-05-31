import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { testAthlete, TEST_ATHLETE_ID } from "@/data/testAthlete";
import { Athlete, LegalConsent, AthleteProfile } from "@/types";

function athleteToRow(a: Athlete): Record<string, unknown> {
  const profileWithLegal = a.legalConsent
    ? { ...(a.profile ?? {}), __lc: a.legalConsent }
    : (a.profile ?? null);
  return {
    id: a.id,
    name: a.name,
    email: a.email ?? null,
    pin: a.pin,
    avatar_initials: a.avatarInitials ?? null,
    onboarding_completed: a.onboardingCompleted ?? false,
    profile: profileWithLegal,
    profile_image: a.profileImage ?? null,
    start_weight: a.startWeight ?? null,
    current_weight: a.currentWeight ?? null,
    target_weight: a.targetWeight ?? null,
    goal_type: a.goalType ?? null,
    goal_text: a.goalText ?? null,
    check_in_day: a.checkInDay ?? 1,
    height: a.height ?? null,
    start_date: a.startDate ?? null,
    competition_date: a.competitionDate ?? null,
    experience_level: a.experienceLevel ?? null,
    training_history: a.trainingHistory ?? null,
    injuries: a.injuries ?? null,
    special_notes: a.specialNotes ?? null,
    tracking_device: a.trackingDevice ?? null,
    tracking_device_custom: a.trackingDeviceCustom ?? null,
    daily_check_config: a.dailyCheckConfig ?? null,
    coach_note: a.coachNote ?? "",
    visible_note: a.visibleNote ?? "",
    daily_check_ins: a.dailyCheckIns ?? [],
    weekly_check_ins: a.weeklyCheckIns ?? [],
    weekly_adjustments: a.weeklyAdjustments ?? [],
    training_logs: a.trainingLogs ?? [],
    calorie_tracker_days: a.calorieTrackerDays ?? [],
    meal_plans: a.mealPlans ?? [],
    training_plan: a.trainingPlan ?? null,
    supplement_plan: a.supplementPlan ?? null,
    notes: a.notes ?? [],
    joined_at: a.joinedAt ?? null,
    weekly_trend_target_percent: a.weeklyTrendTargetPercent ?? null,
  };
}

export async function POST() {
  const row = athleteToRow(testAthlete);
  row.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("athletes")
    .upsert(row, { onConflict: "id" });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: TEST_ATHLETE_ID, message: "Test-Athlet erfolgreich eingefügt/aktualisiert." });
}

export async function DELETE() {
  const { error } = await supabase
    .from("athletes")
    .delete()
    .eq("id", TEST_ATHLETE_ID);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Test-Athlet gelöscht." });
}
