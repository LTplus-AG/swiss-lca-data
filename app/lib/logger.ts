import { put, getDownloadUrl } from "@vercel/blob";

const LOGS_KEY = "api-logs/logs.txt"; // Define the blob key for logs

export async function logRequest(req: Request) {
  const logEntry = `${new Date().toISOString()} - ${req.method} ${req.url}\n`;

  try {
    // Fetch existing logs
    const existingLogs = (await getBlobContent(LOGS_KEY)) || "";
    const updatedLogs = existingLogs + logEntry;

    // Store updated logs back to blob storage
    await put(LOGS_KEY, updatedLogs, {
      access: "private" as any, // Cast to any to bypass type check
      contentType: "text/plain",
    });
  } catch (error) {
    console.error("Failed to log request:", error);
  }
}

async function getBlobContent(key: string): Promise<string | null> {
  try {
    const url = await getDownloadUrl(key);
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
