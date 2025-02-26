import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { put } from "@vercel/blob";
import * as XLSX from "xlsx";
import axios from "axios";
import { KbobScraper } from "@/scraper/scraper";
import { processExcelData, saveMaterialsToDB } from "@/lib/kbob-service";
import { MATERIALS_KEY, LAST_INGESTION_KEY } from "@/api/kbob/lib/storage";

// Constants for versioning
const KBOB_VERSIONS_KEY = "kbob/versions";
const KBOB_CURRENT_VERSION_KEY = "kbob/current_version";
const KBOB_PENDING_VERSION_KEY = "kbob/pending_version";

// Slack notification helper
async function sendSlackNotification(message: string, blocks?: any[]) {
  if (!process.env.SLACK_WEBHOOK_URL) {
    console.warn("No Slack webhook URL configured");
    return;
  }

  try {
    const payload: any = { text: message };
    if (blocks) {
      payload.blocks = blocks;
    }
    await axios.post(process.env.SLACK_WEBHOOK_URL, payload);
  } catch (error) {
    console.error("Failed to send Slack notification:", error);
  }
}

// Helper to create interactive Slack message for approval
function createApprovalMessage(version: string, previewData: any) {
  const previewText =
    JSON.stringify(previewData, null, 2).substring(0, 500) + "...";

  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `🔄 New KBOB Data Version Detected: ${version}`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "A new version of KBOB data has been detected. Please review the data preview below and approve or reject the ingestion.",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Data Preview:*\n\`\`\`${previewText}\`\`\``,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Approve",
            emoji: true,
          },
          style: "primary",
          value: version,
          action_id: "approve_kbob_ingestion",
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Reject",
            emoji: true,
          },
          style: "danger",
          value: version,
          action_id: "reject_kbob_ingestion",
        },
      ],
    },
  ];
}

// Function to check if a new version is available
async function checkForNewVersion() {
  try {
    console.log("Starting KBOB scraper to check for new versions...");

    // Initialize the scraper
    const scraper = new KbobScraper();
    await scraper.initialize();

    // Run the scraper
    const result = await scraper.scrape();
    await scraper.close();

    if (!result || !result.metadata || result.metadata.length === 0) {
      console.log("No KBOB data found");
      return { success: false, message: "No KBOB data found" };
    }

    // Get the latest version from the metadata
    const latestFile = result.metadata.sort((a, b) => {
      // Sort by date (newest first)
      const dateA = a.publishDate ? new Date(a.publishDate) : new Date(0);
      const dateB = b.publishDate ? new Date(b.publishDate) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    })[0];

    // Get current version from KV
    const currentVersion = await kv.get<string>(KBOB_CURRENT_VERSION_KEY);

    // If no version found or new version is different
    if (
      !currentVersion ||
      (latestFile.version && latestFile.version !== currentVersion)
    ) {
      console.log(
        `New version detected: ${latestFile.version} (current: ${
          currentVersion || "none"
        })`
      );

      // Download the file
      const downloadPath = result.downloads.find(
        (d) => d.metadata.url === latestFile.url
      )?.path;

      if (!downloadPath) {
        console.log("File not downloaded");
        return { success: false, message: "File not downloaded" };
      }

      // Process the Excel file
      const workbook = XLSX.readFile(downloadPath);
      const materials = processExcelData(workbook);

      if (!materials || materials.length === 0) {
        console.log("No materials found in the Excel file");
        return {
          success: false,
          message: "No materials found in the Excel file",
        };
      }

      // Store the pending version
      const pendingVersion = {
        version: latestFile.version,
        publishDate: latestFile.publishDate,
        url: latestFile.url,
        filename: latestFile.filename,
        timestamp: new Date().toISOString(),
        materialsCount: materials.length,
        filePath: downloadPath,
      };

      await kv.set(KBOB_PENDING_VERSION_KEY, pendingVersion);

      // Send Slack notification with approval request
      const previewData = materials.slice(0, 3); // Preview first 3 materials
      await sendSlackNotification(
        `New KBOB data version detected: ${latestFile.version}`,
        createApprovalMessage(latestFile.version, previewData)
      );

      return {
        success: true,
        message: "New version detected and pending approval",
        pendingVersion,
      };
    } else {
      console.log("No new version detected");
      return { success: true, message: "No new version detected" };
    }
  } catch (error) {
    console.error("Error checking for new KBOB version:", error);
    await sendSlackNotification(
      `❌ Error checking for new KBOB version: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    return { success: false, message: "Error checking for new version", error };
  }
}

// Main handler for the cron job
export async function GET() {
  try {
    const result = await checkForNewVersion();

    return NextResponse.json({
      success: true,
      message: "KBOB scraper check completed",
      result,
    });
  } catch (error) {
    console.error("KBOB scraper cron job failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
