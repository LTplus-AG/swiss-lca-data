import { NextResponse } from "next/server";
import axios from "axios";

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === "development";

export async function POST(request: Request) {
  try {
    // Parse the payload from Slack
    const formData = await request.formData();
    const payload = formData.get("payload");

    if (!payload || typeof payload !== "string") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const data = JSON.parse(payload);

    // Verify this is an interactive message
    if (data.type !== "block_actions") {
      return NextResponse.json(
        { error: "Unsupported interaction type" },
        { status: 400 }
      );
    }

    // Get the action
    const action = data.actions?.[0];
    if (!action) {
      return NextResponse.json({ error: "No action found" }, { status: 400 });
    }

    // Handle KBOB ingestion approval/rejection
    if (
      action.action_id === "approve_kbob_ingestion" ||
      action.action_id === "reject_kbob_ingestion"
    ) {
      const isApprove = action.action_id === "approve_kbob_ingestion";
      const version = action.value;

      // Call the approve-version API
      const baseUrl = process.env.NEXT_PUBLIC_HOST || "http://localhost:3000";

      // Ensure baseUrl has a protocol
      const formattedBaseUrl = baseUrl.startsWith("http")
        ? baseUrl
        : `http://${baseUrl}`;

      console.log(
        `Making request to: ${formattedBaseUrl}/api/kbob/approve-version`
      );

      try {
        const response = await axios.post(
          `${formattedBaseUrl}/api/kbob/approve-version`,
          {
            action: isApprove ? "approve" : "reject",
            version,
          }
        );

        // Acknowledge the interaction
        return NextResponse.json({
          text: `KBOB data version ${version} has been ${
            isApprove ? "approved" : "rejected"
          }.`,
          replace_original: true,
        });
      } catch (error) {
        console.error("Error calling approve-version API:", error.message);
        if (error.response) {
          console.error("Response status:", error.response.status);
          console.error("Response data:", error.response.data);
        }

        // Still acknowledge the interaction but with error message
        return NextResponse.json({
          text: `⚠️ Error: Could not ${
            isApprove ? "approve" : "reject"
          } KBOB data version ${version}. Please check server logs.`,
          replace_original: true,
        });
      }
    }

    // Handle TEST KBOB ingestion approval/rejection
    if (
      action.action_id === "test_approve_kbob_ingestion" ||
      action.action_id === "test_reject_kbob_ingestion"
    ) {
      const isApprove = action.action_id === "test_approve_kbob_ingestion";
      const version = action.value.replace("test_", "");

      // Call the test flow API
      const baseUrl = process.env.NEXT_PUBLIC_HOST || "http://localhost:3000";
      const step = isApprove ? "approve" : "reject";

      // Ensure baseUrl has a protocol
      const formattedBaseUrl = baseUrl.startsWith("http")
        ? baseUrl
        : `http://${baseUrl}`;

      // Prepare headers with API key if available
      const headers = {
        // Add a custom header to identify this as an internal request
        "X-Internal-Request": "slack-interactive",
        Referer: `${formattedBaseUrl}/api/slack/interactive`,
      };

      if (process.env.API_KEYS) {
        // Use the first API key from the list
        const apiKey = process.env.API_KEYS.split(",")[0];
        headers["Authorization"] = `Bearer ${apiKey}`;
        console.log("Using API key for test flow request");
      } else {
        console.log("No API key available for test flow request");
      }

      console.log(
        `Making request to: ${formattedBaseUrl}/api/kbob/test-flow?step=${step}`
      );

      try {
        const response = await axios.get(
          `${formattedBaseUrl}/api/kbob/test-flow?step=${step}`,
          { headers }
        );

        console.log("Test flow response:", response.status);

        // Acknowledge the interaction
        return NextResponse.json({
          text: `TEST: KBOB data version ${version} has been ${
            isApprove ? "approved" : "rejected"
          } (simulation only - no data was ingested).`,
          replace_original: true,
        });
      } catch (error) {
        console.error("Error calling test flow API:", error.message);
        if (error.response) {
          console.error("Response status:", error.response.status);
          console.error("Response data:", error.response.data);
        }

        // Still acknowledge the interaction but with error message
        return NextResponse.json({
          text: `⚠️ Error: Could not ${
            isApprove ? "approve" : "reject"
          } KBOB data version ${version}. Please check server logs.`,
          replace_original: true,
        });
      }
    }

    // Default response for unhandled actions
    return NextResponse.json({
      text: "Action received but not processed.",
    });
  } catch (error) {
    console.error("Error processing Slack interaction:", error);

    // Log more details about the error
    if (error.response) {
      console.error("Error response:", {
        status: error.response.status,
        data: error.response.data,
      });
    }

    return NextResponse.json(
      {
        error: "Failed to process interaction",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
