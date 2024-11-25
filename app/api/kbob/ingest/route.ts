import { NextResponse } from "next/server";
import { LAST_INGESTION_KEY } from "../lib/storage";
import { put } from "@vercel/blob";
import axios from "axios";
import ExcelJS from 'exceljs';
import {
  getMonitoringLink,
  processExcelData,
  saveMaterialsToDB,
} from "@/lib/kbob-service";

export async function POST() {
  try {
    const monitoringLink = await getMonitoringLink();

    const response = await axios.get(monitoringLink, {
      responseType: "arraybuffer",
    });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(response.data);
    
    const materials = await processExcelData(workbook);

    // Save materials to both KV and Blob storage
    await saveMaterialsToDB(materials);

    // Update last ingestion timestamp
    await put(LAST_INGESTION_KEY, new Date().toISOString(), {
      access: "public",
      contentType: "text/plain",
    });

    return NextResponse.json({
      success: true,
      materialsCount: materials.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Ingestion failed:", error);
    return NextResponse.json(
      { error: "Failed to ingest KBOB data" },
      { status: 500 }
    );
  }
}
