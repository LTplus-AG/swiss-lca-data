import { NextResponse } from "next/server";

export function middleware(req: Request) {
  const res = NextResponse.next();

  // Allow requests from any origin for API routes
  const isApiRoute = new URL(req.url).pathname.startsWith("/api");
  if (isApiRoute) {
    // Allow all origins for API routes
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
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
