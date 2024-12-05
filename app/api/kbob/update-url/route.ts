// app/api/kbob/update-url/route.ts
import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import axios from 'axios';

const KBOB_URL_KEY = 'kbob/excel_url';

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

export async function PUT(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, message: 'URL is required' },
        { status: 400 }
      );
    }

    // Store the URL
    await kv.set(KBOB_URL_KEY, url);

    // Send notification about URL update
    await sendSlackNotification(` KBOB URL updated!\n• New URL: ${url}\n• Please trigger an ingestion to fetch new data.`);

    return NextResponse.json({
      success: true,
      message: 'KBOB URL updated successfully',
      url
    });
  } catch (error) {
    console.error('Error updating KBOB URL:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update KBOB URL' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const url = await kv.get<string>(KBOB_URL_KEY);
    return NextResponse.json({
      success: true,
      url: url || null
    });
  } catch (error) {
    console.error('Error getting KBOB URL:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get KBOB URL' },
      { status: 500 }
    );
  }
}