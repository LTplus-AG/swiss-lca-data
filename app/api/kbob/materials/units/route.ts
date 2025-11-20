import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { MATERIALS_KEY, getMaterialVersionKey, getBlobContent, KBOB_VERSIONS_KEY, KBOB_CURRENT_VERSION_KEY } from "../../lib/storage";

interface KBOBMaterial {
  uuid: string;
  unit: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const version = searchParams.get("version");

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
        units: [],
        count: 0,
      });
    }

    // Extract unique units and count their usage
    const unitMap = materials.reduce((acc, material) => {
      if (!material.unit) return acc;

      if (!acc[material.unit]) {
        acc[material.unit] = { unit: material.unit, count: 1 };
      } else {
        acc[material.unit].count++;
      }
      return acc;
    }, {} as Record<string, { unit: string; count: number }>);

    const units = Object.values(unitMap).sort((a, b) =>
      a.unit.localeCompare(b.unit)
    );

    return NextResponse.json({
      success: true,
      version: dataVersion,
      units,
      count: units.length,
    });
  } catch (error) {
    console.error("Error fetching units:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch units",
        units: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
