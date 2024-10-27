import axios from "axios";
import * as XLSX from "xlsx";
import { sql } from "@vercel/postgres";

const MONITORING_LINK_KEY = "kbob_monitoring_link";
const LAST_INGESTION_KEY = "kbob_last_ingestion";
const MATERIALS_TABLE = "kbob_materials";

interface RawKBOBData {
  sheetNames: string[];
  data: Record<string, any>[];
}

export async function testKBOBLink(link: string): Promise<boolean> {
  try {
    const response = await axios.get(link, {
      responseType: "arraybuffer",
      timeout: 5000, // 5 second timeout
      validateStatus: (status: number) => status === 200,
    });

    // Try to parse as Excel file
    const workbook = XLSX.read(response.data, { type: "buffer" });
    return workbook.SheetNames.length > 0;
  } catch (error) {
    console.error("KBOB link test failed:", error);
    return false;
  }
}

export async function fetchRawKBOBData(link: string): Promise<RawKBOBData> {
  try {
    const response = await axios.get(link, {
      responseType: "arraybuffer",
    });

    const workbook = XLSX.read(response.data, { type: "buffer" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet) as Record<string, any>[];

    return {
      sheetNames: workbook.SheetNames,
      data,
    };
  } catch (error) {
    console.error("Failed to fetch KBOB data:", error);
    throw new Error("Failed to fetch KBOB data");
  }
}

export async function ingestKBOBData() {
  const monitoringLink = await getMonitoringLink();
  if (!monitoringLink) {
    throw new Error("Monitoring link not set");
  }

  const rawData = await fetchRawKBOBData(monitoringLink);

  // Clear existing data
  await sql`TRUNCATE TABLE ${sql(MATERIALS_TABLE)}`;

  // Insert new data
  for (const item of rawData.data) {
    await sql`
      INSERT INTO ${sql(MATERIALS_TABLE)} (data)
      VALUES (${JSON.stringify(item)})
    `;
  }

  // Update last ingestion time
  await sql`
    INSERT INTO ${sql(LAST_INGESTION_KEY)} (last_ingestion)
    VALUES (NOW())
    ON CONFLICT (id) DO UPDATE SET last_ingestion = NOW()
  `;
}

export async function getMonitoringLink(): Promise<string | null> {
  const result = await sql`
    SELECT link FROM ${sql(MONITORING_LINK_KEY)}
    ORDER BY id DESC LIMIT 1
  `;
  return result.rows[0]?.link || null;
}

export async function setMonitoringLink(link: string): Promise<void> {
  await sql`
    INSERT INTO ${sql(MONITORING_LINK_KEY)} (link)
    VALUES (${link})
  `;
}

export async function getLastIngestionTime(): Promise<string | null> {
  const result = await sql`
    SELECT last_ingestion FROM ${sql(LAST_INGESTION_KEY)}
    ORDER BY id DESC LIMIT 1
  `;
  return result.rows[0]?.last_ingestion?.toISOString() || null;
}

// ... rest of the file remains the same
