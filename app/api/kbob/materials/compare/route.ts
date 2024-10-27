import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { MATERIALS_KEY } from "../../lib/storage";

interface KBOBMaterial {
  uuid: string;
  nameDE: string;
  nameFR: string;
  density: string;
  unit: string;
  ubp21Total: number | null;
  ubp21Production: number | null;
  ubp21Disposal: number | null;
  gwpTotal: number | null;
  gwpProduction: number | null;
  gwpDisposal: number | null;
  biogenicCarbon: number | null;
}

// Helper to validate and map metric names
const VALID_METRICS = {
  ubp21Total: "UBP Total",
  ubp21Production: "UBP Production",
  ubp21Disposal: "UBP Disposal",
  gwpTotal: "GWP Total",
  gwpProduction: "GWP Production",
  gwpDisposal: "GWP Disposal",
  biogenicCarbon: "Biogenic Carbon",
} as const;

type ValidMetric = keyof typeof VALID_METRICS;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uuids = searchParams.get("uuids")?.split(",") || [];
    const requestedMetrics = searchParams.get("metrics")?.split(",") || [
      "ubp21Total",
      "gwpTotal",
    ];
    const language = (searchParams.get("language") || "de") as "de" | "fr";

    if (uuids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one UUID is required",
        },
        { status: 400 }
      );
    }

    const materials = await kv.get<KBOBMaterial[]>(MATERIALS_KEY);

    if (!materials) {
      return NextResponse.json({
        success: true,
        comparison: [],
        metrics: [],
      });
    }

    // Normalize UUIDs for comparison
    const normalizedUuids = uuids.map((uuid) =>
      uuid.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
    );

    // Filter and format materials for comparison
    const comparisonData = materials
      .filter((m) =>
        normalizedUuids.includes(
          m.uuid.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
        )
      )
      .map((m) => {
        // Filter metrics to only valid ones and create metrics object
        const validMetrics = requestedMetrics.filter(
          (metric): metric is ValidMetric => metric in VALID_METRICS
        );

        const metricsData = validMetrics.reduce((acc, metric) => {
          acc[metric] = {
            value: m[metric],
            label: VALID_METRICS[metric],
          };
          return acc;
        }, {} as Record<string, { value: number | null; label: string }>);

        return {
          uuid: m.uuid,
          name: language === "fr" ? m.nameFR : m.nameDE,
          unit: m.unit,
          metrics: metricsData,
        };
      });

    // Get the valid metrics that were actually used
    const validMetrics = requestedMetrics.filter(
      (metric) => metric in VALID_METRICS
    );

    return NextResponse.json({
      success: true,
      comparison: comparisonData,
      metrics: validMetrics,
      metricLabels: validMetrics.map((metric) => ({
        key: metric,
        label: VALID_METRICS[metric as ValidMetric],
      })),
      language,
      count: comparisonData.length,
    });
  } catch (error) {
    console.error("Error comparing materials:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to compare materials",
      },
      { status: 500 }
    );
  }
}
