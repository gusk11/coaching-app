/**
 * POST /api/backfill-athlete-numbers
 * Assigns sequential athlete_number values (0001, 0002, …) to athletes that
 * don't have one yet, ordered by joined_at ascending so the oldest athletes
 * get the lowest numbers. Athletes that already have a number are skipped.
 */
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST() {
  // Fetch all athletes
  const { data: athletes, error: fetchError } = await supabase
    .from("athletes")
    .select("id, athlete_number, joined_at")
    .order("joined_at", { ascending: true });

  if (fetchError) {
    return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 });
  }

  if (!athletes || athletes.length === 0) {
    return NextResponse.json({ ok: true, updated: 0, message: "Keine Athleten vorhanden." });
  }

  // Determine the highest already-assigned number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maxExisting = athletes.reduce((acc: number, row: any) => {
    const n = parseInt(row.athlete_number ?? "0", 10);
    return isNaN(n) ? acc : Math.max(acc, n);
  }, 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const needsNumber = athletes.filter((row: any) => !row.athlete_number);

  let nextNumber = maxExisting + 1;
  let updated = 0;

  for (const row of needsNumber) {
    const athleteNumber = String(nextNumber).padStart(4, "0");
    const { error: updateError } = await supabase
      .from("athletes")
      .update({ athlete_number: athleteNumber })
      .eq("id", row.id);

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message, updatedSoFar: updated },
        { status: 500 }
      );
    }

    nextNumber++;
    updated++;
  }

  return NextResponse.json({
    ok: true,
    updated,
    skipped: athletes.length - updated,
    nextAvailable: String(nextNumber).padStart(4, "0"),
  });
}
