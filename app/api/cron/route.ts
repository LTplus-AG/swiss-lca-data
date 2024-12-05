import { NextResponse } from "next/server";
import axios from "axios";

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    // Verify the cron secret to ensure this is a legitimate cron job
    const authHeader = request.headers.get('authorization');
    console.log('Auth header received:', authHeader);
    console.log('Expected CRON_SECRET_KEY:', process.env.CRON_SECRET_KEY);
    console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
    
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      console.log('Authorization failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Authorization successful, calling monitoring endpoint...');
    // Call the monitoring endpoint
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/kbob/monitoring`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.API_SECRET_KEY}`
        }
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}
