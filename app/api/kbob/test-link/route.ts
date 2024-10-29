import { NextResponse } from "next/server";
import { authenticate } from "@/middleware/auth";
import { testKBOBLink } from "@/lib/kbob-service";
import limiter from "@/middleware/rateLimit";
import { logRequest } from "@/lib/logger";

export async function POST(request: Request) {
  // Log the request
  await logRequest(request);

  // Apply rate limiting
  limiter(request, NextResponse);

  // Authenticate the user
  const authResponse = authenticate(request);
  if (authResponse) return authResponse;

  try {
    const { link } = await request.json();
    if (!link) {
      return NextResponse.json({ error: "Link is required" }, { status: 400 });
    }
    const isValid = await testKBOBLink(link);
    return NextResponse.json({ success: isValid });
  } catch (error) {
    console.error("Link test failed:", error);
    return NextResponse.json({ error: "Link test failed" }, { status: 500 });
  }
}
