import { NextResponse } from "next/server";
import { getMaterialsByGroup } from "@/lib/kbob-service";

export async function GET(
  request: Request,
  { params }: { params: { group: string } }
) {
  try {
    const materials = await getMaterialsByGroup(params.group);

    return NextResponse.json({
      success: true,
      materials,
      count: materials.length,
    });
  } catch (error) {
    console.error("Failed to fetch materials by group:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch materials by group",
        materials: [],
      },
      { status: 500 }
    );
  }
}
