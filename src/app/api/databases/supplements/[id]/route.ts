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

  const body = await req.json();
  const supabase = createSupabaseAdmin();
  const row: Record<string, unknown> = {};
  if ("name" in body) row.name = body.name;
  if ("category" in body) row.category = body.category ?? null;
  if ("standardDosage" in body) row.standard_dosage = body.standardDosage ?? null;
  if ("timing" in body) row.timing = body.timing ?? null;
  if ("instructions" in body) row.instructions = body.instructions ?? null;
  if ("notes" in body) row.notes = body.notes ?? null;
  if ("link" in body) row.link = body.link ?? null;
  row.updated_at = new Date().toISOString();

  const { error } = await supabase.from("supplement_db").update(row).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = await supabase.from("supplement_db").select("*").order("name");
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
  const { error } = await supabase.from("supplement_db").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = await supabase.from("supplement_db").select("*").order("name");
  return NextResponse.json(data ?? []);
}
