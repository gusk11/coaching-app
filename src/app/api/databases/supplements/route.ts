import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { getRequestAuth, UNAUTHORIZED, FORBIDDEN } from "@/lib/route-auth";
import { seedSupplementDB } from "@/data/seedSupplements";

export async function GET(req: NextRequest) {
  const { isCoach, athleteId } = await getRequestAuth(req);
  if (!isCoach && !athleteId) return UNAUTHORIZED();

  const supabase = createSupabaseAdmin();
  let { data, error } = await supabase.from("supplement_db").select("*").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data || data.length === 0) {
    const rows = seedSupplementDB.map((s) => ({
      id: s.id, name: s.name, category: s.category ?? null,
      standard_dosage: s.standardDosage ?? null, timing: s.timing ?? null,
      instructions: s.instructions ?? null, notes: s.notes ?? null, link: s.link ?? null,
    }));
    await supabase.from("supplement_db").insert(rows);
    return NextResponse.json(rows);
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { isCoach } = await getRequestAuth(req);
  if (!isCoach) return FORBIDDEN();

  const body = await req.json();
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("supplement_db").insert({
    id: `supp-${Date.now()}`, name: body.name, category: body.category ?? null,
    standard_dosage: body.standardDosage ?? null, timing: body.timing ?? null,
    instructions: body.instructions ?? null, notes: body.notes ?? null, link: body.link ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = await supabase.from("supplement_db").select("*").order("name");
  return NextResponse.json(data ?? []);
}
