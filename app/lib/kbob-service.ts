import axios from "axios";
import ExcelJS from 'exceljs';
import { kv } from "@vercel/kv";
import { put } from "@vercel/blob";
import {
  getBlobContent,
  MATERIALS_KEY,
  LAST_INGESTION_KEY,
  storeBlobContent,
} from "@/api/kbob/lib/storage";

const DEFAULT_KBOB_LINK =
  "https://backend.kbob.admin.ch/fileservice/sdweb-docs-prod-kbobadminch-files/files/2024/10/17/66909581-b59b-495b-8f2e-41f0625fe5e6.xlsx";

// Helper to get base URL for API calls
function getBaseUrl() {
  if (typeof window !== "undefined") {
    // Client-side
    return window.location.origin;
  }
  // Server-side
  const protocol = process.env.NEXT_PUBLIC_PROTOCOL || "http";
  const host = process.env.NEXT_PUBLIC_HOST || "localhost:3000";
  return `${protocol}://${host}`;
}

export async function testKBOBLink(link: string): Promise<boolean> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/kbob/test-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ link }),
    });

    if (!response.ok) return false;
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("KBOB link test failed:", error);
    return false;
  }
}

export async function ingestKBOBData(): Promise<void> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/kbob/ingest`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Ingestion failed");
    }
  } catch (error) {
    console.error("Ingestion failed:", error);
    throw error;
  }
}

export async function getMonitoringLink(): Promise<string> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/kbob/monitoring-link`);
    if (!response.ok) return DEFAULT_KBOB_LINK;

    const data = await response.json();
    return data.link || DEFAULT_KBOB_LINK;
  } catch (error) {
    console.error("Failed to get monitoring link:", error);
    return DEFAULT_KBOB_LINK;
  }
}

export async function setMonitoringLink(
  link: string = DEFAULT_KBOB_LINK
): Promise<void> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/kbob/monitoring-link`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ link }),
    });

    if (!response.ok) {
      throw new Error("Failed to update monitoring link");
    }
  } catch (error) {
    console.error("Failed to set monitoring link:", error);
    throw error;
  }
}

export async function getRawMaterials(): Promise<Record<string, any>[]> {
  try {
    // Try to get from KV first
    const materials = await kv.get<Record<string, any>[]>(MATERIALS_KEY);
    if (materials) {
      return materials;
    }

    // If not in KV, try to get from Blob storage
    const materialsJson = await getBlobContent(MATERIALS_KEY);
    if (materialsJson) {
      const materials = JSON.parse(materialsJson);
      // Cache in KV for future requests
      await kv.set(MATERIALS_KEY, materials);
      return materials;
    }

    return [];
  } catch (error) {
    console.error("Error fetching raw materials:", error);
    return [];
  }
}

interface KBOBMaterial {
  id: string;
  uuid: string;
  group?: string; // Made group optional
  nameDE: string;
  nameFR: string;
  density: string | null;
  unit: string;
  ubp21Total: number | null;
  ubp21Production: number | null;
  ubp21Disposal: number | null;
  gwpTotal: number | null;
  gwpProduction: number | null;
  gwpDisposal: number | null;
  biogenicCarbon: number | null;
  disposalId: string;
  disposalNameDE: string;
  disposalNameFR: string;
  primaryEnergyTotal: number | null;
  primaryEnergyProductionTotal: number | null;
  primaryEnergyProductionEnergetic: number | null;
  primaryEnergyProductionMaterial: number | null;
  primaryEnergyDisposal: number | null;
  primaryEnergyRenewableTotal: number | null;
  primaryEnergyRenewableProductionTotal: number | null;
  primaryEnergyRenewableProductionEnergetic: number | null;
  primaryEnergyRenewableProductionMaterial: number | null;
  primaryEnergyRenewableDisposal: number | null;
  primaryEnergyNonRenewableTotal: number | null;
  primaryEnergyNonRenewableProductionTotal: number | null;
  primaryEnergyNonRenewableProductionEnergetic: number | null;
  primaryEnergyNonRenewableProductionMaterial: number | null;
  primaryEnergyNonRenewableDisposal: number | null;
}

export async function processExcelData(workbook: ExcelJS.Workbook): Promise<KBOBMaterial[]> {
  // Find the correct worksheet
  const sheet = workbook.worksheets.find(ws => 
    ws.name.toLowerCase().includes("baumaterialien") ||
    ws.name.toLowerCase().includes("materiaux")
  );

  if (!sheet) {
    throw new Error("Baumaterialien/Matériaux sheet not found");
  }

  // Find header row
  let headerRowIndex = -1;
  sheet.eachRow((row, rowNumber) => {
    if (row.getCell(1).toString().toLowerCase().includes("id-nummer")) {
      headerRowIndex = rowNumber;
    }
  });

  if (headerRowIndex === -1) {
    throw new Error("Header row not found");
  }

  // Column mapping based on the complete Excel structure
  const COLUMN_MAPPING = {
    ID: 1, // ID-Nummer
    UUID: 2, // UUID-Nummer
    NAME_DE: 3, // BAUMATERIALIEN
    DISPOSAL_ID: 4, // ID-Nummer Entsorgung
    DISPOSAL_NAME_DE: 5, // Entsorgung
    DENSITY: 6, // Rohdichte/Flächenmasse
    UNIT: 7, // Bezug

    // UBP Values
    UBP_TOTAL: 8, // UBP (Total)
    UBP_PRODUCTION: 9, // UBP (Herstellung)
    UBP_DISPOSAL: 10, // UBP (Entsorgung)

    // Primary Energy Total
    PRIMARY_ENERGY_TOTAL: 11, // Primärenergie gesamt, Total
    PRIMARY_ENERGY_PRODUCTION_TOTAL: 12, // Primärenergie gesamt, Herstellung total
    PRIMARY_ENERGY_PRODUCTION_ENERGETIC: 13, // Primärenergie gesamt, Herstellung energetisch genutzt
    PRIMARY_ENERGY_PRODUCTION_MATERIAL: 14, // Primärenergie gesamt, Herstellung stofflich genutzt
    PRIMARY_ENERGY_DISPOSAL: 15, // Primärenergie gesamt, Entsorgung

    // Primary Energy Renewable
    PRIMARY_ENERGY_RENEWABLE_TOTAL: 16, // Primärenergie erneuerbar, Total
    PRIMARY_ENERGY_RENEWABLE_PRODUCTION_TOTAL: 17, // Primärenergie erneuerbar, Herstellung total
    PRIMARY_ENERGY_RENEWABLE_PRODUCTION_ENERGETIC: 18, // Primärenergie erneuerbar, Herstellung energetisch genutzt
    PRIMARY_ENERGY_RENEWABLE_PRODUCTION_MATERIAL: 19, // Primärenergie erneuerbar, Herstellung stofflich genutzt
    PRIMARY_ENERGY_RENEWABLE_DISPOSAL: 20, // Primärenergie erneuerbar, Entsorgung

    // Primary Energy Non-Renewable
    PRIMARY_ENERGY_NON_RENEWABLE_TOTAL: 21, // Primärenergie nicht erneuerbar, Total
    PRIMARY_ENERGY_NON_RENEWABLE_PRODUCTION_TOTAL: 22, // Primärenergie nicht erneuerbar, Herstellung total
    PRIMARY_ENERGY_NON_RENEWABLE_PRODUCTION_ENERGETIC: 23, // Primärenergie nicht erneuerbar, Herstellung energetisch genutzt
    PRIMARY_ENERGY_NON_RENEWABLE_PRODUCTION_MATERIAL: 24, // Primärenergie nicht erneuerbar, Herstellung stofflich genutzt
    PRIMARY_ENERGY_NON_RENEWABLE_DISPOSAL: 25, // Primärenergie nicht erneuerbar, Entsorgung

    // GWP Values
    GWP_TOTAL: 26, // Treibhausgasemissionen, Total
    GWP_PRODUCTION: 27, // Treibhausgasemissionen, Herstellung
    GWP_DISPOSAL: 28, // Treibhausgasemissionen, Entsorgung

    BIOGENIC_CARBON: 29, // Biogener Kohlenstoff, im Produkt enthalten

    NAME_FR: 30, // MATÉRIAUX DE CONSTRUCTON
    DISPOSAL_NAME_FR: 31, // Élimination
  } as const;

  const materials: KBOBMaterial[] = [];

  // Process each row after the header
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowIndex) return;

    const id = row.getCell(COLUMN_MAPPING.ID).toString().trim();
    const uuid = row.getCell(COLUMN_MAPPING.UUID).toString().trim();

    if (!isUUID(uuid)) {
      console.log(`Skipping row ${rowNumber} - Invalid UUID format:`, {
        id,
        uuid,
        row: rowNumber,
      });
      return;
    }

    try {
      const material: KBOBMaterial = {
        id,
        uuid,
        nameDE: row.getCell(COLUMN_MAPPING.NAME_DE).toString() || "",
        nameFR: row.getCell(COLUMN_MAPPING.NAME_FR).toString() || "",
        disposalId: row.getCell(COLUMN_MAPPING.DISPOSAL_ID).toString() || "",
        disposalNameDE: row.getCell(COLUMN_MAPPING.DISPOSAL_NAME_DE).toString() || "",
        disposalNameFR: row.getCell(COLUMN_MAPPING.DISPOSAL_NAME_FR).toString() || "",
        density: row.getCell(COLUMN_MAPPING.DENSITY).toString() || null,
        unit: row.getCell(COLUMN_MAPPING.UNIT).toString() || "",
        ubp21Total: parseNumber(row.getCell(COLUMN_MAPPING.UBP_TOTAL).value),
        ubp21Production: parseNumber(row.getCell(COLUMN_MAPPING.UBP_PRODUCTION).value),
        ubp21Disposal: parseNumber(row.getCell(COLUMN_MAPPING.UBP_DISPOSAL).value),
        gwpTotal: parseNumber(row.getCell(COLUMN_MAPPING.GWP_TOTAL).value),
        gwpProduction: parseNumber(row.getCell(COLUMN_MAPPING.GWP_PRODUCTION).value),
        gwpDisposal: parseNumber(row.getCell(COLUMN_MAPPING.GWP_DISPOSAL).value),
        biogenicCarbon: parseNumber(row.getCell(COLUMN_MAPPING.BIOGENIC_CARBON).value),
        primaryEnergyTotal: parseNumber(row.getCell(COLUMN_MAPPING.PRIMARY_ENERGY_TOTAL).value),
        primaryEnergyProductionTotal: parseNumber(row.getCell(COLUMN_MAPPING.PRIMARY_ENERGY_PRODUCTION_TOTAL).value),
        primaryEnergyProductionEnergetic: parseNumber(row.getCell(COLUMN_MAPPING.PRIMARY_ENERGY_PRODUCTION_ENERGETIC).value),
        primaryEnergyProductionMaterial: parseNumber(row.getCell(COLUMN_MAPPING.PRIMARY_ENERGY_PRODUCTION_MATERIAL).value),
        primaryEnergyDisposal: parseNumber(row.getCell(COLUMN_MAPPING.PRIMARY_ENERGY_DISPOSAL).value),
        primaryEnergyRenewableTotal: parseNumber(row.getCell(COLUMN_MAPPING.PRIMARY_ENERGY_RENEWABLE_TOTAL).value),
        primaryEnergyRenewableProductionTotal: parseNumber(row.getCell(COLUMN_MAPPING.PRIMARY_ENERGY_RENEWABLE_PRODUCTION_TOTAL).value),
        primaryEnergyRenewableProductionEnergetic: parseNumber(row.getCell(COLUMN_MAPPING.PRIMARY_ENERGY_RENEWABLE_PRODUCTION_ENERGETIC).value),
        primaryEnergyRenewableProductionMaterial: parseNumber(row.getCell(COLUMN_MAPPING.PRIMARY_ENERGY_RENEWABLE_PRODUCTION_MATERIAL).value),
        primaryEnergyRenewableDisposal: parseNumber(row.getCell(COLUMN_MAPPING.PRIMARY_ENERGY_RENEWABLE_DISPOSAL).value),
        primaryEnergyNonRenewableTotal: parseNumber(row.getCell(COLUMN_MAPPING.PRIMARY_ENERGY_NON_RENEWABLE_TOTAL).value),
        primaryEnergyNonRenewableProductionTotal: parseNumber(row.getCell(COLUMN_MAPPING.PRIMARY_ENERGY_NON_RENEWABLE_PRODUCTION_TOTAL).value),
        primaryEnergyNonRenewableProductionEnergetic: parseNumber(row.getCell(COLUMN_MAPPING.PRIMARY_ENERGY_NON_RENEWABLE_PRODUCTION_ENERGETIC).value),
        primaryEnergyNonRenewableProductionMaterial: parseNumber(row.getCell(COLUMN_MAPPING.PRIMARY_ENERGY_NON_RENEWABLE_PRODUCTION_MATERIAL).value),
        primaryEnergyNonRenewableDisposal: parseNumber(row.getCell(COLUMN_MAPPING.PRIMARY_ENERGY_NON_RENEWABLE_DISPOSAL).value),
      };

      materials.push(material);
    } catch (error) {
      console.error(`Error processing row ${rowNumber}:`, error);
    }
  });

  return materials;
}

function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

function isUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export async function saveMaterialsToDB(materials: KBOBMaterial[]) {
  try {
    const jsonContent = JSON.stringify(materials);
    await storeBlobContent(MATERIALS_KEY, jsonContent);
    await kv.set(MATERIALS_KEY, materials);
    await kv.set(LAST_INGESTION_KEY, new Date().toISOString());
  } catch (error) {
    console.error("Error saving materials to DB:", error);
    throw error;
  }
}

export async function getMaterialsByGroup(
  group: string
): Promise<KBOBMaterial[]> {
  try {
    const materialIds = await kv.get<string[]>(`group:${group}`);
    if (!materialIds?.length) return [];

    const pipeline = kv.pipeline();
    for (const id of materialIds) {
      pipeline.get(`material:${id}`);
    }

    const materials = await pipeline.exec();
    return materials.filter(Boolean) as KBOBMaterial[];
  } catch (error) {
    console.error("Failed to get materials by group:", error);
    return [];
  }
}

export async function getMaterialById(
  id: string
): Promise<KBOBMaterial | null> {
  try {
    return await kv.get<KBOBMaterial>(`material:${id}`);
  } catch (error) {
    console.error("Failed to get material by ID:", error);
    return null;
  }
}
