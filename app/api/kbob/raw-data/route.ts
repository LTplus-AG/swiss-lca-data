import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getBlobContent, MATERIALS_KEY } from "../lib/storage";

const ITEMS_PER_PAGE = 50;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";

  try {
    // Try to get materials from KV first
    let materials = await kv.get<Record<string, any>[]>(MATERIALS_KEY);

    // If not in KV, try to get from Blob storage
    if (!materials) {
      const materialsJson = await getBlobContent(MATERIALS_KEY);
      if (materialsJson) {
        materials = JSON.parse(materialsJson);
        // Cache in KV for future requests
        await kv.set(MATERIALS_KEY, materials);
      }
    }

    if (!materials || materials.length === 0) {
      return NextResponse.json({
        materials: {
          data: [],
          totalPages: 0,
          currentPage: 1,
          totalItems: 0,
        },
      });
    }

    // Filter materials based on search term
    const filteredMaterials = materials.filter((material) =>
      Object.values(material).some((value) =>
        value?.toString().toLowerCase().includes(search.toLowerCase())
      )
    );

    // Calculate pagination
    const totalItems = filteredMaterials.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedMaterials = filteredMaterials.slice(startIndex, endIndex);

    return NextResponse.json({
      materials: {
        data: paginatedMaterials,
        totalPages,
        currentPage: page,
        totalItems,
      },
    });
  } catch (error) {
    console.error("Failed to fetch raw materials:", error);
    return NextResponse.json(
      { error: "Failed to fetch raw materials" },
      { status: 500 }
    );
  }
}
