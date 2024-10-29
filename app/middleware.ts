import { clerkMiddleware } from "@clerk/nextjs/server";
import { middleware as corsMiddleware } from "./middleware/cors"; // Adjust the path as necessary
import { NextResponse, NextRequest } from "next/server";

export default async function middleware(req: NextRequest) {
  // Apply CORS middleware
  const corsResponse = corsMiddleware(req);
  if (corsResponse) return corsResponse;

  // Protect the admin console route
  const isAdminRoute = req.nextUrl.pathname.startsWith("/app-admin-console");
  if (isAdminRoute && !req.headers.get("Authorization")) {
    const url = new URL("/", req.url);
    return NextResponse.redirect(url);
  }

  return clerkMiddleware(req);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
