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

function normalizeUUID(uuid: string): string {
  // Remove any non-alphanumeric characters and convert to uppercase
  return uuid.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export async function GET(
  request: Request,
  { params }: { params: { uuid: string } }
) {
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

    if (!materials || (Array.isArray(materials) && materials.length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: "No materials found",
        },
        { status: 404 }
      );
    }

    // Normalize the input UUID and the UUIDs in materials for comparison
    const normalizedInputUUID = normalizeUUID(params.uuid);

    // Find material by UUID (case-insensitive and format-insensitive)
    const material = materials.find(
      (m) => normalizeUUID(m.uuid) === normalizedInputUUID
    );

    if (!material) {
      console.log(`Material not found for UUID: ${params.uuid}`);
      console.log(`Normalized UUID: ${normalizedInputUUID}`);
      console.log("Available UUIDs:", materials.map((m) => m.uuid).join(", "));

      return NextResponse.json(
        {
          success: false,
          error: "Material not found",
          requestedUUID: params.uuid,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      version: dataVersion,
      material,
    });
  } catch (error) {
    console.error("Failed to fetch material:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch material",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
