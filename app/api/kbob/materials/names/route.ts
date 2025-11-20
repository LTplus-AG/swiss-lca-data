import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { MATERIALS_KEY, getMaterialVersionKey, getBlobContent, KBOB_VERSIONS_KEY, KBOB_CURRENT_VERSION_KEY } from "../../lib/storage";

interface KBOBMaterial {
  uuid: string;
  nameDE: string;
  nameFR: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const language = (searchParams.get("language") || "de") as "de" | "fr";
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
        names: [],
        count: 0,
      });
    }

    // Map to names based on selected language
    const names = materials
      .map((material) => ({
        uuid: material.uuid,
        name: language === "fr" ? material.nameFR : material.nameDE,
      }))
      .filter((item) => item.name && item.uuid); // Filter out any empty names or missing UUIDs

    return NextResponse.json({
      success: true,
      version: dataVersion,
      names: names.sort((a, b) => a.name.localeCompare(b.name)), // Sort alphabetically
      count: names.length,
    });
  } catch (error) {
    console.error("Error fetching material names:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch material names",
        names: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
