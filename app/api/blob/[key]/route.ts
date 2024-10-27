import { NextResponse } from "next/server";
import { getDownloadUrl } from "@vercel/blob";

export async function GET(
  request: Request,
  { params }: { params: { key: string } }
) {
  try {
    const url = await getDownloadUrl(params.key);

    if (!url) {
      return NextResponse.json({ error: "Blob not found" }, { status: 404 });
    }

    // Redirect to the actual blob URL
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Error accessing blob:", error);
    return NextResponse.json(
      { error: "Failed to access blob" },
      { status: 500 }
    );
  }
}
