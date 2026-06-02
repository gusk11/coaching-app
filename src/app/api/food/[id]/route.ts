import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const type = request.nextUrl.searchParams.get("type");
  const supabase = createSupabaseAdmin();

  if (type === "custom") {
    const { error } = await supabase.from("custom_foods").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (type === "base") {
    const { data: existing } = await supabase
      .from("deactivated_foods")
      .select("food_id")
      .eq("food_id", id)
      .limit(1);
    if (!existing || existing.length === 0) {
      const { error } = await supabase.from("deactivated_foods").insert({ food_id: id });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
