import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { MATERIALS_KEY } from "../../lib/storage";

interface KBOBMaterial {
  uuid: string;
  nameDE: string;
  nameFR: string;
  ubp21Total: number | null;
  gwpTotal: number | null;
  biogenicCarbon: number | null;
}

interface Stats {
  min: number;
  max: number;
  avg: number;
  median: number;
  count: number;
  nonNullCount: number;
}

function calculateStats(values: (number | null)[]): Stats {
  const nonNullValues = values.filter((v): v is number => v !== null);
  const sortedValues = [...nonNullValues].sort((a, b) => a - b);

  const min = sortedValues[0] || 0;
  const max = sortedValues[sortedValues.length - 1] || 0;
  const avg =
    nonNullValues.reduce((sum, val) => sum + val, 0) / nonNullValues.length;
  const median =
    sortedValues.length % 2 === 0
      ? (sortedValues[sortedValues.length / 2 - 1] +
          sortedValues[sortedValues.length / 2]) /
        2
      : sortedValues[Math.floor(sortedValues.length / 2)];

  return {
    min,
    max,
    avg,
    median,
    count: values.length,
    nonNullCount: nonNullValues.length,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get("metric") || "ubp";

    const materials = await kv.get<KBOBMaterial[]>(MATERIALS_KEY);

    if (!materials) {
      return NextResponse.json({
        success: true,
        stats: null,
        count: 0,
      });
    }

    let values: (number | null)[] = [];
    switch (metric) {
      case "ubp":
        values = materials.map((m) => m.ubp21Total);
        break;
      case "gwp":
        values = materials.map((m) => m.gwpTotal);
        break;
      case "biogenic":
        values = materials.map((m) => m.biogenicCarbon);
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid metric specified",
          },
          { status: 400 }
        );
    }

    const stats = calculateStats(values);

    return NextResponse.json({
      success: true,
      metric,
      stats,
      unit: metric === "ubp" ? "UBP" : metric === "gwp" ? "kg CO₂ eq" : "kg C",
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
