import axios from 'axios';
import * as XLSX from 'xlsx';
import { processExcelData, saveMaterialsToDB } from './kbob-service';
import { kv } from '@vercel/kv';
import * as cheerio from 'cheerio';

const KBOB_VERSION_KEY = 'kbob/latest_version';
const KBOB_BASE_URL = 'https://www.kbob.admin.ch/kbob/de/home/publikationen/nachhaltiges-bauen/oekobilanzdaten_baubereich.html';

interface KBOBVersionInfo {
  version: string;
  date: string;
  downloadUrl: string;
}

export async function checkForNewVersion(): Promise<{ hasNewVersion: boolean; versionInfo?: KBOBVersionInfo }> {
  try {
    // Fetch the KBOB webpage
    const response = await axios.get(KBOB_BASE_URL);
    const html = response.data;

    // Use cheerio to parse the HTML
    const $ = cheerio.load(html);

    // Find the main content area
    const mainContent = $('#content');
    console.log('Main content found:', mainContent.length > 0);

    // Look for version information in text
    let versionText = '';
    let downloadUrl = '';

    // Search for links containing Excel files
    mainContent.find('a').each((_, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().trim();
      console.log('Found link:', { href, text });

      if (href?.toLowerCase().includes('.xlsx')) {
        downloadUrl = href;
        // Look for version info in surrounding text
        const parentText = $(element).parent().text().trim();
        console.log('Parent text:', parentText);

        // Try to find version info in parent text
        const versionRegex = /(\d{4}(?:\/\d+)?(?::\d{4})?(?:\s*,\s*Version\s*\d+)?)/;
        const match = parentText.match(versionRegex);
        if (match) {
          versionText = match[1];
        }
      }
    });

    if (!versionText || !downloadUrl) {
      console.log('Version text:', versionText);
      console.log('Download URL:', downloadUrl);
      console.error('Could not find version information or download URL');
      return { hasNewVersion: false };
    }

    const versionInfo: KBOBVersionInfo = {
      version: versionText,
      date: new Date().toISOString(),
      downloadUrl: new URL(downloadUrl, KBOB_BASE_URL).toString()
    };

    console.log('Found version info:', versionInfo);

    // Check if this version is different from the stored version
    const storedVersion = await kv.get<KBOBVersionInfo>(KBOB_VERSION_KEY);

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
    // Download the Excel file
    const response = await axios.get(versionInfo.downloadUrl, {
      responseType: 'arraybuffer'
    });

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
    return false;
  }
}