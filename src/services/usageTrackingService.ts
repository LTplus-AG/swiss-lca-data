import { createClient } from "redis";

const redis = createClient({ url: process.env.REDIS_URL });
redis.connect().catch(console.error);

const planLimits = {
  basic: 1000,
  professional: 10000,
  enterprise: 50000,
};

export const trackUsageAgainstPlan = async (
  customerId: string,
  plan: string
) => {
  const currentUsage = (await redis.get(`usage:${customerId}`)) || 0;
  const limit = planLimits[plan];

  if (currentUsage >= limit) {
    // Handle limit exceeded (e.g., notify user, block requests, etc.)
    console.log(`Usage limit exceeded for customer ${customerId}.`);
  }
};
