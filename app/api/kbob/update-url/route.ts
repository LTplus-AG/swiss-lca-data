// app/api/kbob/route.ts
import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const KBOB_URL_KEY = 'kbob/excel_url';

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