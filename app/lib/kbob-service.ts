import axios from "axios";
import * as XLSX from "xlsx";
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
  group?: string;
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

export function processExcelData(workbook: XLSX.WorkBook): KBOBMaterial[] {
  const sheetName = workbook.SheetNames.find(
    (name) =>
      name.toLowerCase().includes("baumaterialien") ||
      name.toLowerCase().includes("materiaux")
  );

  if (!sheetName) {
    throw new Error("Baumaterialien/Matériaux sheet not found");
  }

  const sheet = workbook.Sheets[sheetName];

  // Set Excel reading options
  const options = {
    header: 1,
    raw: true,
    blankrows: false,
    cellDates: true,
    cellNF: true,
    cellText: false
  };

  const rawData = XLSX.utils.sheet_to_json<string[]>(sheet, options);

  // Log raw data for debugging
  console.log("Raw Data:", rawData);

  const headerRowIndex = rawData.findIndex((row) =>
    row[0]?.toString().toLowerCase().includes("id-nummer")
  );

  if (headerRowIndex === -1) {
    throw new Error("Header row not found");
  }

  // Column mapping based on the complete Excel structure
  const COLUMN_MAPPING = {
    ID: 0, // ID-Nummer
    UUID: 1, // UUID-Nummer
    NAME_DE: 2, // BAUMATERIALIEN
    DISPOSAL_ID: 3, // ID-Nummer Entsorgung
    DISPOSAL_NAME_DE: 4, // Entsorgung
    DENSITY: 5, // Rohdichte/Flächenmasse
    UNIT: 6, // Bezug

    // UBP Values
    UBP_TOTAL: 7, // UBP (Total)
    UBP_PRODUCTION: 8, // UBP (Herstellung)
    UBP_DISPOSAL: 9, // UBP (Entsorgung)

    // Primary Energy Total
    PRIMARY_ENERGY_TOTAL: 10, // Primärenergie gesamt, Total
    PRIMARY_ENERGY_PRODUCTION_TOTAL: 11, // Primärenergie gesamt, Herstellung total
    PRIMARY_ENERGY_PRODUCTION_ENERGETIC: 12, // Primärenergie gesamt, Herstellung energetisch genutzt
    PRIMARY_ENERGY_PRODUCTION_MATERIAL: 13, // Primärenergie gesamt, Herstellung stofflich genutzt
    PRIMARY_ENERGY_DISPOSAL: 14, // Primärenergie gesamt, Entsorgung

    // Primary Energy Renewable
    PRIMARY_ENERGY_RENEWABLE_TOTAL: 15, // Primärenergie erneuerbar, Total
    PRIMARY_ENERGY_RENEWABLE_PRODUCTION_TOTAL: 16, // Primärenergie erneuerbar, Herstellung total
    PRIMARY_ENERGY_RENEWABLE_PRODUCTION_ENERGETIC: 17, // Primärenergie erneuerbar, Herstellung energetisch genutzt
    PRIMARY_ENERGY_RENEWABLE_PRODUCTION_MATERIAL: 18, // Primärenergie erneuerbar, Herstellung stofflich genutzt
    PRIMARY_ENERGY_RENEWABLE_DISPOSAL: 19, // Primärenergie erneuerbar, Entsorgung

    // Primary Energy Non-Renewable
    PRIMARY_ENERGY_NON_RENEWABLE_TOTAL: 20, // Primärenergie nicht erneuerbar, Total
    PRIMARY_ENERGY_NON_RENEWABLE_PRODUCTION_TOTAL: 21, // Primärenergie nicht erneuerbar, Herstellung total
    PRIMARY_ENERGY_NON_RENEWABLE_PRODUCTION_ENERGETIC: 22, // Primärenergie nicht erneuerbar, Herstellung energetisch genutzt
    PRIMARY_ENERGY_NON_RENEWABLE_PRODUCTION_MATERIAL: 23, // Primärenergie nicht erneuerbar, Herstellung stofflich genutzt
    PRIMARY_ENERGY_NON_RENEWABLE_DISPOSAL: 24, // Primärenergie nicht erneuerbar, Entsorgung

    // GWP Values
    GWP_TOTAL: 25, // Treibhausgasemissionen, Total
    GWP_PRODUCTION: 26, // Treibhausgasemissionen, Herstellung
    GWP_DISPOSAL: 27, // Treibhausgasemissionen, Entsorgung

    BIOGENIC_CARBON: 28, // Biogener Kohlenstoff, im Produkt enthalten

    NAME_FR: 29, // MATÉRIAUX DE CONSTRUCTON
    DISPOSAL_NAME_FR: 30, // Élimination
  } as const;

  const materials: KBOBMaterial[] = [];
  const dataStartIndex = headerRowIndex + 1;

  for (let i = dataStartIndex; i < rawData.length; i++) {
    const row = rawData[i] as string[];
    const id = row[COLUMN_MAPPING.ID]?.toString().trim();
    const uuid = row[COLUMN_MAPPING.UUID]?.toString().trim();

    // Only validate UUID format
    if (!isUUID(uuid)) {
      console.log(`Skipping row ${i + 1} - Invalid UUID format:`, {
        id,
        uuid,
        row: i + 1,
      });
      continue;
    }

    try {
      const material: KBOBMaterial = {
        id,
        uuid,
        nameDE: String(row[COLUMN_MAPPING.NAME_DE] || ""),
        nameFR: String(row[COLUMN_MAPPING.NAME_FR] || ""),
        disposalId: String(row[COLUMN_MAPPING.DISPOSAL_ID] || ""),
        disposalNameDE: String(row[COLUMN_MAPPING.DISPOSAL_NAME_DE] || ""),
        disposalNameFR: String(row[COLUMN_MAPPING.DISPOSAL_NAME_FR] || ""),
        density: String(row[COLUMN_MAPPING.DENSITY] || null),
        unit: String(row[COLUMN_MAPPING.UNIT] || ""),
        ubp21Total: parseNumber(row[COLUMN_MAPPING.UBP_TOTAL]),
        ubp21Production: parseNumber(row[COLUMN_MAPPING.UBP_PRODUCTION]),
        ubp21Disposal: parseNumber(row[COLUMN_MAPPING.UBP_DISPOSAL]),
        gwpTotal: parseNumber(row[COLUMN_MAPPING.GWP_TOTAL]),
        gwpProduction: parseNumber(row[COLUMN_MAPPING.GWP_PRODUCTION]),
        gwpDisposal: parseNumber(row[COLUMN_MAPPING.GWP_DISPOSAL]),
        biogenicCarbon: parseNumber(row[COLUMN_MAPPING.BIOGENIC_CARBON]),
        primaryEnergyTotal: parseNumber(
          row[COLUMN_MAPPING.PRIMARY_ENERGY_TOTAL]
        ),
        primaryEnergyProductionTotal: parseNumber(
          row[COLUMN_MAPPING.PRIMARY_ENERGY_PRODUCTION_TOTAL]
        ),
        primaryEnergyProductionEnergetic: parseNumber(
          row[COLUMN_MAPPING.PRIMARY_ENERGY_PRODUCTION_ENERGETIC]
        ),
        primaryEnergyProductionMaterial: parseNumber(
          row[COLUMN_MAPPING.PRIMARY_ENERGY_PRODUCTION_MATERIAL]
        ),
        primaryEnergyDisposal: parseNumber(
          row[COLUMN_MAPPING.PRIMARY_ENERGY_DISPOSAL]
        ),
        primaryEnergyRenewableTotal: parseNumber(
          row[COLUMN_MAPPING.PRIMARY_ENERGY_RENEWABLE_TOTAL]
        ),
        primaryEnergyRenewableProductionTotal: parseNumber(
          row[COLUMN_MAPPING.PRIMARY_ENERGY_RENEWABLE_PRODUCTION_TOTAL]
        ),
        primaryEnergyRenewableProductionEnergetic: parseNumber(
          row[COLUMN_MAPPING.PRIMARY_ENERGY_RENEWABLE_PRODUCTION_ENERGETIC]
        ),
        primaryEnergyRenewableProductionMaterial: parseNumber(
          row[COLUMN_MAPPING.PRIMARY_ENERGY_RENEWABLE_PRODUCTION_MATERIAL]
        ),
        primaryEnergyRenewableDisposal: parseNumber(
          row[COLUMN_MAPPING.PRIMARY_ENERGY_RENEWABLE_DISPOSAL]
        ),
        primaryEnergyNonRenewableTotal: parseNumber(
          row[COLUMN_MAPPING.PRIMARY_ENERGY_NON_RENEWABLE_TOTAL]
        ),
        primaryEnergyNonRenewableProductionTotal: parseNumber(
          row[COLUMN_MAPPING.PRIMARY_ENERGY_NON_RENEWABLE_PRODUCTION_TOTAL]
        ),
        primaryEnergyNonRenewableProductionEnergetic: parseNumber(
          row[COLUMN_MAPPING.PRIMARY_ENERGY_NON_RENEWABLE_PRODUCTION_ENERGETIC]
        ),
        primaryEnergyNonRenewableProductionMaterial: parseNumber(
          row[COLUMN_MAPPING.PRIMARY_ENERGY_NON_RENEWABLE_PRODUCTION_MATERIAL]
        ),
        primaryEnergyNonRenewableDisposal: parseNumber(
          row[COLUMN_MAPPING.PRIMARY_ENERGY_NON_RENEWABLE_DISPOSAL]
        ),
      };

      // Validate German name exists and is not too short
      if (material.nameDE && material.nameDE.length > 2) {
        materials.push(material);
      } else {
        console.log(`Skipping material ${id} - Invalid German name:`, {
          nameDE: material.nameDE,
          nameFR: material.nameFR,
          row: i + 1,
          allData: material,
        });
      }
    } catch (error) {
      console.warn(`Error processing row ${i}:`, error);
      continue;
    }
  }

  console.log(`Successfully processed ${materials.length} materials`);
  return materials;
}

function parseNumber(value: any): number | null {
  if (value === undefined || value === null || value === "") return null;

  // If it's already a number, return it
  if (typeof value === 'number') return value;

  // Convert to string and clean up the value
  const cleanValue = value
    .toString()
    .replace(/'/g, "") // Remove thousand separators
    .replace(/,/g, ".") // Replace comma with decimal point
    .replace(/\s+/g, "") // Remove whitespace
    .replace(/[^\d.-]/g, "") // Remove any non-numeric characters except decimal and minus
    .trim();

  if (cleanValue === "") return null;

  const num = Number(cleanValue);
  return isNaN(num) ? null : num;
}

function isUUID(str: string): boolean {
  if (!str) return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str.trim());
}

// Add these new functions
export async function saveMaterialsToDB(
  materials: KBOBMaterial[]
): Promise<void> {
  try {
    console.log(
      `Starting to save ${materials.length} materials to database...`
    );

    // Create a pipeline for batch operations
    const pipeline = kv.pipeline();

    // Store materials by ID
    materials.forEach((material) => {
      pipeline.set(`material:${material.id}`, material);
    });

    // Group materials by their group
    const groupMap: Record<string, string[]> = {};
    materials.forEach((material) => {
      if (!material.group) return;
      if (!groupMap[material.group]) {
        groupMap[material.group] = [];
      }
      groupMap[material.group].push(material.id);
    });

    // Store group mappings
    Object.entries(groupMap).forEach(([group, ids]) => {
      pipeline.set(`group:${group}`, ids);
    });

    // Store the list of all groups
    pipeline.set("groups", Object.keys(groupMap));

    // Store total count
    pipeline.set("materials:count", materials.length);

    // Execute all operations
    await pipeline.exec();
    console.log("Successfully saved materials to KV database");

    // Optionally store in blob storage as backup
    try {
      await storeBlobContent(
        MATERIALS_KEY,
        JSON.stringify(materials),
        "application/json"
      );
      console.log("Successfully saved materials to blob storage");
    } catch (blobError) {
      console.warn(
        "Failed to save to blob storage, but KV storage succeeded:",
        blobError
      );
    }
  } catch (error) {
    console.error("Failed to save materials to database:", error);
    throw new Error("Failed to save materials to database");
  }
}

// Add helper function to get materials by group
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

// Add helper function to get material by ID
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
