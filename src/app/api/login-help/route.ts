import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { getRequestAuth, FORBIDDEN } from "@/lib/route-auth";

export async function GET(req: NextRequest) {
  const { isCoach } = await getRequestAuth(req);
  if (!isCoach) return FORBIDDEN();

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("login_help_requests")
    .select("*")
    .order("requested_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  // Public — any visitor can submit a help request (athlete forgot their PIN)
  const { enteredName, note } = await req.json().catch(() => ({}));
  if (typeof enteredName !== "string" || !enteredName.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("login_help_requests").insert({
    id: `lhr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    entered_name: enteredName.trim(),
    note: typeof note === "string" ? note.trim() || null : null,
    status: "open",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
