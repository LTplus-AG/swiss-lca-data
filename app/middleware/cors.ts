import { NextResponse } from "next/server";

export function middleware(req: Request) {
  const res = NextResponse.next();

  // Set CORS headers
  const allowedOrigin = "https://www.lcadata.ch"; // Change to your production domain
  const origin = req.headers.get("Origin");

  if (origin === allowedOrigin) {
    res.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  }

  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS"
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: res.headers,
    });
  }

  return res;
}
