import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import axios from "axios";

const KBOB_URL_KEY = "kbob/current_url";

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

export async function POST(request: Request) {
  try {
    console.log('Add version endpoint called');
    // Verify API key
    const apiKey = request.headers.get('x-api-key');
    console.log('API Key received:', apiKey);
    console.log('Valid API keys:', process.env.API_KEYS?.split(","));
    
    if (!apiKey || !process.env.API_KEYS?.split(",").includes(apiKey)) {
      console.log('API key validation failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    console.log('Request body:', body);
    const { downloadUrl, version } = body;

    // Validate required fields
    if (!downloadUrl || !version) {
      console.log('Missing required fields');
      return NextResponse.json({ 
        error: 'Missing required fields', 
        message: 'Both downloadUrl and version are required' 
      }, { status: 400 });
    }

    console.log('Storing new URL in KV');
    // Store the new URL
    const previousUrl = await kv.get<string>(KBOB_URL_KEY);
    console.log('Previous URL:', previousUrl);
    await kv.set(KBOB_URL_KEY, downloadUrl);
    console.log('New URL stored successfully');

    console.log('Sending Slack notification');
    // Send notification about manual version addition
    await sendSlackNotification(
      `🔄 Manual KBOB version update\n• Version: ${version}\n• New URL: ${downloadUrl}\n• Previous URL: ${previousUrl}\n• Triggering ingestion...`
    );

    // Trigger ingestion
    try {
      console.log('Triggering ingestion');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      console.log('Using base URL:', baseUrl);
      
      const apiKey = request.headers.get('x-api-key');
      console.log('Using API key for ingestion:', apiKey);
      
      const ingestResponse = await axios.post(
        `${baseUrl}/api/kbob/trigger-ingestion`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );

      console.log('Ingestion response:', ingestResponse.data);
      if (ingestResponse.data.success) {
        console.log('Ingestion started successfully');
        await sendSlackNotification('✅ Manual ingestion started successfully!');
      }

      return NextResponse.json({
        success: true,
        message: 'Version added and ingestion triggered',
        previousUrl,
        newUrl: downloadUrl,
        version
      });

    } catch (error) {
      console.error('Error triggering ingestion:', error);
      await sendSlackNotification('❌ Failed to trigger ingestion after manual version update. Please ingest manually.');
      return NextResponse.json({
        success: false,
        message: 'Version added but ingestion failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in add-version endpoint:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to add version',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
