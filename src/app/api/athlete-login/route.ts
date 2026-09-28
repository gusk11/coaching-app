import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { createAthleteSessionToken, ATHLETE_SESSION_COOKIE } from "@/lib/athlete-auth";
import { verifyPin } from "@/lib/pin-hash";

function normalizeLoginName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "");
}

export async function POST(req: NextRequest) {
  const { nameOrEmail, pin } = await req.json().catch(() => ({}));
  if (typeof nameOrEmail !== "string" || typeof pin !== "string" || !nameOrEmail || !pin) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.from("athletes").select("*");
  if (error) return NextResponse.json({ error: "Internal error" }, { status: 500 });

  const key = nameOrEmail.trim().toLowerCase();
  const keyNorm = normalizeLoginName(nameOrEmail);

  const athlete = (data ?? []).find((row) => {
    const emailMatch = (row.email || row.profile?.personal?.email || "").toLowerCase() === key;
    const nameMatch = normalizeLoginName(row.name) === keyNorm;
    return emailMatch || nameMatch;
  });

  if (!athlete) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const pinValid = await verifyPin(pin, athlete.pin);
  if (!pinValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createAthleteSessionToken(athlete.id);
  const res = NextResponse.json({ ok: true, athleteId: athlete.id });
  res.cookies.set(ATHLETE_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  return res;
}
