import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { put } from "@vercel/blob";
import * as XLSX from "xlsx";
import axios from "axios";
import { processExcelData, saveMaterialsToDB } from "@/lib/kbob-service";
import { MATERIALS_KEY, LAST_INGESTION_KEY } from "@/api/kbob/lib/storage";

// Constants for versioning
const KBOB_VERSIONS_KEY = "kbob/versions";
const KBOB_CURRENT_VERSION_KEY = "kbob/current_version";
const KBOB_PENDING_VERSION_KEY = "kbob/pending_version";

// Slack notification helper
async function sendSlackNotification(message: string) {
  if (!process.env.SLACK_WEBHOOK_URL) {
    console.warn("No Slack webhook URL configured");
    return;
  }

  try {
    await axios.post(process.env.SLACK_WEBHOOK_URL, { text: message });
  } catch (error) {
    console.error("Failed to send Slack notification:", error);
  }
}

// Function to ingest the approved version
async function ingestApprovedVersion(pendingVersion: any) {
  try {
    console.log(`Ingesting approved version: ${pendingVersion.version}`);

    // Read the Excel file
    const workbook = XLSX.readFile(pendingVersion.filePath);
    const materials = processExcelData(workbook);

    if (!materials || materials.length === 0) {
      throw new Error("No materials found in the Excel file");
    }

    // Save materials to database
    await saveMaterialsToDB(materials);

    // Update version information
    const timestamp = new Date().toISOString();

    // Create version record
    const versionRecord = {
      version: pendingVersion.version,
      publishDate: pendingVersion.publishDate,
      url: pendingVersion.url,
      filename: pendingVersion.filename,
      ingestedAt: timestamp,
      materialsCount: materials.length,
    };

    // Get existing versions
    const existingVersions = (await kv.get<any[]>(KBOB_VERSIONS_KEY)) || [];

    // Add new version to the list
    existingVersions.push(versionRecord);

    // Update KV store with version information
    await Promise.all([
      kv.set(KBOB_CURRENT_VERSION_KEY, pendingVersion.version),
      kv.set(KBOB_VERSIONS_KEY, existingVersions),
      kv.del(KBOB_PENDING_VERSION_KEY),

      // Update last ingestion timestamp
      kv.set(LAST_INGESTION_KEY, timestamp),
      put(LAST_INGESTION_KEY, timestamp, {
        access: "public",
        contentType: "text/plain",
      }),
    ]);

    return {
      success: true,
      message: `Successfully ingested version ${pendingVersion.version}`,
      version: versionRecord,
    };
  } catch (error) {
    console.error("Error ingesting approved version:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { action, version } = body;

    if (!action || (action !== "approve" && action !== "reject")) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Get pending version
    const pendingVersion = await kv.get<any>(KBOB_PENDING_VERSION_KEY);

    if (!pendingVersion) {
      return NextResponse.json(
        { error: "No pending version found" },
        { status: 404 }
      );
    }

    // Verify version matches if provided
    if (version && pendingVersion.version !== version) {
      return NextResponse.json({ error: "Version mismatch" }, { status: 400 });
    }

    if (action === "approve") {
      // Process the approval
      const result = await ingestApprovedVersion(pendingVersion);

      // Send notification
      await sendSlackNotification(
        `✅ KBOB data version ${
          pendingVersion.version
        } has been approved and ingested successfully!\n• ${
          pendingVersion.materialsCount
        } materials processed\n• Timestamp: ${new Date().toISOString()}`
      );

      return NextResponse.json({
        success: true,
        message: "Version approved and ingested",
        result,
      });
    } else {
      // Reject the version
      await kv.del(KBOB_PENDING_VERSION_KEY);

      // Send notification
      await sendSlackNotification(
        `❌ KBOB data version ${pendingVersion.version} has been rejected.`
      );

      return NextResponse.json({
        success: true,
        message: "Version rejected",
        version: pendingVersion.version,
      });
    }
  } catch (error) {
    console.error("Error processing version approval/rejection:", error);

    // Send error notification
    await sendSlackNotification(
      `❌ Error processing KBOB version approval/rejection: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
