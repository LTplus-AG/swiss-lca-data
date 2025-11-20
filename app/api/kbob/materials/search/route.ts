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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.toLowerCase() || "";
    const language = (searchParams.get("language") || "de") as "de" | "fr";
    const version = searchParams.get("version");

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: "Search query is required",
          materials: [],
          count: 0,
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

    if (!materials || (Array.isArray(materials) && materials.length === 0)) {
      return NextResponse.json({
        success: true,
        version: dataVersion,
        materials: [],
        count: 0,
      });
    }

    // Search materials based on language preference
    const searchResults = materials.filter((material) => {
      const searchName =
        language === "fr"
          ? material.nameFR.toLowerCase()
          : material.nameDE.toLowerCase();
      return searchName.includes(query);
    });

    return NextResponse.json({
      success: true,
      version: dataVersion,
      materials: searchResults,
      count: searchResults.length,
      query,
      language,
    });
  } catch (error) {
    console.error("Error searching materials:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to search materials",
        materials: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
