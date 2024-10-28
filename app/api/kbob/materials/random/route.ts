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

// Helper function to get random items from array
function getRandomSample<T>(array: T[], size: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get("count") || "10", 10);

    // Get all materials from KV store
    const materials = await kv.get<KBOBMaterial[]>(MATERIALS_KEY);

    if (!materials) {
      return NextResponse.json({
        success: true,
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
