import { NextResponse } from "next/server";

const validApiKeys = process.env.API_KEYS?.split(",") || [];

export function validateApiKey(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || !validApiKeys.includes(apiKey)) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 403 });
  }
}
