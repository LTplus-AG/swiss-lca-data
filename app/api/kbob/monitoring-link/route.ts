import { NextResponse } from "next/server";
import { getMonitoringLink, setMonitoringLink } from "@/lib/kbob-service";

export async function GET() {
  try {
    const link = await getMonitoringLink();
    return NextResponse.json({ link });
  } catch (error) {
    console.error("Failed to fetch monitoring link:", error);
    return NextResponse.json(
      { error: "Failed to fetch monitoring link" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { link } = await request.json();
    if (!link) {
      return NextResponse.json({ error: "Link is required" }, { status: 400 });
    }
    await setMonitoringLink(link);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update monitoring link:", error);
    return NextResponse.json(
      { error: "Failed to update monitoring link" },
      { status: 500 }
    );
  }
}
