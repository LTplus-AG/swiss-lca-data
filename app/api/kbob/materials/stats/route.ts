import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { MATERIALS_KEY } from "../../lib/storage";

interface KBOBMaterial {
  [key: string]: any; // Allow any string key for dynamic metric access
  uuid: string;
  nameDE: string;
  nameFR: string;
  density?: string | null;
  unit?: string;
}

export async function GET(request: Request) {
  try {
    // Get the metric from query parameters
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get("metric");

    if (!metric) {
      return NextResponse.json(
        {
          success: false,
          error: "Metric parameter is required",
        },
        { status: 400 }
      );
    }

    // Get materials from KV store
    const materials = await kv.get<KBOBMaterial[]>(MATERIALS_KEY);

    if (!materials || !materials.length) {
      return NextResponse.json(
        {
          success: false,
          error: "No materials found",
        },
        { status: 404 }
      );
    }

    // Filter out materials where the metric value is null
    const validMaterials = materials.filter(
      (m) => m[metric] !== null && m[metric] !== undefined
    );

    if (validMaterials.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No data available for the specified metric",
        },
        { status: 404 }
      );
    }

    // Calculate statistics
    const values = validMaterials.map((m) => Number(m[metric]));
    const stats = {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      median: getMedian(values),
      count: materials.length,
      nonNullCount: validMaterials.length,
    };

    // Determine the unit based on the metric
    let unit = "unknown";
    if (metric.toLowerCase().includes("gwp")) {
      unit = "kg CO₂ eq";
    } else if (metric.toLowerCase().includes("ubp")) {
      unit = "UBP";
    } else if (metric.toLowerCase().includes("biogenic")) {
      unit = "kg C";
    }

    return NextResponse.json({
      success: true,
      metric,
      stats,
      unit,
    });
  } catch (error) {
    console.error("Error calculating statistics:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to calculate statistics",
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate median
function getMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}
