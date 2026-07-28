import { NextRequest, NextResponse } from "next/server";
import { addImportedTrainingPlan, addImportedMealPlan, addImportedSupplementPlan } from "@/lib/store";
import { ZodError } from "zod";

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

  try {
    if (planType === "training") {
      await addImportedTrainingPlan(athleteId, plan as never);
    } else if (planType === "meal") {
      await addImportedMealPlan(athleteId, plan as never);
    } else if (planType === "supplement") {
      await addImportedSupplementPlan(athleteId, plan as never);
    } else {
      return NextResponse.json({ error: `Unknown planType: ${planType}` }, { status: 400 });
    }
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
