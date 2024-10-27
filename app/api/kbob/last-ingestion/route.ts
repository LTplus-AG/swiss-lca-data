import { NextResponse } from "next/server";
import { getLastIngestionTime } from "@/lib/kbob-service";

export async function GET() {
  try {
    const lastIngestionTime = await getLastIngestionTime();
    return NextResponse.json({ lastIngestionTime });
  } catch (error) {
    console.error("Failed to fetch last ingestion time:", error);
    return NextResponse.json(
      { error: "Failed to fetch last ingestion time" },
      { status: 500 }
    );
  }
}
