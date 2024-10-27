import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { MATERIALS_KEY } from "../../lib/storage";

interface KBOBMaterial {
  uuid: string;
  nameDE: string;
  nameFR: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const language = (searchParams.get("language") || "de") as "de" | "fr";

    // Get materials from KV store
    const materials = await kv.get<KBOBMaterial[]>(MATERIALS_KEY);

    if (!materials) {
      return NextResponse.json({
        success: true,
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
