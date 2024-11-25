import { NextResponse } from 'next/server';
import { checkForNewVersion, downloadAndProcessNewVersion } from '@/lib/kbob-version-checker';

export async function GET() {
  try {
    const { hasNewVersion, versionInfo } = await checkForNewVersion();

    if (!hasNewVersion) {
      return NextResponse.json({
        success: true,
        message: 'No new version available',
        updated: false
      });
    }

    if (!versionInfo) {
      throw new Error('Version info is missing');
    }

    // Process the new version
    const success = await downloadAndProcessNewVersion(versionInfo);

    if (!success) {
      throw new Error('Failed to process new version');
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated to version ${versionInfo.version}`,
      updated: true,
      version: versionInfo
    });
  } catch (error) {
    console.error('Error in version check endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
