#!/usr/bin/env node

/**
 * Test script for Slack interactive endpoint
 *
 * This script simulates a Slack interactive message payload
 * to test if your endpoint is working correctly.
 *
 * Usage:
 *   node scripts/test-slack-interactive.js [approve|reject]
 */

const axios = require("axios");
const FormData = require("form-data");

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_HOST || "http://localhost:3000";

// Ensure BASE_URL has a protocol
const FORMATTED_BASE_URL = BASE_URL.startsWith("http")
  ? BASE_URL
  : `http://${BASE_URL}`;

const INTERACTIVE_ENDPOINT = `${FORMATTED_BASE_URL}/api/slack/interactive`;

// Parse command line arguments
const args = process.argv.slice(2);
const action = args[0] || "approve";

if (!["approve", "reject"].includes(action)) {
  console.error(`Invalid action: ${action}. Must be 'approve' or 'reject'`);
  process.exit(1);
}

// Create a mock Slack payload
const createMockPayload = (action) => {
  const actionId =
    action === "approve"
      ? "test_approve_kbob_ingestion"
      : "test_reject_kbob_ingestion";

  return {
    type: "block_actions",
    user: {
      id: "U12345678",
      username: "test_user",
      name: "Test User",
    },
    api_app_id: "A12345678",
    token: "mock_token",
    container: {
      type: "message",
      message_ts: "1234567890.123456",
    },
    trigger_id: "12345.67890.abcdef",
    team: {
      id: "T12345678",
      domain: "test-workspace",
    },
    channel: {
      id: "C12345678",
      name: "test-channel",
    },
    message: {
      type: "message",
      text: "Test message",
      user: "U12345678",
      ts: "1234567890.123456",
    },
    actions: [
      {
        action_id: actionId,
        block_id: "test_block",
        text: {
          type: "plain_text",
          text: action === "approve" ? "Approve (Test)" : "Reject (Test)",
          emoji: true,
        },
        value: "test_version-123",
        type: "button",
        action_ts: "1234567890.123456",
      },
    ],
  };
};

async function testSlackInteractive() {
  try {
    console.log(
      `Testing Slack interactive endpoint with '${action}' action...`
    );
    console.log(`Endpoint: ${INTERACTIVE_ENDPOINT}`);

    // Create form data with payload
    const formData = new FormData();
    formData.append("payload", JSON.stringify(createMockPayload(action)));

    // Send request
    const response = await axios.post(INTERACTIVE_ENDPOINT, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log("\nResponse:");
    console.log(`Status: ${response.status}`);
    console.log("Data:", JSON.stringify(response.data, null, 2));

    if (response.status === 200) {
      console.log(
        "\n✅ Test successful! Your Slack interactive endpoint is working correctly."
      );
    } else {
      console.log(
        "\n⚠️ Test completed but received an unexpected status code."
      );
    }
  } catch (error) {
    console.error("\n❌ Error testing Slack interactive endpoint:");

    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      console.error("No response received. Is your server running?");
    } else {
      console.error("Error:", error.message);
    }

    console.log("\nTroubleshooting tips:");
    console.log("1. Make sure your Next.js server is running");
    console.log("2. Check that the /api/slack/interactive endpoint exists");
    console.log("3. Verify that your server can process POST requests");
    console.log(
      "4. If using ngrok, ensure your tunnel is active and the URL is correct"
    );

    process.exit(1);
  }
}

// Run the test
testSlackInteractive();
