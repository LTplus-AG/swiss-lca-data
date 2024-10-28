import { createClient } from "redis";

const redis = createClient({ url: process.env.REDIS_URL });
redis.connect().catch(console.error);

export const generateUsageReport = async (
  customerId: string,
  startDate: Date,
  endDate: Date
) => {
  const usage = await redis.xRange(
    "api_usage_logs",
    startDate.getTime().toString(),
    endDate.getTime().toString()
  );

  // Filter usage by customerId
  const filteredUsage = usage.filter(
    (entry) => entry.customerId === customerId
  );

  // Aggregate data
  const report = {
    totalRequests: filteredUsage.length,
    endpoints: {},
  };

  filteredUsage.forEach((entry) => {
    const endpoint = entry.endpoint;
    if (!report.endpoints[endpoint]) {
      report.endpoints[endpoint] = 0;
    }
    report.endpoints[endpoint]++;
  });

  return report;
};
