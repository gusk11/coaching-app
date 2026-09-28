import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { getRequestAuth, FORBIDDEN } from "@/lib/route-auth";

export async function GET() {
  // Public — checked on login page before authentication
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("maintenance_mode")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return NextResponse.json(null);
  return NextResponse.json({
    isActive: data.is_active ?? false,
    startTime: data.start_time ?? "",
    endTime: data.end_time ?? "",
    message: data.message ?? undefined,
  });
}

export async function POST(req: NextRequest) {
  const { isCoach } = await getRequestAuth(req);
  if (!isCoach) return FORBIDDEN();

  const body = await req.json();
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("maintenance_mode").upsert({
    id: 1,
    is_active: body.isActive,
    start_time: body.startTime,
    end_time: body.endTime,
    message: body.message ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
