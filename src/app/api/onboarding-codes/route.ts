import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { getRequestAuth, FORBIDDEN } from "@/lib/route-auth";

export async function GET(req: NextRequest) {
  const { isCoach } = await getRequestAuth(req);
  if (!isCoach) return FORBIDDEN();

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.from("onboarding_codes").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { isCoach } = await getRequestAuth(req);
  if (!isCoach) return FORBIDDEN();

  const { code } = await req.json().catch(() => ({}));
  if (typeof code !== "string" || !code.trim()) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const id = `oc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const createdAt = new Date().toISOString();
  const { error } = await supabase.from("onboarding_codes").insert({ id, code, created_at: createdAt });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id, code, createdAt });
}

export async function DELETE(req: NextRequest) {
  const { isCoach } = await getRequestAuth(req);
  if (!isCoach) return FORBIDDEN();

  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("onboarding_codes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
