import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { createAthleteSessionToken, ATHLETE_SESSION_COOKIE } from "@/lib/athlete-auth";
import { hashPin } from "@/lib/pin-hash";

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

async function nextAthleteNumber(supabase: ReturnType<typeof createSupabaseAdmin>): Promise<string> {
  const { data } = await supabase.from("athletes").select("athlete_number");
  const max = (data ?? []).reduce((acc, row) => {
    const n = parseInt(row.athlete_number ?? "0", 10);
    return isNaN(n) ? acc : Math.max(acc, n);
  }, 0);
  return String(max + 1).padStart(4, "0");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const supabase = createSupabaseAdmin();

  // Check for duplicate email
  const email = body.email?.toLowerCase().trim();
  if (email) {
    const { data: existing } = await supabase
      .from("athletes")
      .select("id")
      .ilike("email", email);
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "E-Mail-Adresse bereits registriert." }, { status: 409 });
    }
  }

  const athleteNumber = await nextAthleteNumber(supabase);
  const hashedPin = await hashPin(body.pin);
  const today = new Date().toISOString().split("T")[0];
  const id = `athlete-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const profileWithLegal = {
    ...(body.profile ?? {}),
    personal: { email: email || undefined, birthDate: body.birthDate || undefined },
    ...(body.legalConsent ? { __lc: body.legalConsent } : {}),
    __ns: true,
  };

  const row = {
    id,
    name: body.name.trim(),
    email: email || null,
    pin: hashedPin,
    athlete_number: athleteNumber,
    avatar_initials: getInitials(body.name),
    onboarding_completed: true,
    profile: profileWithLegal,
    start_weight: body.currentWeight ?? 0,
    current_weight: body.currentWeight ?? 0,
    target_weight: body.targetWeight ?? body.currentWeight ?? 0,
    goal_type: body.goalType ?? "maintenance",
    goal_text: body.goalText ?? null,
    check_in_day: body.checkInDay ?? 1,
    start_date: today,
    experience_level: body.experienceLevel ?? null,
    injuries: body.injuries ?? null,
    training_history: body.trainingHistory ?? null,
    street: body.street ?? null,
    zip_code: body.zipCode ?? null,
    city: body.city ?? null,
    daily_check_config: body.dailyCheckConfig ?? null,
    coach_note: "",
    visible_note: "",
    daily_check_ins: [],
    weekly_check_ins: [],
    weekly_adjustments: [],
    training_logs: [],
    calorie_tracker_days: [],
    meal_plans: [],
    notes: [],
    joined_at: today,
    plan_bearbeitung_erlaubt: false,
    plan_change_requests: [],
    exercise_variants: [],
  };

  const { error } = await supabase.from("athletes").insert(row);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Remove the onboarding code now that registration is complete
  if (body.code && typeof body.code === "string") {
    await supabase.from("onboarding_codes").delete().ilike("code", body.code.trim());
  }

  const token = await createAthleteSessionToken(id);
  const res = NextResponse.json({ ok: true, athleteId: id });
  res.cookies.set(ATHLETE_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  return res;
}
