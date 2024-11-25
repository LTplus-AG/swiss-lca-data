import { put, getDownloadUrl } from "@vercel/blob";

const STORAGE_PREFIX = "kbob";
export const MONITORING_LINK_KEY = `${STORAGE_PREFIX}/monitoring_link.txt`;
export const LAST_INGESTION_KEY = `${STORAGE_PREFIX}/last_ingestion.txt`;
export const MATERIALS_KEY = `${STORAGE_PREFIX}/materials.json`;

// Add this constant for the base URL
const BLOB_BASE_URL = process.env.BLOB_STORAGE_URL

export async function getBlobContent(key: string): Promise<string | null> {
  try {
    // Clean up the key to avoid double slashes
    const cleanKey = key.replace(/\/+/g, '/').replace(/^\//, '');

    // Get the signed URL for the blob
    const url = await getDownloadUrl(cleanKey);
    if (!url) {
      console.warn(`No URL found for blob key: ${cleanKey}`);
      return null;
    }

    // Fetch the content using the signed URL
    const response = await fetch(url);
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
    });
  } catch (error) {
    console.error(`Failed to store blob content for ${key}:`, error);
    throw error;
  }
}
