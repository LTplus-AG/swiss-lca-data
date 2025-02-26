import { NextResponse, NextRequest } from "next/server";
import { processExcelData } from "@/lib/kbob-service";
import { put } from "@vercel/blob";
import { kv } from "@vercel/kv";
import axios from "axios";
import * as XLSX from "xlsx";

const MATERIALS_KEY = "kbob/materials.json";
const LAST_INGESTION_KEY = "kbob/last_ingestion.txt";
const KBOB_URL_KEY = "kbob/current_url";

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

export async function POST(request: NextRequest) {
  try {
    console.log("Trigger ingestion endpoint called");

    // Verify environment variables
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.log("Missing required environment variables");
      return NextResponse.json(
        {
          error:
            "Missing required environment variables. Please check your configuration.",
        },
        { status: 500 }
      );
    }

    // Verify authorization
    const authHeader = request.headers.get("authorization");
    const apiKey = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;
    console.log("API Key received:", apiKey);

    if (!apiKey || !process.env.API_KEYS?.split(",").includes(apiKey)) {
      console.log("Authorization failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Authorization successful, starting ingestion...");

    // Get current KBOB URL
    const kbobUrl =
      (await kv.get<string>(KBOB_URL_KEY)) ||
      "https://backend.kbob.admin.ch/fileservice/sdweb-docs-prod-kbobadminch-files/files/2024/12/03/f331074f-1f32-485a-8028-1705895cca48.xlsx";

    // Fetch the Excel file
    const response = await axios.get(kbobUrl, { responseType: "arraybuffer" });

    console.log("Excel file fetched, processing...");

    // Process the Excel data
    const workbook = XLSX.read(response.data, { type: "buffer" });
    const materials = processExcelData(workbook);

    console.log(`Processed ${materials.length} materials`);

    // Store in both KV and Blob storage
    await Promise.all([
      // Store in KV
      kv.set(MATERIALS_KEY, materials),
      kv.set(KBOB_URL_KEY, kbobUrl),

      // Store in Blob
      put(MATERIALS_KEY, JSON.stringify(materials), {
        access: "public",
        contentType: "application/json",
      }),
    ]);

    // Update last ingestion time
    const timestamp = new Date().toISOString();
    await Promise.all([
      kv.set(LAST_INGESTION_KEY, timestamp),
      put(LAST_INGESTION_KEY, timestamp, {
        access: "public",
        contentType: "text/plain",
      }),
    ]);

    // Send Slack notification
    await sendSlackNotification(
      `✅ KBOB data ingestion completed successfully!\n• ${materials.length} materials processed\n• Timestamp: ${timestamp}\n• URL: ${kbobUrl}`
    );

    console.log("Data storage completed");

    return NextResponse.json({
      success: true,
      data: materials,
      materialsCount: materials.length,
      timestamp: timestamp,
      url: kbobUrl,
    });
  } catch (error) {
    // Send error notification to Slack
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    await sendSlackNotification(
      `❌ KBOB data ingestion failed!\n• Error: ${errorMessage}`
    );

    console.error("Ingestion error:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
