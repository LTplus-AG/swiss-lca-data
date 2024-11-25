import axios from 'axios';
import * as XLSX from 'xlsx';
import { processExcelData, saveMaterialsToDB } from './kbob-service';
import { kv } from '@vercel/kv';

const KBOB_VERSION_KEY = 'kbob/latest_version';
const KBOB_EXCEL_URL = 'https://backend.kbob.admin.ch/fileservice/sdweb-docs-prod-kbobadminch-files/files/2024/10/17/66909581-b59b-495b-8f2e-41f0625fe5e6.xlsx';

interface KBOBVersionInfo {
  version: string;
  date: string;
  downloadUrl: string;
}

function extractVersionFromUrl(url: string): { year: string; month: string; day: string } {
  // Extract date components from URL path
  const matches = url.match(/\/files\/(\d{4})\/(\d{2})\/(\d{2})/);
  if (!matches) {
    throw new Error('Could not extract date from URL');
  }
  return {
    year: matches[1],
    month: matches[2],
    day: matches[3]
  };
}

export async function checkForNewVersion(isTest: boolean = false): Promise<{ hasNewVersion: boolean; versionInfo?: KBOBVersionInfo }> {
  try {
    // Extract version information from the URL
    const { year, month, day } = extractVersionFromUrl(KBOB_EXCEL_URL);
    
    // Format version string: [year]/1:[year]
    const versionText = `${year}/1:${year}`;
    console.log('Base version:', versionText);

    // In test mode, append a higher version number
    let finalVersionText = versionText;
    if (isTest) {
      finalVersionText = `${versionText}, Version 2`;
      console.log('Test mode - modified version:', finalVersionText);
    }

    const versionInfo: KBOBVersionInfo = {
      version: finalVersionText,
      date: `${year}-${month}-${day}`,
      downloadUrl: KBOB_EXCEL_URL
    };

    console.log('Version info:', versionInfo);

    // Check if this version is different from the stored version
    const storedVersion = await kv.get<KBOBVersionInfo>(KBOB_VERSION_KEY);
    console.log('Stored version:', storedVersion);

    if (!storedVersion || storedVersion.version !== versionInfo.version) {
      return { hasNewVersion: true, versionInfo };
    }

    return { hasNewVersion: false };
  } catch (error) {
    console.error('Error checking for new KBOB version:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    return { hasNewVersion: false };
  }
}

export async function downloadAndProcessNewVersion(versionInfo: KBOBVersionInfo): Promise<boolean> {
  try {
    console.log('Downloading from URL:', versionInfo.downloadUrl);
    
    // Download the Excel file
    const response = await axios.get(versionInfo.downloadUrl, {
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (response.status !== 200) {
      throw new Error(`Failed to download file: ${response.status}`);
    }

    // Parse the Excel file
    const workbook = XLSX.read(response.data, { type: 'buffer' });

    // Process the data
    const materials = processExcelData(workbook);

    // Save to database
    await saveMaterialsToDB(materials);

    // Store the new version info
    await kv.set(KBOB_VERSION_KEY, versionInfo);

    return true;
  } catch (error) {
    console.error('Error processing new KBOB version:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    return false;
  }
}