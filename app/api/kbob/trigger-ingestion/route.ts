import { NextResponse } from "next/server";
import { processExcelData } from "@/lib/kbob-service";
import { put } from "@vercel/blob";
import { kv } from "@vercel/kv";
import axios from "axios";
import * as XLSX from "xlsx";

const MATERIALS_KEY = "kbob/materials.json";
const LAST_INGESTION_KEY = "kbob/last_ingestion.txt";

export async function POST() {
  try {
    // Verify environment variables
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return NextResponse.json(
        {
          error:
            "Missing required environment variables. Please check your configuration.",
        },
        { status: 500 }
      );
    }

    console.log("Starting KBOB data ingestion...");

    // Fetch the Excel file
    const response = await axios.get(
      "https://backend.kbob.admin.ch/fileservice/sdweb-docs-prod-kbobadminch-files/files/2024/10/17/66909581-b59b-495b-8f2e-41f0625fe5e6.xlsx",
      { responseType: "arraybuffer" }
    );

    console.log("Excel file fetched, processing...");

    // Process the Excel data
    const workbook = XLSX.read(response.data, { type: "buffer" });
    const materials = processExcelData(workbook);

    console.log(`Processed ${materials.length} materials`);

    // Store in both KV and Blob storage
    await Promise.all([
      // Store in KV
      kv.set(MATERIALS_KEY, materials),

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

    console.log("Data storage completed");

    return NextResponse.json({
      success: true,
      data: materials, // Return the actual materials data
      materialsCount: materials.length,
      timestamp: timestamp,
    });
  } catch (error) {
    console.error("Ingestion error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
