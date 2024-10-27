import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { MATERIALS_KEY } from "../../lib/storage";

interface KBOBMaterial {
  uuid: string;
  unit: string;
}

export async function GET() {
  try {
    const materials = await kv.get<KBOBMaterial[]>(MATERIALS_KEY);

    if (!materials) {
      return NextResponse.json({
        success: true,
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
