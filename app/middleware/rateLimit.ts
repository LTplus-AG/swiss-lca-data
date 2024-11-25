import { NextResponse } from "next/server";

// Simple in-memory store for rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Limit each IP/API key to 100 requests per window

export function rateLimiter(req: Request) {
  // Get identifier (IP address or API key)
  const apiKey = req.headers.get("x-api-key");
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  
  // Use API key as identifier if available, otherwise use IP
  const identifier = apiKey || bearerToken || req.headers.get("x-forwarded-for") || 'unknown';
  
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  
  // Clean up expired entries
  for (const [key, value] of rateLimit.entries()) {
    if (value.resetTime < now) {
      rateLimit.delete(key);
    }
  }
  
  // Get or create rate limit entry
  const currentLimit = rateLimit.get(identifier) || {
    count: 0,
    resetTime: now + WINDOW_MS
  };
  
  // Reset if window has expired
  if (currentLimit.resetTime < now) {
    currentLimit.count = 0;
    currentLimit.resetTime = now + WINDOW_MS;
  }
  
  currentLimit.count++;
  rateLimit.set(identifier, currentLimit);
  
  // Set rate limit headers
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', MAX_REQUESTS.toString());
  response.headers.set('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - currentLimit.count).toString());
  response.headers.set('X-RateLimit-Reset', currentLimit.resetTime.toString());
  
  // Check if rate limit exceeded
  if (currentLimit.count > MAX_REQUESTS) {
    return NextResponse.json(
      { error: "Too many requests, please try again later" },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': currentLimit.resetTime.toString(),
          'Retry-After': Math.ceil((currentLimit.resetTime - now) / 1000).toString()
        }
      }
    );
  }
  
  return response;
}
