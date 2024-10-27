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

function normalizeUUID(uuid: string): string {
  // Remove any non-alphanumeric characters and convert to uppercase
  return uuid.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export async function GET(
  request: Request,
  { params }: { params: { uuid: string } }
) {
  try {
    // Get all materials from KV store
    const materials = await kv.get<KBOBMaterial[]>(MATERIALS_KEY);

    if (!materials) {
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
