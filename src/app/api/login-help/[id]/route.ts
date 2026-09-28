import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { getRequestAuth, FORBIDDEN } from "@/lib/route-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { isCoach } = await getRequestAuth(req);
  if (!isCoach) return FORBIDDEN();

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("login_help_requests")
    .update({ status: "resolved" })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = await supabase
    .from("login_help_requests")
    .select("*")
    .order("requested_at", { ascending: false });
  return NextResponse.json(data ?? []);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { isCoach } = await getRequestAuth(req);
  if (!isCoach) return FORBIDDEN();

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("login_help_requests").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = await supabase
    .from("login_help_requests")
    .select("*")
    .order("requested_at", { ascending: false });
  return NextResponse.json(data ?? []);
}
