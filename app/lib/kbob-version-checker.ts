import axios from 'axios';
import * as XLSX from 'xlsx';
import { processExcelData, saveMaterialsToDB } from './kbob-service';
import { kv } from '@vercel/kv';
import { sendSlackNotification, formatKBOBUpdateMessage } from './slack-notifier';
import puppeteer from 'puppeteer';

import { KBOB_CURRENT_VERSION_KEY } from '@/api/kbob/lib/storage';
const KBOB_BASE_URL = 'https://www.kbob.admin.ch/de/oekobilanzdaten-im-baubereich';
const BACKEND_URL_PATTERN = 'backend.kbob.admin.ch/fileservice/sdweb-docs-prod-kbobadminch-files/files';

interface KBOBVersionInfo {
  version: string;
  date: string;
  downloadUrl: string;
}

async function extractVersionFromPage(): Promise<{ version: string; excelUrl: string | null }> {
  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox']
    });

    // Create a new page
    const page = await browser.newPage();

    // Navigate to the page and wait for content to load
    await page.goto(KBOB_BASE_URL, { waitUntil: 'networkidle0' });

    // Accept cookies if the dialog is present
    try {
      const acceptButton = await page.$('button:has-text("Akzeptieren")');
      if (acceptButton) {
        await acceptButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (e) {
      console.log('No cookie consent dialog found or error clicking it:', e);
    }

    // Find Excel download link and version from the backend URL
    const { excelUrl, version } = await page.evaluate((backendPattern) => {
      const links = Array.from(document.querySelectorAll('a'));
      for (const link of links) {
        const href = link.href || '';
        if (href.includes(backendPattern) && href.toLowerCase().includes('.xlsx')) {
          console.log('Found backend link:', href);
          
          // Extract version from URL
          const urlParts = href.split('/');
          const filename = urlParts[urlParts.length - 1];
          console.log('Filename:', filename);
          
          // Look for version in parent element text
          const parentText = link.parentElement?.textContent || '';
          console.log('Parent text:', parentText);
          
          const versionMatch = parentText.match(/\((\d{4}\/\d+:\d{4}),\s*Version\s*(\d+)\)/);
          if (versionMatch) {
            return {
              excelUrl: href,
              version: `${versionMatch[1]}, Version ${versionMatch[2]}`
            };
          }
        }
      }
      return { excelUrl: null, version: null };
    }, BACKEND_URL_PATTERN);

    console.log('Found Excel URL:', excelUrl);
    console.log('Found version:', version);

    if (!excelUrl || !version) {
      throw new Error('Could not find Excel file URL or version information');
    }

    return { version, excelUrl };
  } catch (error) {
    console.error('Error extracting version from page:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function checkForNewVersion(isTest: boolean = false): Promise<{ hasNewVersion: boolean; versionInfo?: KBOBVersionInfo }> {
  try {
    // Extract version info from the main page
    const { version: pageVersion, excelUrl } = await extractVersionFromPage();

    // In test mode, increment the version number
    let finalVersion = pageVersion;
    if (isTest) {
      const versionMatch = pageVersion.match(/Version (\d+)$/);
      if (versionMatch) {
        const currentVersion = parseInt(versionMatch[1]);
        finalVersion = pageVersion.replace(/Version \d+$/, `Version ${currentVersion + 1}`);
      }
    }

    const versionInfo: KBOBVersionInfo = {
      version: finalVersion,
      date: new Date().toISOString().split('T')[0],
      downloadUrl: excelUrl || ''
    };

    console.log('Version info:', versionInfo);

    // Check if this version is different from the stored version
    const currentVersion = await kv.get<string>(KBOB_CURRENT_VERSION_KEY);
    console.log('Stored version:', currentVersion);

    if (!currentVersion || currentVersion !== versionInfo.version) {
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
    if (!versionInfo.downloadUrl) {
      throw new Error('No download URL available');
    }

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
    await saveMaterialsToDB(materials, versionInfo.version);

    // Send Slack notification
    const message = formatKBOBUpdateMessage(
      versionInfo.version,
      versionInfo.date,
      materials.length
    );
    await sendSlackNotification(message);

    return true;
  } catch (error) {
    console.error('Error processing new KBOB version:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }

    // Send error notification to Slack
    if (error instanceof Error) {
      await sendSlackNotification({
        text: `❌ Error processing KBOB update: ${error.message}`
      });
    }

    return false;
  }
}