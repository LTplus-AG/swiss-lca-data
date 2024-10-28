import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { MATERIALS_KEY } from "../../lib/storage";

interface MaterialField {
  label: string;
  value: string;
  example?: string | number | null;
}

export async function GET() {
  try {
    const materials = await kv.get<any[]>(MATERIALS_KEY);

    if (!materials || !materials.length) {
      return NextResponse.json({
        success: true,
        fields: [],
      });
    }

    // Get first material to extract field names and example values
    const sampleMaterial = materials[0];

    const fields: MaterialField[] = Object.entries(sampleMaterial)
      .filter(([key]) => !key.startsWith("_")) // Exclude internal fields
      .map(([key, value]) => ({
        label: key
          .replace(/([A-Z])/g, " $1") // Add spaces before capital letters
          .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
          .replace(/DE$/, " (DE)") // Special handling for language suffix
          .replace(/FR$/, " (FR)") // Special handling for language suffix
          .trim(),
        value: key,
        example: value as string | number | null,
      }));

    return NextResponse.json({
      success: true,
      fields,
    });
  } catch (error) {
    console.error("Error fetching material fields:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch material fields",
        fields: [],
      },
      { status: 500 }
    );
  }
}
