import { NextResponse } from "next/server";
import { ingestKBOBData } from "@/lib/kbob-service";

export async function POST() {
  try {
    await ingestKBOBData();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ingestion failed:", error);
    return NextResponse.json({ error: "Ingestion failed" }, { status: 500 });
  }
}
