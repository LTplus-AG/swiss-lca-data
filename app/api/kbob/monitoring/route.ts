import { NextResponse } from "next/server";
import axios from "axios";
import { kv } from "@vercel/kv";
import { JSDOM } from "jsdom";

const KBOB_URL_KEY = "kbob/current_url";
const KBOB_BASE_URL = "https://backend.kbob.admin.ch/fileservice/sdweb-docs-prod-kbobadminch-files/files";
const KBOB_PATTERN = /files\/(\d{4})\/(\d{2})\/(\d{2})\/([a-f0-9-]+)\.xlsx/i;

async function sendSlackNotification(message: string) {
  if (!process.env.SLACK_WEBHOOK_URL) {
    console.warn('No Slack webhook URL configured');
    return;
  }

  try {
    await axios.post(process.env.SLACK_WEBHOOK_URL, { text: message });
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
  }
}

async function getCurrentKbobUrl(): Promise<string | null> {
  try {
    return await kv.get<string>(KBOB_URL_KEY);
  } catch (error) {
    console.error('Failed to get current KBOB URL:', error);
    return null;
  }
}

async function findLatestKbobFile(): Promise<string | null> {
  try {
    // Get the current date
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Try the current month and previous month
    const months = [month, String(now.getMonth()).padStart(2, '0')];
    
    for (const m of months) {
      // Construct the URL for the month's directory
      const directoryUrl = `${KBOB_BASE_URL}/${year}/${m}`;
      
      try {
        // Try to access the directory
        const response = await axios.get(directoryUrl);
        const dom = new JSDOM(response.data);
        const links = Array.from(dom.window.document.querySelectorAll('a'))
          .map(a => a.href)
          .filter(href => href.endsWith('.xlsx'))
          .filter(href => KBOB_PATTERN.test(href));

        if (links.length > 0) {
          // Sort links by date (assuming format YYYY/MM/DD)
          const sortedLinks = links.sort().reverse();
          return sortedLinks[0]; // Return the most recent file
        }
      } catch (error) {
        console.log(`No files found for ${year}/${m}`);
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding latest KBOB file:', error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    console.log('Monitoring endpoint called');
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    console.log('Auth header received in monitoring:', authHeader);
    console.log('Expected API_SECRET_KEY:', process.env.API_SECRET_KEY);
    
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== process.env.API_SECRET_KEY) {
      console.log('Authorization failed in monitoring');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Authorization successful in monitoring, checking for updates...');
    // Get current URL
    const currentUrl = await getCurrentKbobUrl();
    
    // Find latest available file
    const latestUrl = await findLatestKbobFile();
    
    if (!latestUrl) {
      return NextResponse.json({
        success: false,
        message: 'No KBOB files found',
        currentUrl
      });
    }
    
    // If we found a new URL and it's different from the current one
    if (latestUrl !== currentUrl) {
      // Store the new URL
      await kv.set(KBOB_URL_KEY, latestUrl);
      
      // Send notification about new version
      await sendSlackNotification(`🆕 New KBOB version detected!\n• New URL: ${latestUrl}\n• Previous URL: ${currentUrl}\n• Triggering automatic ingestion...`);
      
      // Trigger ingestion
      try {
        const ingestResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/kbob/trigger-ingestion`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${process.env.API_SECRET_KEY}`
            }
          }
        );
        
        if (ingestResponse.data.success) {
          await sendSlackNotification('✅ Automatic ingestion started successfully!');
        }
      } catch (error) {
        await sendSlackNotification('❌ Failed to trigger automatic ingestion. Please ingest manually.');
      }
      
      return NextResponse.json({
        success: true,
        message: 'New version found and ingestion triggered',
        previousUrl: currentUrl,
        newUrl: latestUrl
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'No new version available',
      currentUrl
    });
  } catch (error) {
    console.error('Error in monitoring endpoint:', error);
    await sendSlackNotification(`❌ Error checking for KBOB updates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json(
      { success: false, message: 'Failed to check for updates' },
      { status: 500 }
    );
  }
}
