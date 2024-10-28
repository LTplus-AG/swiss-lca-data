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

    return NextResponse.json({
      success: true,
      materials,
      count: materials.length,
      totalMaterials: materials.length,
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
