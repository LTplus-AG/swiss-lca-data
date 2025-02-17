import { NextResponse } from "next/server";

const validApiKeys = process.env.API_KEYS?.split(",") || [];

export function validateApiKey(req: Request) { 
  // Check x-api-key header
  const apiKey = req.headers.get("x-api-key");
  
  // Check Authorization Bearer token
  const authHeader = req.headers.get("authorization");
  
  const bearerToken = authHeader?.startsWith("Bearer ") 
    ? authHeader.substring(7) // Remove "Bearer " prefix
    : null;
    
  // Validate either apiKey or bearerToken
  const isValidKey = (key: string | null) => key && validApiKeys.includes(key);
  
  if (!isValidKey(apiKey) && !isValidKey(bearerToken)) {
    console.log('Invalid API key, returning 403');
    return new NextResponse(
      JSON.stringify({ error: "Invalid API key" }),
      { 
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  console.log('Valid API key found, continuing...');
  return NextResponse.next();
}
