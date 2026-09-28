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
  if ("kcalPer100g" in body) row.kcal_per_100g = body.kcalPer100g ?? null;
  if ("proteinPer100g" in body) row.protein_per_100g = body.proteinPer100g ?? null;
  if ("carbsPer100g" in body) row.carbs_per_100g = body.carbsPer100g ?? null;
  if ("fatPer100g" in body) row.fat_per_100g = body.fatPer100g ?? null;
  if ("fiberPer100g" in body) row.fiber_per_100g = body.fiberPer100g ?? null;
  if ("saltPer100g" in body) row.salt_per_100g = body.saltPer100g ?? null;
  if ("defaultAmount" in body) row.default_amount = body.defaultAmount ?? null;
  if ("defaultAmountUnit" in body) row.default_amount_unit = body.defaultAmountUnit ?? null;
  if ("servingLabel" in body) row.serving_label = body.servingLabel ?? null;
  if ("notes" in body) row.notes = body.notes ?? null;
  if ("isActive" in body) row.is_active = body.isActive;
  if ("source" in body && body.source !== undefined) row.source = body.source;
  row.updated_at = new Date().toISOString();

  const { error } = await supabase.from("custom_foods").update(row).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = await supabase.from("custom_foods").select("*").order("name");
  return NextResponse.json(data ?? []);
}
