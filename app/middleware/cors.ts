import { NextResponse } from "next/server";

export function middleware(req: Request) {
  const res = NextResponse.next();

  // Allow requests from any origin for API routes
  const isApiRoute = new URL(req.url).pathname.startsWith("/api");
  if (isApiRoute) {
    const origin = req.headers.get("Origin");
    // If there's an Origin header, set it as allowed, otherwise allow all
    if (origin) {
      res.headers.set("Access-Control-Allow-Origin", origin);
    } else {
      res.headers.set("Access-Control-Allow-Origin", "*");
    }

    // Add Vary header to handle multiple origins correctly
    res.headers.set("Vary", "Origin");

    res.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Accept"
    );
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Access-Control-Max-Age", "86400"); // 24 hours
  } else {
    // For non-API routes, allow from our domains
    const allowedOrigins = [
      "https://www.lcadata.ch",
      "https://swiss-lca-data-nrkwwzd7c-louistrues-projects.vercel.app",
    ];
    const origin = req.headers.get("Origin");
    if (origin && allowedOrigins.includes(origin)) {
      res.headers.set("Access-Control-Allow-Origin", origin);
      res.headers.set("Vary", "Origin");
    }
  }

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: res.headers,
    });
  }

  return res;
}
