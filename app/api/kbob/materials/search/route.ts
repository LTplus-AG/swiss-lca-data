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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.toLowerCase() || "";
    const language = (searchParams.get("language") || "de") as "de" | "fr";

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

    // Get materials from KV store
    const materials = await kv.get<KBOBMaterial[]>(MATERIALS_KEY);

    if (!materials) {
      return NextResponse.json({
        success: true,
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
