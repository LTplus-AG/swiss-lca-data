import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { MATERIALS_KEY, getMaterialVersionKey, getBlobContent, KBOB_VERSIONS_KEY, KBOB_CURRENT_VERSION_KEY } from "../../lib/storage";

interface KBOBMaterial {
  uuid: string;
  nameDE: string;
  nameFR: string;
  density: string;
  densityMin: number | null;
  densityMax: number | null;
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
    const version = searchParams.get("version");

    if (uuids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one UUID is required",
        },
        { status: 400 }
      );
    }

    // Get materials based on version
    let materials: KBOBMaterial[] | null = null;
    let dataVersion = version || "current";

    if (version && version !== "current") {
      const blobContent = await getBlobContent(getMaterialVersionKey(version));
      if (blobContent) {
        try {
          materials = JSON.parse(blobContent);
        } catch (e) {
          console.error("Error parsing versioned materials:", e);
        }
      }
    } else {
      // If current, try to get the explicit version number
      const currentVersion = await kv.get<string>(KBOB_CURRENT_VERSION_KEY);
      if (currentVersion) {
        dataVersion = currentVersion;
      }

      materials = await kv.get<KBOBMaterial[]>(MATERIALS_KEY);
      
      // Fallback: If KV is empty, try to get 'current' from versions list
      if (!materials || (Array.isArray(materials) && materials.length === 0)) {
        const versions = await kv.get<any[]>(KBOB_VERSIONS_KEY);
        if (versions && versions.length > 0) {
          const sortedVersions = [...versions].sort((a, b) => {
            const dateA = new Date(a.date || 0).getTime();
            const dateB = new Date(b.date || 0).getTime();
            return dateB - dateA;
          });
          
          const latest = sortedVersions[0];
          if (latest) {
            dataVersion = latest.version;
            const blobContent = await getBlobContent(getMaterialVersionKey(latest.version));
            if (blobContent) {
              try {
                materials = JSON.parse(blobContent);
              } catch (e) {
                console.error("Error parsing fallback version:", e);
              }
            }
          }
        }
      }
    }

    if (!materials) {
      return NextResponse.json({
        success: true,
        version: dataVersion,
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
      version: dataVersion,
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
