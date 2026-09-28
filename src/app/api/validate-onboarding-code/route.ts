import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  // Public — called during registration flow before athlete session exists
  const { code } = await req.json().catch(() => ({}));
  if (typeof code !== "string" || !code.trim()) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  // Atomically delete the code and return whether it existed (single-use)
  const { data, error } = await supabase
    .from("onboarding_codes")
    .delete()
    .ilike("code", code.trim())
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ valid: data !== null });
}
