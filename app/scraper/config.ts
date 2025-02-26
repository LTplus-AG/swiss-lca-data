export const config = {
  // Target URL
  baseUrl: "https://www.kbob.admin.ch/de/oekobilanzdaten-im-baubereich",

  // Rate limiting (in milliseconds)
  requestDelay: 2000, // Delay between HTTP requests
  downloadDelay: 3000, // Delay between file downloads

  // Download settings
  downloadPath: "./downloads",

  // Browser settings
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",

  // Retry settings
  maxRetries: 3,
  retryDelay: 5000,

  // Headers for respectful scraping
  headers: {
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    Connection: "keep-alive",
    Referer: "https://www.kbob.admin.ch/",
  },
};
