import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/coach-auth";
import { verifyAthleteSessionToken, ATHLETE_SESSION_COOKIE } from "@/lib/athlete-auth";

export interface RequestAuth {
  isCoach: boolean;
  athleteId: string | null;
}

export async function getRequestAuth(req: NextRequest): Promise<RequestAuth> {
  const coachToken = req.cookies.get(SESSION_COOKIE)?.value;
  const isCoach = coachToken ? await verifySessionToken(coachToken) : false;

  const athleteToken = req.cookies.get(ATHLETE_SESSION_COOKIE)?.value;
  const athleteId = athleteToken ? await verifyAthleteSessionToken(athleteToken) : null;

  return { isCoach, athleteId };
}

export const UNAUTHORIZED = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export const FORBIDDEN = () =>
  NextResponse.json({ error: "Forbidden" }, { status: 403 });
