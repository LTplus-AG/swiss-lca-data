import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { 
  KBOB_VERSIONS_KEY, 
  KBOB_CURRENT_VERSION_KEY, 
  KBOB_PENDING_VERSION_KEY 
} from "@/api/kbob/lib/storage";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get version information
    const [versions, currentVersion, pendingVersion] = await Promise.all([
      kv.get<any[]>(KBOB_VERSIONS_KEY),
      kv.get<string>(KBOB_CURRENT_VERSION_KEY),
      kv.get<any>(KBOB_PENDING_VERSION_KEY),
    ]);

    return NextResponse.json({
      success: true,
      versions: versions || [],
      currentVersion,
      pendingVersion: pendingVersion
        ? {
            version: pendingVersion.version,
            publishDate: pendingVersion.publishDate,
            url: pendingVersion.url,
            filename: pendingVersion.filename,
            timestamp: pendingVersion.timestamp,
            materialsCount: pendingVersion.materialsCount,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching KBOB versions:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
