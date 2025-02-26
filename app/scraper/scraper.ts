import puppeteer from "puppeteer";
import fs from "fs-extra";
import path from "path";
import axios from "axios";
import { config } from "./config";
import {
  sleep,
  ensureDownloadDir,
  extractVersion,
  parseDate,
  writeMetadata,
  isExcelUrl,
  createVersionedFilename,
} from "./utils";

// Define types for the scraper
interface ScraperOptions {
  currentOnly?: boolean;
  [key: string]: any;
}

interface FileMetadata {
  url: string;
  title: string;
  version: string;
  fileSize: string;
  publishDate: string;
  filename: string;
  [key: string]: any;
}

interface ScraperResult {
  metadata: FileMetadata[];
  downloads: {
    path: string;
    metadata: FileMetadata;
  }[];
}

/**
 * Class that handles scraping and downloading Excel files from KBOB website
 */
export class KbobScraper {
  private options: ScraperOptions;
  private metadata: FileMetadata[];
  private browser: puppeteer.Browser | null;
  private page: puppeteer.Page | null;

  constructor(options: ScraperOptions = {}) {
    this.options = {
      currentOnly: options.currentOnly || false,
      ...options,
    };

    this.metadata = [];
    this.browser = null;
    this.page = null;
  }

  /**
   * Initialize browser and set up download directory
   */
  async initialize(): Promise<void> {
    console.log("Initializing scraper...");

    await ensureDownloadDir();

    this.browser = await puppeteer.launch({
      headless: true, // Use true instead of "new"
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    this.page = await this.browser.newPage();

    // Set user agent and viewport
    await this.page.setUserAgent(config.userAgent);
    await this.page.setViewport({ width: 1366, height: 768 });

    // Set extra HTTP headers
    await this.page.setExtraHTTPHeaders(config.headers);

    console.log("Scraper initialized");
  }

  /**
   * Close browser and clean up resources
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    console.log("Scraper closed");
  }

  /**
   * Extract metadata from file element
   * @param fileElement - File element from page
   * @returns Metadata object
   */
  async extractFileMetadata(fileElement: any): Promise<FileMetadata | null> {
    const metadata: Partial<FileMetadata> = {};

    try {
      if (!this.page) return null;

      // Extract link and title
      const linkElement = await fileElement.$("a");

      if (!linkElement) return null;

      const href = await this.page.evaluate((el: any) => el.href, linkElement);
      const title = await this.page.evaluate(
        (el: any) => el.textContent.trim(),
        linkElement
      );

      if (!isExcelUrl(href)) return null;

      metadata.url = href;
      metadata.title = title;

      // Get parent container for additional info
      const container = await fileElement.$("xpath/..");
      if (!container) return null;

      const containerText = await this.page.evaluate(
        (el: any) => el.textContent.trim(),
        container
      );

      // Extract version from title or container text
      metadata.version = extractVersion(title) || extractVersion(containerText);

      // Extract file size (usually follows the title with format like "XLSX596.00 kB")
      const fileSizeMatch = containerText.match(/XLSX(\d+\.\d+)\s*kB/);
      metadata.fileSize = fileSizeMatch ? `${fileSizeMatch[1]} kB` : "";

      // Extract date (usually the last element after file size like "3. Dezember 2024")
      const dateMatch = containerText.match(/(\d+\.\s+\w+\s+\d{4})$/);
      metadata.publishDate = dateMatch ? parseDate(dateMatch[1]) : "";

      // Extract filename from URL
      const urlParts = href.split("/");
      metadata.filename = urlParts[urlParts.length - 1];

      return metadata as FileMetadata;
    } catch (error) {
      console.error("Error extracting metadata:", error);
      return null;
    }
  }

  /**
   * Expand all collapsible sections on the page
   */
  async expandAllCollapsedSections(): Promise<void> {
    if (!this.page) return;

    console.log("Expanding all collapsed sections...");

    try {
      // Look for any collapsed sections
      const collapsedSections = await this.page.$$("details:not([open])");

      if (collapsedSections.length === 0) {
        console.log("No collapsed sections found");
        return;
      }

      console.log(
        `Found ${collapsedSections.length} collapsed sections, expanding...`
      );

      // Click on each collapsed section to expand it
      for (const section of collapsedSections) {
        await section.click();
        await sleep(500); // Small delay between clicks
      }

      // Verify all sections are expanded
      const stillCollapsed = await this.page.$$("details:not([open])");
      if (stillCollapsed.length > 0) {
        console.log(
          `${stillCollapsed.length} sections still collapsed, retrying...`
        );
        await this.expandAllCollapsedSections();
      } else {
        console.log("All sections expanded successfully");
      }
    } catch (error) {
      console.error("Error expanding collapsed sections:", error);
    }
  }

  /**
   * Download a file from a URL
   * @param fileMetadata - File metadata object
   * @returns True if download was successful
   */
  async downloadFile(fileMetadata: FileMetadata): Promise<boolean> {
    const { url, filename, version, publishDate } = fileMetadata;

    try {
      console.log(`Downloading file: ${filename}`);

      // Create versioned filename
      const versionedFilename = createVersionedFilename(
        filename,
        version,
        publishDate
      );

      const filePath = path.join(config.downloadPath, versionedFilename);

      // Check if file already exists
      if (await fs.pathExists(filePath)) {
        console.log(`File already exists: ${versionedFilename}`);
        return true;
      }

      // Download file with axios
      const response = await axios({
        method: "GET",
        url: url,
        responseType: "stream",
        headers: config.headers,
      });

      // Save file
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on("finish", () => {
          console.log(`File downloaded: ${versionedFilename}`);
          resolve(true);
        });
        writer.on("error", (err) => {
          console.error(`Error downloading file: ${versionedFilename}`, err);
          reject(false);
        });
      });
    } catch (error) {
      console.error(`Error downloading file: ${filename}`, error);
      return false;
    }
  }

  /**
   * Find all Excel file links on the page
   * @returns Array of file elements
   */
  async findExcelFileLinks(): Promise<any[]> {
    if (!this.page) return [];

    // Look for file links that are Excel files
    const fileLinks = await this.page.$$('a[href$=".xlsx"], a[href$=".xls"]');
    console.log(`Found ${fileLinks.length} Excel file links`);
    return fileLinks;
  }

  /**
   * Process file links and extract metadata
   * @param fileLinks - Array of file elements
   * @returns Array of metadata objects
   */
  async processFileLinks(fileLinks: any[]): Promise<FileMetadata[]> {
    const metadata: FileMetadata[] = [];

    for (const link of fileLinks) {
      await sleep(config.requestDelay);

      const fileElement = await link.$("xpath/..");
      if (!fileElement) continue;

      const fileMetadata = await this.extractFileMetadata(fileElement);
      if (fileMetadata) {
        metadata.push(fileMetadata);
      }
    }

    return metadata;
  }

  /**
   * Download all files based on metadata
   * @param metadata - Array of metadata objects
   */
  async downloadAllFiles(metadata: FileMetadata[]): Promise<void> {
    console.log(`Preparing to download ${metadata.length} files...`);

    const downloads: { path: string; metadata: FileMetadata }[] = [];

    for (const fileMetadata of metadata) {
      await sleep(config.downloadDelay);
      const success = await this.downloadFile(fileMetadata);

      if (success) {
        // Create versioned filename
        const versionedFilename = createVersionedFilename(
          fileMetadata.filename,
          fileMetadata.version,
          fileMetadata.publishDate
        );

        const filePath = path.join(config.downloadPath, versionedFilename);
        downloads.push({ path: filePath, metadata: fileMetadata });
      }
    }

    console.log("All files downloaded successfully");

    // Store downloads for later use
    this._downloads = downloads;
  }

  // Private property to store downloads
  private _downloads: { path: string; metadata: FileMetadata }[] = [];

  /**
   * Filter metadata based on options
   * @param metadata - Array of metadata objects
   * @returns Filtered metadata
   */
  filterMetadata(metadata: FileMetadata[]): FileMetadata[] {
    if (!this.options.currentOnly) {
      return metadata;
    }

    // Filter to keep only the latest version of each file
    const latestVersions: Record<string, FileMetadata> = {};

    for (const item of metadata) {
      const baseTitle = item.title.replace(/Version\s+\d+(\.\d+)*/, "").trim();

      if (
        !latestVersions[baseTitle] ||
        new Date(item.publishDate) >
          new Date(latestVersions[baseTitle].publishDate)
      ) {
        latestVersions[baseTitle] = item;
      }
    }

    return Object.values(latestVersions);
  }

  /**
   * Main scraping function
   */
  async scrape(): Promise<ScraperResult> {
    try {
      if (!this.browser) {
        await this.initialize();
      }

      if (!this.page) {
        throw new Error("Page not initialized");
      }

      console.log(`Navigating to ${config.baseUrl}`);
      await this.page.goto(config.baseUrl, { waitUntil: "networkidle2" });

      console.log("Page loaded successfully");

      // Wait for content to load
      await this.page.waitForSelector("a", { timeout: 10000 });

      // Expand all collapsed sections
      await this.expandAllCollapsedSections();

      // Find all Excel file links
      const fileLinks = await this.findExcelFileLinks();

      // Process file links and extract metadata
      this.metadata = await this.processFileLinks(fileLinks);

      // Filter metadata based on options
      const filteredMetadata = this.filterMetadata(this.metadata);
      console.log(`Found ${filteredMetadata.length} files to download`);

      // Download all files
      await this.downloadAllFiles(filteredMetadata);

      // Write metadata to file
      await writeMetadata(filteredMetadata);

      console.log("Scraping completed successfully");

      return {
        metadata: filteredMetadata,
        downloads: this._downloads,
      };
    } catch (error) {
      console.error("Error during scraping:", error);
      return {
        metadata: [],
        downloads: [],
      };
    } finally {
      await this.close();
    }
  }
}
