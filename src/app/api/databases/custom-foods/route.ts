import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { getRequestAuth, UNAUTHORIZED, FORBIDDEN } from "@/lib/route-auth";
import { seedCustomFoods } from "@/data/seedCustomFoods";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function foodToRow(f: any): Record<string, unknown> {
  const row: Record<string, unknown> = {
    id: f.id, name: f.name, category: f.category ?? null,
    kcal_per_100g: f.kcalPer100g ?? null, protein_per_100g: f.proteinPer100g ?? null,
    carbs_per_100g: f.carbsPer100g ?? null, fat_per_100g: f.fatPer100g ?? null,
    fiber_per_100g: f.fiberPer100g ?? null, salt_per_100g: f.saltPer100g ?? null,
    default_amount: f.defaultAmount ?? null, default_amount_unit: f.defaultAmountUnit ?? null,
    serving_label: f.servingLabel ?? null, notes: f.notes ?? null,
    is_active: f.isActive ?? true,
  };
  if (f.source !== undefined) row.source = f.source;
  return row;
}

export async function GET(req: NextRequest) {
  const { isCoach, athleteId } = await getRequestAuth(req);
  if (!isCoach && !athleteId) return UNAUTHORIZED();

  const supabase = createSupabaseAdmin();
  let { data, error } = await supabase.from("custom_foods").select("*").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data || data.length === 0) {
    const rows = seedCustomFoods.map(foodToRow);
    await supabase.from("custom_foods").insert(rows);
    return NextResponse.json(rows);
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { isCoach } = await getRequestAuth(req);
  if (!isCoach) return FORBIDDEN();

  const body = await req.json();
  const supabase = createSupabaseAdmin();
  const row = foodToRow({ ...body, id: `cf-${Date.now()}`, isActive: true });

  const { error } = await supabase.from("custom_foods").insert(row);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = await supabase.from("custom_foods").select("*").order("name");
  return NextResponse.json(data ?? []);
}
