import { put, getDownloadUrl } from "@vercel/blob";

const STORAGE_PREFIX = "kbob";
export const MONITORING_LINK_KEY = `${STORAGE_PREFIX}/monitoring_link.txt`;
export const LAST_INGESTION_KEY = `${STORAGE_PREFIX}/last_ingestion.txt`;
export const MATERIALS_KEY = `${STORAGE_PREFIX}/materials.json`;

// Add this constant for the base URL
const BLOB_BASE_URL =
  process.env.NEXT_PUBLIC_BLOB_STORE_URL ||
  "https://your-blob-store-base-url.com";

// Helper to get the absolute URL
function getAbsoluteUrl(path: string): string {
  const protocol = process.env.NEXT_PUBLIC_PROTOCOL || "http";
  const host = process.env.NEXT_PUBLIC_HOST || "localhost:3000";
  return `${protocol}://${host}${path}`;
}

export async function getBlobContent(key: string): Promise<string | null> {
  try {
    // Ensure the key has a proper URL format by combining with base URL
    const fullUrl = new URL(key, BLOB_BASE_URL).toString();

    // Get the signed URL for the blob
    const url = await getDownloadUrl(fullUrl);
    if (!url) {
      console.warn(`No URL found for blob key: ${key}`);
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
    const fullUrl = new URL(key, BLOB_BASE_URL).toString();
    await put(fullUrl, content, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
  } catch (error) {
    console.error(`Failed to store blob content for ${key}:`, error);
    throw error;
  }
}
