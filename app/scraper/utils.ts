import fs from "fs-extra";
import path from "path";
import { config } from "./config";

/**
 * Sleep for a specified duration
 * @param ms - Time to sleep in milliseconds
 * @returns Promise that resolves after the specified time
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Ensure the download directory exists
 * @returns Promise that resolves when the directory is created
 */
export const ensureDownloadDir = async (): Promise<void> => {
  await fs.ensureDir(config.downloadPath);
};

/**
 * Format filename to be safe for file systems
 * @param filename - Original filename
 * @returns Safe filename
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "_")
    .trim();
};

/**
 * Extract file version from filename or text
 * @param text - Text containing version information
 * @returns Extracted version or empty string
 */
export const extractVersion = (text: string): string => {
  const versionMatch =
    text.match(/Version\s+(\d+(\.\d+)*)/i) || text.match(/(\d{4}\/\d+:\d{4})/);
  return versionMatch ? versionMatch[1] : "";
};

/**
 * Parse date string from the website
 * @param dateStr - Date string from the website
 * @returns Formatted date (YYYY-MM-DD)
 */
export const parseDate = (dateStr: string): string => {
  if (!dateStr) return "";

  try {
    // Format: "31. Juli 2012" or "3. Dezember 2024"
    const monthMap: Record<string, string> = {
      Januar: "01",
      Februar: "02",
      März: "03",
      April: "04",
      Mai: "05",
      Juni: "06",
      Juli: "07",
      August: "08",
      September: "09",
      Oktober: "10",
      November: "11",
      Dezember: "12",
    };

    const parts = dateStr.trim().split(" ");
    if (parts.length !== 3) return dateStr;

    const day = parts[0].replace(".", "").padStart(2, "0");
    const month = monthMap[parts[1]] || "01";
    const year = parts[2];

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error parsing date:", dateStr);
    return dateStr;
  }
};

/**
 * Write metadata to a JSON file
 * @param metadata - Array of metadata objects
 * @returns Promise that resolves when the file is written
 */
export const writeMetadata = async (metadata: any[]): Promise<void> => {
  const metadataPath = path.join(config.downloadPath, "metadata.json");
  await fs.writeJson(metadataPath, metadata, { spaces: 2 });
};

/**
 * Check if a URL is an Excel file
 * @param url - URL to check
 * @returns True if URL points to an Excel file
 */
export const isExcelUrl = (url: string): boolean => {
  return url && (url.endsWith(".xlsx") || url.endsWith(".xls"));
};

/**
 * Create a filename with version info
 * @param originalFilename - Original filename
 * @param version - Version string
 * @param date - Date string
 * @returns Filename with version info
 */
export const createVersionedFilename = (
  originalFilename: string,
  version: string,
  date: string
): string => {
  const extension = path.extname(originalFilename);
  const basename = path.basename(originalFilename, extension);
  const versionStr = version ? `_${version.replace(/[/\\:]/g, "-")}` : "";
  const dateStr = date ? `_${date}` : "";

  return sanitizeFilename(`${basename}${versionStr}${dateStr}${extension}`);
};
