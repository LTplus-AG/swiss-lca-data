import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateApiKey } from "./app/middleware/apiKey";
import { rateLimiter } from "./app/middleware/rateLimit";

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === "development";

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  console.log('Middleware running for path:', request.nextUrl.pathname);

  // Only apply to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    console.log('Processing API route');
    
    // Apply rate limiting
    const rateLimitResponse = rateLimiter(request);
    if (rateLimitResponse.status === 429) {
      console.log('Rate limit exceeded');
      return rateLimitResponse;
    }

    // Skip API key validation for Slack interactive endpoint
    if (request.nextUrl.pathname === '/api/slack/interactive') {
      console.log('Skipping API key validation for Slack interactive endpoint');
      return NextResponse.next();
    }

    // Skip API key validation in development mode
    if (isDevelopment) {
      console.log('Development mode detected - skipping API key validation');
      return NextResponse.next();
    }

    // Validate API key
    const apiKeyResponse = validateApiKey(request);
    if (apiKeyResponse.status === 403) {
      console.log('API key validation failed');
      return apiKeyResponse;
    }

    console.log('API route processing completed');
    return apiKeyResponse;
  }

  return NextResponse.next();
}

// Configure middleware matching
export const config = {
  matcher: [
    '/api/:path*'
  ]
};
