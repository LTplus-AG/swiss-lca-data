import { put, list } from "@vercel/blob";

const STORAGE_PREFIX = "kbob";
export const MONITORING_LINK_KEY = `${STORAGE_PREFIX}/monitoring_link.txt`;
export const LAST_INGESTION_KEY = `${STORAGE_PREFIX}/last_ingestion.txt`;
export const MATERIALS_KEY = `${STORAGE_PREFIX}/materials.json`;
export const KBOB_VERSIONS_KEY = `${STORAGE_PREFIX}/versions`;
export const KBOB_CURRENT_VERSION_KEY = `${STORAGE_PREFIX}/current_version`;
export const KBOB_PENDING_VERSION_KEY = `${STORAGE_PREFIX}/pending_version`;

export function getMaterialVersionKey(version: string): string {
  return `${STORAGE_PREFIX}/materials_v${version}.json`;
}

// Add this constant for the base URL
const BLOB_BASE_URL = process.env.BLOB_STORAGE_URL

export async function getBlobContent(key: string): Promise<string | null> {
  try {
    // Clean up the key to avoid double slashes
    const cleanKey = key.replace(/\/+/g, '/').replace(/^\//, '');

    // Determine prefix (directory) to ensure we find the file
    // Passing full filename as prefix to list() can be unreliable
    const prefix = cleanKey.includes('/')
      ? cleanKey.substring(0, cleanKey.lastIndexOf('/') + 1)
      : '';

    // Get the blob URL using list
    const { blobs } = await list({
      prefix: prefix,
      limit: 1000, // Ensure we check enough blobs
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    const blob = blobs.find((b) => b.pathname === cleanKey);

    if (!blob) {
      console.warn(`No blob found for key: ${cleanKey}`);
      return null;
    }

    // Fetch the content using the URL
    const response = await fetch(blob.url);
    if (!response.ok) {
      console.warn(`Failed to fetch blob content: ${response.statusText}`);
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error(`Failed to get blob content for ${key}:`, error);
    return null;
  }
}

export async function storeBlobContent(
  key: string,
  content: string,
  contentType: string
): Promise<void> {
  try {
    // Clean up the key to avoid double slashes
    const cleanKey = key.replace(/\/+/g, '/').replace(/^\//, '');
    console.log('Storing blob with clean key:', cleanKey);

    await put(cleanKey, content, {
      access: "public",
      contentType,
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
  } catch (error) {
    console.error(`Failed to store blob content for ${key}:`, error);
    throw error;
  }
}
