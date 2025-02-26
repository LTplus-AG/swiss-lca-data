#!/usr/bin/env node

/**
 * KBOB Test Flow CLI
 *
 * This script allows you to test the KBOB data ingestion flow from the command line.
 * It includes the full flow with Slack notifications and approval/rejection simulation.
 *
 * Usage:
 *   node scripts/test-kbob-flow.js [step] [--api-key=YOUR_API_KEY] [--debug]
 *
 * Steps:
 *   detect (default) - Run the detection step to find new KBOB data
 *   approve - Simulate approval of the pending version
 *   reject - Simulate rejection of the pending version
 *
 * Example:
 *   node scripts/test-kbob-flow.js detect
 *   node scripts/test-kbob-flow.js approve
 */

const axios = require("axios");

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_HOST || "http://localhost:3000";
const API_KEY = process.env.API_KEY || "";

// Parse command line arguments
const args = process.argv.slice(2);
const step = args[0] || "detect";
let apiKey = API_KEY;
let debug = false;

// Check for API key and debug flag in arguments
args.forEach((arg) => {
  if (arg.startsWith("--api-key=")) {
    apiKey = arg.split("=")[1];
  }
  if (arg === "--debug") {
    debug = true;
  }
});

// Validate step
if (!["detect", "approve", "reject"].includes(step)) {
  console.error(
    `Invalid step: ${step}. Must be one of: detect, approve, reject`
  );
  process.exit(1);
}

async function runTest() {
  try {
    console.log(`Running KBOB test flow - Step: ${step}`);

    // Prepare headers with API key if provided
    const headers = {};
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
      console.log("Using provided API key for authentication");
    } else {
      console.log(
        "No API key provided. This will work in development mode only."
      );
    }

    // Make the request
    const url = `${BASE_URL}/api/kbob/test-flow?step=${step}`;
    console.log(`Making request to: ${url}`);

    // Add debug flag to see more information
    if (debug) {
      console.log("Debug mode enabled - showing full request details");
      axios.interceptors.request.use((request) => {
        console.log("Request:", {
          method: request.method,
          url: request.url,
          headers: request.headers,
          data: request.data,
        });
        return request;
      });

      axios.interceptors.response.use(
        (response) => {
          console.log("Response:", {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data,
          });
          return response;
        },
        (error) => {
          console.log("Error response:", {
            status: error.response?.status,
            statusText: error.response?.statusText,
            headers: error.response?.headers,
            data: error.response?.data,
          });
          return Promise.reject(error);
        }
      );
    }

    const response = await axios.get(url, { headers });

    // Print the result
    console.log("\nResult:");
    console.log(JSON.stringify(response.data, null, 2));

    // Provide next steps
    if (step === "detect" && response.data.success) {
      console.log("\nNext steps:");
      console.log(`1. Check Slack for the test notification`);
      console.log(
        `2. Run 'node scripts/test-kbob-flow.js approve' to simulate approval`
      );
      console.log(
        `3. Run 'node scripts/test-kbob-flow.js reject' to simulate rejection`
      );
    }
  } catch (error) {
    console.error("Error running test:");

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`Status: ${error.response.status}`);
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received from server. Is the server running?");
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error:", error.message);
    }

    process.exit(1);
  }
}

// Run the test
runTest();
