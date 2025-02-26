#!/usr/bin/env node

/**
 * Helper script to run the KBOB test flow with the API key from .env.development.local
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// Read the API key from .env.development.local
try {
  const envPath = path.resolve(process.cwd(), ".env.development.local");
  const envContent = fs.readFileSync(envPath, "utf8");

  // Extract API key
  const apiKeyMatch = envContent.match(/API_KEYS="([^"]+)"/);
  const apiKey = apiKeyMatch ? apiKeyMatch[1] : null;

  if (!apiKey) {
    console.error("API key not found in .env.development.local");
    process.exit(1);
  }

  console.log("API key found in .env.development.local");

  // Set environment variables
  process.env.NODE_ENV = "development";

  // Build the command arguments
  const args = ["scripts/test-kbob-flow.js"];

  // Add the step (detect, approve, reject)
  const step = process.argv[2] || "detect";
  args.push(step);

  // Add the API key
  args.push(`--api-key=${apiKey}`);

  // Add debug flag if specified
  if (process.argv.includes("--debug")) {
    args.push("--debug");
  }

  console.log(`Running: node ${args.join(" ")}`);

  // Run the test script with the API key
  const child = spawn("node", args, {
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "development" },
  });

  child.on("close", (code) => {
    process.exit(code);
  });
} catch (error) {
  console.error("Error reading .env.development.local:", error.message);
  process.exit(1);
}
