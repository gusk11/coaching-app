import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { getRequestAuth, UNAUTHORIZED, FORBIDDEN } from "@/lib/route-auth";

export async function GET(req: NextRequest) {
  const { isCoach, athleteId } = await getRequestAuth(req);
  if (!isCoach && !athleteId) return UNAUTHORIZED();

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.from("deactivated_foods").select("food_id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((r: { food_id: string }) => r.food_id));
}

export async function POST(req: NextRequest) {
  const { isCoach } = await getRequestAuth(req);
  if (!isCoach) return FORBIDDEN();

  const { foodId } = await req.json();
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("deactivated_foods").insert({ food_id: foodId });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { isCoach } = await getRequestAuth(req);
  if (!isCoach) return FORBIDDEN();

  const { foodId } = await req.json();
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("deactivated_foods").delete().eq("food_id", foodId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
