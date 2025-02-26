import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: Request) {
  try {
    // Verify authorization if needed
    const authHeader = request.headers.get("authorization");
    const apiKey = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (
      process.env.API_KEYS &&
      (!apiKey || !process.env.API_KEYS.split(",").includes(apiKey))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Call the cron job endpoint directly
    const baseUrl = process.env.NEXT_PUBLIC_HOST || "http://localhost:3000";
    const response = await axios.get(`${baseUrl}/api/cron/kbob-scraper`);

    return NextResponse.json({
      success: true,
      message: "KBOB version check triggered",
      result: response.data,
    });
  } catch (error) {
    console.error("Error triggering KBOB version check:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
