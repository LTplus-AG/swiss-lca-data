import { NextResponse } from "next/server";
import { testKBOBLink } from "@/lib/kbob-service";

export async function POST(request: Request) {
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
