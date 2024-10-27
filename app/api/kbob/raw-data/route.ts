import { NextResponse } from "next/server";
import { getRawMaterials } from "@/app/lib/kbob-service";

export async function GET() {
  try {
    const materials = await getRawMaterials();
    return NextResponse.json({ materials });
  } catch (error) {
    console.error("Failed to fetch raw materials:", error);
    return NextResponse.json(
      { error: "Failed to fetch raw materials" },
      { status: 500 }
    );
  }
}
