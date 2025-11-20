import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { MATERIALS_KEY, getMaterialVersionKey, getBlobContent, KBOB_VERSIONS_KEY, KBOB_CURRENT_VERSION_KEY } from "../../lib/storage";

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

// Helper function to get random items from array
function getRandomSample<T>(array: T[], size: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get("count") || "10", 10);
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

    if (!materials || (Array.isArray(materials) && materials.length === 0)) {
      return NextResponse.json({
        success: true,
        version: dataVersion,
        materials: [],
        count: 0,
        totalMaterials: 0,
      });
    }

    // Get random sample of materials
    const sampleSize = Math.min(count, materials.length);
    const sampledMaterials = getRandomSample(materials, sampleSize);

    return NextResponse.json({
      success: true,
      version: dataVersion,
      materials: sampledMaterials,
      count: sampledMaterials.length,
      totalMaterials: materials.length,
    });
  } catch (error) {
    console.error("Error fetching random materials:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch random materials",
        materials: [],
        count: 0,
        totalMaterials: 0,
      },
      { status: 500 }
    );
  }
}
