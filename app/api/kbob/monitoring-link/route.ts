import { NextResponse } from "next/server";
import {
  getBlobContent,
  storeBlobContent,
  MONITORING_LINK_KEY,
} from "../lib/storage";

export async function GET() {
  try {
    const link = await getBlobContent(MONITORING_LINK_KEY);
    return NextResponse.json({ link });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get monitoring link" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { link } = await request.json();
    await storeBlobContent(MONITORING_LINK_KEY, link, "text/plain");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update monitoring link" },
      { status: 500 }
    );
  }
}
