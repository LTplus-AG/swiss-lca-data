import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import * as XLSX from "xlsx";
import axios from "axios";
import { KbobScraper } from "@/scraper/scraper";
import { processExcelData } from "@/lib/kbob-service";
import path from "path";
import fs from "fs";

// Constants for test versioning
const TEST_PENDING_VERSION_KEY = "kbob/test_pending_version";

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === "development";

// Slack notification helper
async function sendSlackNotification(message: string, blocks?: any[]) {
  if (!process.env.SLACK_WEBHOOK_URL) {
    console.warn("No Slack webhook URL configured");
    return false;
  }

  try {
    const payload: any = { text: message };
    if (blocks) {
      payload.blocks = blocks;
    }

    console.log(
      "Sending Slack notification with payload:",
      JSON.stringify(payload, null, 2)
    );

    await axios.post(process.env.SLACK_WEBHOOK_URL, payload);
    console.log("Slack notification sent successfully");
    return true;
  } catch (error) {
    console.error("Failed to send Slack notification:", error);
    return false;
  }
}

// Helper to create interactive Slack message for testing
function createTestApprovalMessage(version: string, previewData: any) {
  const previewText =
    JSON.stringify(previewData, null, 2).substring(0, 500) + "...";

  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `🧪 TEST: New KBOB Data Version: ${version}`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "**THIS IS A TEST**. A new version of KBOB data has been detected. Please review the data preview below.",
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
            text: "Approve (Test)",
            emoji: true,
          },
          style: "primary",
          value: `test_${version}`,
          action_id: "test_approve_kbob_ingestion",
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Reject (Test)",
            emoji: true,
          },
          style: "danger",
          value: `test_${version}`,
          action_id: "test_reject_kbob_ingestion",
        },
      ],
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "⚠️ This is a test notification. No actual data will be ingested.",
        },
      ],
    },
  ];
}

// Function to simulate the approval flow
async function simulateApproval(pendingVersion: any) {
  try {
    // Send a simulated approval notification
    await sendSlackNotification(
      `✅ TEST: KBOB data version ${
        pendingVersion.version
      } has been approved (simulation)!\n• ${
        pendingVersion.materialsCount
      } materials would be processed\n• Timestamp: ${new Date().toISOString()}\n\n⚠️ This is a test - no data was actually ingested.`
    );

    return {
      success: true,
      message: `Successfully simulated approval for version ${pendingVersion.version}`,
      version: pendingVersion.version,
    };
  } catch (error) {
    console.error("Error simulating approval:", error);
    throw error;
  }
}

// Function to simulate the rejection flow
async function simulateRejection(pendingVersion: any) {
  try {
    // Send a simulated rejection notification
    await sendSlackNotification(
      `❌ TEST: KBOB data version ${pendingVersion.version} has been rejected (simulation).\n\n⚠️ This is a test - no action was actually taken.`
    );

    return {
      success: true,
      message: `Successfully simulated rejection for version ${pendingVersion.version}`,
      version: pendingVersion.version,
    };
  } catch (error) {
    console.error("Error simulating rejection:", error);
    throw error;
  }
}

// Helper to verify API key
function verifyApiKey(request: Request): boolean {
  // In development mode, always allow access
  if (isDevelopment) {
    console.log("Development mode detected - bypassing API key verification");
    return true;
  }

  // Check if this is an internal request from our Slack interactive endpoint
  const referer = request.headers.get("referer") || "";
  const origin = request.headers.get("origin") || "";
  const host = request.headers.get("host") || "";
  const internalRequestHeader = request.headers.get("x-internal-request");

  // Allow requests from our own Slack interactive endpoint
  const isInternalRequest =
    // Check if the request has our internal request header
    internalRequestHeader === "slack-interactive" ||
    // Check if the request is coming from our own server
    (origin && (origin.includes("localhost") || origin.includes(host))) ||
    // Check if the referer is our Slack interactive endpoint
    (referer && referer.includes("/api/slack/interactive"));

  if (isInternalRequest) {
    console.log("Internal request detected - bypassing API key verification");
    return true;
  }

  // Check for API key in Authorization header
  const authHeader = request.headers.get("authorization");
  const apiKey = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;

  // Check if API key is valid
  if (!apiKey || !process.env.API_KEYS) {
    console.log("API key validation failed");
    return false;
  }

  const isValid = process.env.API_KEYS.split(",").includes(apiKey);
  if (!isValid) {
    console.log("Invalid API key, returning 403");
  }
  return isValid;
}

// Helper to find the latest Excel file in the downloads directory
async function findLatestExcelFile() {
  const downloadsDir = "./downloads";

  try {
    // Check if directory exists
    if (!fs.existsSync(downloadsDir)) {
      console.log("Downloads directory does not exist");
      return null;
    }

    // Get all files in the directory
    const files = fs
      .readdirSync(downloadsDir)
      .filter((file) => file.endsWith(".xlsx") || file.endsWith(".xls"))
      .map((file) => {
        const filePath = path.join(downloadsDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          mtime: stats.mtime,
        };
      })
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    if (files.length === 0) {
      console.log("No Excel files found in downloads directory");
      return null;
    }

    // Return the most recent file
    console.log(`Found latest Excel file: ${files[0].name}`);
    return files[0].path;
  } catch (error) {
    console.error("Error finding latest Excel file:", error);
    return null;
  }
}

// Helper to create a mock KBOB version for testing
function createMockKbobVersion() {
  // Create a mock version with current date
  const now = new Date();
  const version = `test-${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;

  return {
    version: version,
    publishDate: now.toISOString(),
    url: "https://example.com/test-kbob-data.xlsx",
    filename: `test-kbob-data-${version}.xlsx`,
    timestamp: now.toISOString(),
    materialsCount: 100, // Mock number of materials
  };
}

// Helper to create mock materials for testing
function createMockMaterials() {
  // Create some mock materials for testing
  return [
    {
      uuid: "test-uuid-1",
      nameDE: "Test Material 1",
      nameFR: "Matériau de test 1",
      density: "2500",
      unit: "kg",
      ubp21Total: 1000,
      gwpTotal: 10.5,
    },
    {
      uuid: "test-uuid-2",
      nameDE: "Test Material 2",
      nameFR: "Matériau de test 2",
      density: "1800",
      unit: "kg",
      ubp21Total: 800,
      gwpTotal: 8.2,
    },
    {
      uuid: "test-uuid-3",
      nameDE: "Test Material 3",
      nameFR: "Matériau de test 3",
      density: "2200",
      unit: "kg",
      ubp21Total: 1200,
      gwpTotal: 12.7,
    },
  ];
}

// Main handler for the test endpoint
export async function GET(request: Request) {
  try {
    // Verify authentication
    if (!verifyApiKey(request)) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const step = searchParams.get("step") || "detect";

    // Step 1: Detect new version
    if (step === "detect") {
      console.log("Starting KBOB scraper test flow...");

      let pendingVersion;
      let materials;
      let usedFallback = false;

      try {
        // Initialize the scraper
        const scraper = new KbobScraper();
        await scraper.initialize();

        // Run the scraper
        const result = await scraper.scrape();
        console.log("Scraper result:", JSON.stringify(result, null, 2));

        if (result && result.metadata && result.metadata.length > 0) {
          // Get the latest version from the metadata
          const latestFile = result.metadata.sort((a, b) => {
            // Sort by date (newest first)
            const dateA = a.publishDate ? new Date(a.publishDate) : new Date(0);
            const dateB = b.publishDate ? new Date(b.publishDate) : new Date(0);
            return dateB.getTime() - dateA.getTime();
          })[0];

          console.log("Latest file:", JSON.stringify(latestFile, null, 2));

          // Find the download path for this file
          const downloadInfo = result.downloads.find(
            (d) => d.metadata.url === latestFile.url
          );

          if (downloadInfo && downloadInfo.path) {
            console.log("Download path:", downloadInfo.path);

            try {
              // Try to read the Excel file
              const workbook = XLSX.readFile(downloadInfo.path);
              materials = processExcelData(workbook);

              if (materials && materials.length > 0) {
                pendingVersion = {
                  version: latestFile.version || "unknown",
                  publishDate:
                    latestFile.publishDate || new Date().toISOString(),
                  url: latestFile.url,
                  filename: latestFile.filename,
                  timestamp: new Date().toISOString(),
                  materialsCount: materials.length,
                  filePath: downloadInfo.path,
                };
              }
            } catch (fileError) {
              console.error("Error reading Excel file:", fileError);
              // Will fall back to mock data
            }
          }
        }
      } catch (scraperError) {
        console.error("Error running scraper:", scraperError);
        // Will fall back to mock data
      }

      // If we couldn't get real data, use fallback
      if (!pendingVersion || !materials) {
        console.log("Using fallback mock data for testing");
        usedFallback = true;

        // Create mock data for testing
        pendingVersion = createMockKbobVersion();
        materials = createMockMaterials();
      }

      // Store the test pending version
      await kv.set(TEST_PENDING_VERSION_KEY, pendingVersion);

      // Send test Slack notification with approval request
      const previewData = materials.slice(0, 3); // Preview first 3 materials
      const notificationSent = await sendSlackNotification(
        `🧪 TEST: New KBOB data version detected: ${pendingVersion.version}${
          usedFallback ? " (mock data)" : ""
        }`,
        createTestApprovalMessage(pendingVersion.version, previewData)
      );

      return NextResponse.json({
        success: true,
        message: `Test flow: New version detected and test notification sent${
          usedFallback ? " (using mock data)" : ""
        }`,
        pendingVersion,
        notificationSent,
        nextStep: "To simulate approval, call this endpoint with ?step=approve",
        rejectStep:
          "To simulate rejection, call this endpoint with ?step=reject",
      });
    }
    // Step 2: Simulate approval
    else if (step === "approve") {
      const pendingVersion = await kv.get<any>(TEST_PENDING_VERSION_KEY);

      if (!pendingVersion) {
        return NextResponse.json({
          success: false,
          message: "No test pending version found. Run the detect step first.",
        });
      }

      const result = await simulateApproval(pendingVersion);

      // Clean up
      await kv.del(TEST_PENDING_VERSION_KEY);

      return NextResponse.json({
        success: true,
        message: "Test flow: Approval simulated successfully",
        result,
      });
    }
    // Step 3: Simulate rejection
    else if (step === "reject") {
      const pendingVersion = await kv.get<any>(TEST_PENDING_VERSION_KEY);

      if (!pendingVersion) {
        return NextResponse.json({
          success: false,
          message: "No test pending version found. Run the detect step first.",
        });
      }

      const result = await simulateRejection(pendingVersion);

      // Clean up
      await kv.del(TEST_PENDING_VERSION_KEY);

      return NextResponse.json({
        success: true,
        message: "Test flow: Rejection simulated successfully",
        result,
      });
    } else {
      return NextResponse.json({
        success: false,
        message:
          "Invalid step parameter. Use 'detect', 'approve', or 'reject'.",
      });
    }
  } catch (error) {
    console.error("KBOB test flow failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
