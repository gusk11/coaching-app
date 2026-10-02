import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { TrainingPlanSchema, MealPlanSchema, SupplementPlanSchema } from "@/lib/planSchemas";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { planType, athleteId, plan } = body as {
    planType: string;
    athleteId: string;
    plan: unknown;
  };

  if (!planType || !athleteId || !plan) {
    return NextResponse.json({ error: "planType, athleteId, and plan are required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  try {
    // Fetch current athlete row directly from DB
    const { data: rows, error: fetchError } = await supabase
      .from("athletes")
      .select("training_plan, training_plans, meal_plans, supplement_plan, supplement_plans")
      .eq("id", athleteId);

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
    if (!rows || rows.length === 0) return NextResponse.json({ error: `Athlete ${athleteId} not found` }, { status: 404 });

    const row = rows[0];
    const now = new Date().toISOString();
    let update: Record<string, unknown>;

    if (planType === "training") {
      const validated = TrainingPlanSchema.parse(plan);
      const existing: unknown[] = row.training_plans ?? (row.training_plan ? [row.training_plan] : []);
      const merged = [...existing.filter((p: unknown) => (p as { id: string }).id !== validated.id), validated];
      update = { training_plan: validated, training_plans: merged, updated_at: now };

    } else if (planType === "meal") {
      const validated = MealPlanSchema.parse(plan);
      const existing: unknown[] = row.meal_plans ?? [];
      const merged = [...existing.filter((p: unknown) => (p as { id: string }).id !== validated.id), validated];
      update = { meal_plans: merged, updated_at: now };

    } else if (planType === "supplement") {
      const validated = SupplementPlanSchema.parse(plan);
      const existing: unknown[] = row.supplement_plans ?? (row.supplement_plan ? [row.supplement_plan] : []);
      const merged = [...existing.filter((p: unknown) => (p as { id: string }).id !== validated.id), validated];
      update = { supplement_plan: validated, supplement_plans: merged, updated_at: now };

    } else {
      return NextResponse.json({ error: `Unknown planType: ${planType}` }, { status: 400 });
    }

    const { error: updateError } = await supabase.from("athletes").update(update).eq("id", athleteId);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json({ ok: true, planType, athleteId });

  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Validierungsfehler", issues: err.issues.map((i) => `${i.path.join(".")}: ${i.message}`) },
        { status: 422 }
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
