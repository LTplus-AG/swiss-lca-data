import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { MATERIALS_KEY } from "../lib/storage";

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

    // Get random sample of 10 materials
    const sampleSize = 10;
    const sampledMaterials = getRandomSample(materials, sampleSize);

    return NextResponse.json({
      success: true,
      materials: sampledMaterials,
      count: sampledMaterials.length,
      totalMaterials: materials.length,
      note: "This endpoint returns a random sample of 10 materials. Use other endpoints for specific queries.",
    });
  } catch (error) {
    console.error("Error fetching materials:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch materials",
        materials: [],
        count: 0,
        totalMaterials: 0,
      },
      { status: 500 }
    );
  }
}
