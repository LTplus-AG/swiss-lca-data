import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { middleware as corsMiddleware } from "./middleware/cors";
import { validateApiKey } from "./middleware/apiKey";
import { rateLimiter } from "./middleware/rateLimit";

// Define protected and public routes
const isApiRoute = createRouteMatcher(["/api/(.*)"]);
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/"]);

export default clerkMiddleware(async (auth, req) => {
  // Apply CORS middleware first
  const corsResponse = corsMiddleware(req);
  if (corsResponse) return corsResponse;

  // Handle API routes with API key authentication and rate limiting
  if (isApiRoute(req)) {
    // Apply rate limiting first
    const rateLimitResponse = rateLimiter(req);
    if (rateLimitResponse.status === 429) return rateLimitResponse;

    // Then check API key
    const apiKeyResponse = validateApiKey(req);
    if (apiKeyResponse.status === 403) return apiKeyResponse;
    
    return rateLimitResponse;
  }

  // Protect all routes except public ones
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
}, { debug: process.env.NODE_ENV === 'development' });

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/api/(.*)"
  ]
};
