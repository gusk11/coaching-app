import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/coach-auth";
import { verifyAthleteSessionToken, ATHLETE_SESSION_COOKIE } from "@/lib/athlete-auth";

const COACH_PREFIXES = [
  "/coach",
  "/api/seed-test-athlete",
  "/api/import-athlete-data",
  "/api/fix-athlete-plans",
  "/api/import-training-plans",
  "/api/backfill-athlete-numbers",
];

const ATHLETE_PREFIXES = ["/athlete"];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p + "?")
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (matchesPrefix(pathname, COACH_PREFIXES)) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (token && (await verifySessionToken(token))) return NextResponse.next();
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (matchesPrefix(pathname, ATHLETE_PREFIXES)) {
    const token = req.cookies.get(ATHLETE_SESSION_COOKIE)?.value;
    if (token && (await verifyAthleteSessionToken(token))) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/coach/:path*",
    "/athlete/:path*",
    "/api/seed-test-athlete/:path*",
    "/api/import-athlete-data/:path*",
    "/api/fix-athlete-plans/:path*",
    "/api/import-training-plans/:path*",
    "/api/backfill-athlete-numbers/:path*",
  ],
};
