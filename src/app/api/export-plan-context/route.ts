import { NextRequest, NextResponse } from "next/server";
import { getExportContextData, getExportContextText } from "@/lib/store";

export async function GET(request: NextRequest) {
  const athleteId = request.nextUrl.searchParams.get("athleteId");
  if (!athleteId) {
    return NextResponse.json({ error: "athleteId required" }, { status: 400 });
  }

  try {
    const data = await getExportContextData(athleteId);
    const text = getExportContextText(athleteId, data);
    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
