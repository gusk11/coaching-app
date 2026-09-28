import { NextResponse } from "next/server";
import { ATHLETE_SESSION_COOKIE } from "@/lib/athlete-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ATHLETE_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}
