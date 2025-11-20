const XLSX = require('xlsx');
const { createClient } = require('@vercel/kv');
const { put, list } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Constants
const STORAGE_PREFIX = "kbob";
const KBOB_VERSIONS_KEY = `${STORAGE_PREFIX}/versions`;
const KBOB_CURRENT_VERSION_KEY = `${STORAGE_PREFIX}/current_version`;
const MATERIALS_KEY = `${STORAGE_PREFIX}/materials.json`;

// Initialize clients
const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// Helper to generate key
function getMaterialVersionKey(version) {
  return `${STORAGE_PREFIX}/materials_v${version}.json`;
}

// --- Parsing Logic ---
function parseNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === 'number') return value;
  const strValue = value.toString().trim();
  if (strValue === "" || strValue === "-") return null;
  if (/^\d+-\d+$/.test(strValue.replace(/\s/g, ''))) return null;
  
  let cleanValue = strValue.replace(/\s+/g, "").replace(/'/g, "");
  const commaIndex = cleanValue.indexOf(',');
  if (commaIndex !== -1) {
    const afterComma = cleanValue.substring(commaIndex + 1);
    if (afterComma.match(/^(\d{3})([^\d]|$)/) && afterComma.match(/^(\d{3})([^\d]|$)/)[1].length === 3) {
      cleanValue = cleanValue.replace(/,/g, "");
    } else {
      cleanValue = cleanValue.replace(/,/g, ".");
    }
  }
  cleanValue = cleanValue.replace(/[^\d.-]/g, "");
  if (cleanValue === "" || cleanValue === "-") return null;
  return isNaN(Number(cleanValue)) ? null : Number(cleanValue);
}

function parseDensity(value) {
  if (!value || value === "-") return { raw: null, min: null, max: null };
  const str = String(value).trim();
  const match = str.match(/^([\d\s']+)\s*-\s*([\d\s']+)$/);
  if (match) {
    return { raw: str, min: parseNumber(match[1]), max: parseNumber(match[2]) };
  }
  const num = parseNumber(str);
  return { raw: str, min: num, max: num };
}

function processExcelData(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames.find(n => /baumaterialien|materiaux/i.test(n));
  if (!sheetName) throw new Error("Sheet not found");
  
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, blankrows: false });
  
  const headerIdx = rawData.findIndex(row => row[0]?.toString().toLowerCase().includes("id-nummer"));
  if (headerIdx === -1) throw new Error("Header not found");

  const materials = [];
  for (let i = headerIdx + 1; i < rawData.length; i++) {
    const row = rawData[i];
    const uuid = row[1]?.toString().trim();
    if (!uuid || !/^[0-9a-f]{8}-/i.test(uuid)) continue;

    const density = parseDensity(row[5]);
    const mat = {
      id: row[0]?.toString().trim(),
      uuid,
      nameDE: String(row[2] || ""),
      nameFR: String(row[29] || ""),
      disposalId: String(row[3] || ""),
      disposalNameDE: String(row[4] || ""),
      disposalNameFR: String(row[30] || ""),
      density: density.raw,
      densityMin: density.min,
      densityMax: density.max,
      unit: String(row[6] || ""),
      ubp21Total: parseNumber(row[7]),
      ubp21Production: parseNumber(row[8]),
      ubp21Disposal: parseNumber(row[9]),
      gwpTotal: parseNumber(row[25]),
      gwpProduction: parseNumber(row[26]),
      gwpDisposal: parseNumber(row[27]),
      primaryEnergyTotal: parseNumber(row[10]),
      primaryEnergyNonRenewableTotal: parseNumber(row[20]),
    };
    
    if (mat.nameDE && mat.nameDE.length > 2) materials.push(mat);
  }
  return materials;
}

// --- Verification Logic ---
async function verifyBlobAccess(key) {
  console.log(`Verifying access to ${key}...`);
  try {
    const cleanKey = key.replace(/\/+/g, '/').replace(/^\//, '');
    const prefix = cleanKey.includes('/') ? cleanKey.substring(0, cleanKey.lastIndexOf('/') + 1) : '';
    
    const { blobs } = await list({
      prefix: prefix,
      limit: 1000,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    
    const blob = blobs.find(b => b.pathname === cleanKey);
    if (!blob) throw new Error("Blob not found in list");
    
    const res = await fetch(blob.url);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    
    const text = await res.text();
    const data = JSON.parse(text);
    console.log(`✅ Verification successful: Read ${data.length} items from blob.`);
    return true;
  } catch (e) {
    console.error(`❌ Verification failed: ${e.message}`);
    return false;
  }
}

// --- Main ---
async function main() {
  const args = process.argv.slice(2);
  const version = args.find((a, i) => args[i-1] === '--version');
  const filePath = args.find((a, i) => args[i-1] === '--file');
  const date = args.find((a, i) => args[i-1] === '--date') || new Date().toISOString().split('T')[0];
  const isCurrent = args.includes('--current');

  if (!version || !filePath) {
    console.error("Usage: node scripts/ingest-local.js --version <v> --file <path> [--date <yyyy-mm-dd>] [--current]");
    process.exit(1);
  }

  try {
    console.log(`🚀 Starting LOCAL ingestion for Version ${version} (${date})...`);
    console.log(`Reading file: ${filePath}`);
    
    if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
    const buffer = fs.readFileSync(filePath);
    
    console.log("Parsing Excel...");
    const materials = processExcelData(buffer);
    console.log(`Found ${materials.length} materials.`);
    
    if (materials.length === 0) throw new Error("No materials found!");

    const versionKey = getMaterialVersionKey(version);
    console.log(`Saving to ${versionKey}...`);
    await put(versionKey, JSON.stringify(materials), {
      access: "public",
      contentType: "application/json",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false
    });

    if (!await verifyBlobAccess(versionKey)) {
        throw new Error("Blob verification failed. Aborting KV update.");
    }

    console.log("Updating KV versions list...");
    const versions = (await kv.get(KBOB_VERSIONS_KEY)) || [];
    const versionInfo = {
      version,
      publishDate: date,
      date: new Date().toISOString(),
      filename: `kbob_v${version}.json`,
      materialsCount: materials.length,
      ingestedAt: new Date().toISOString(),
      isCurrent: !!isCurrent
    };

    const idx = versions.findIndex(v => v.version === version);
    if (idx >= 0) versions[idx] = { ...versions[idx], ...versionInfo };
    else versions.push(versionInfo);
    
    versions.sort((a, b) => parseFloat(b.version) - parseFloat(a.version));
    
    await kv.set(KBOB_VERSIONS_KEY, versions);

    if (isCurrent) {
       console.log("Setting as CURRENT version...");
       await put(MATERIALS_KEY, JSON.stringify(materials), {
          access: "public",
          contentType: "application/json",
          token: process.env.BLOB_READ_WRITE_TOKEN
       });
       await kv.set(KBOB_CURRENT_VERSION_KEY, version);
       console.log("Note: Individual KV items not updated in this lightweight script.");
    }

    console.log("🎉 Ingestion Complete!");

  } catch (e) {
    console.error("❌ Error:", e);
    process.exit(1);
  }
}

main();
