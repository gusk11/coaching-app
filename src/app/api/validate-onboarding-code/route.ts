import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  // Public — called during registration flow before athlete session exists
  const { code } = await req.json().catch(() => ({}));
  if (typeof code !== "string" || !code.trim()) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  // SELECT only — code is kept alive until registration completes (enables resume)
  const { data, error } = await supabase
    .from("onboarding_codes")
    .select("id, current_step, draft")
    .ilike("code", code.trim())
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ valid: false });
  return NextResponse.json({
    valid: true,
    currentStep: data.current_step ?? 0,
    draft: data.draft ?? null,
  });
}
