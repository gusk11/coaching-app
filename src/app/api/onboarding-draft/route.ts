import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";

// Public — no athlete session exists yet during onboarding
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.code || typeof body.step !== "number") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("onboarding_codes")
    .update({ current_step: body.step, draft: body.draft ?? null })
    .ilike("code", String(body.code).trim());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
