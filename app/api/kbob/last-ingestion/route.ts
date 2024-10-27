import { NextResponse } from "next/server";
import { getBlobContent, LAST_INGESTION_KEY } from "../lib/storage";

export async function GET() {
  try {
    const timestamp = await getBlobContent(LAST_INGESTION_KEY);
    return NextResponse.json({ timestamp });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get last ingestion time" },
      { status: 500 }
    );
  }
}
