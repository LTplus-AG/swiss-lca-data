import { generateUsageReport } from "./usageReportService";

const ALERT_THRESHOLD = 10000; // Example threshold

export const checkForUnusualPatterns = async (customerId: string) => {
  const report = await generateUsageReport(
    customerId,
    new Date(Date.now() - 3600 * 1000),
    new Date()
  ); // Last hour
  if (report.totalRequests > ALERT_THRESHOLD) {
    // Send alert (e.g., email, log, etc.)
    console.log(
      `Alert: High usage detected for customer ${customerId}: ${report.totalRequests} requests.`
    );
  }
};
