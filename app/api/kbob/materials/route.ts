import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { MATERIALS_KEY } from "../lib/storage";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

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
  primaryEnergyTotal: number | null;
  primaryEnergyProductionTotal: number | null;
  primaryEnergyProductionEnergetic: number | null;
  primaryEnergyProductionMaterial: number | null;
  primaryEnergyDisposal: number | null;
  primaryEnergyRenewableTotal: number | null;
  primaryEnergyRenewableProductionTotal: number | null;
  primaryEnergyRenewableProductionEnergetic: number | null;
  primaryEnergyRenewableProductionMaterial: number | null;
  primaryEnergyRenewableDisposal: number | null;
  primaryEnergyNonRenewableTotal: number | null;
  primaryEnergyNonRenewableProductionTotal: number | null;
  primaryEnergyNonRenewableProductionEnergetic: number | null;
  primaryEnergyNonRenewableProductionMaterial: number | null;
  primaryEnergyNonRenewableDisposal: number | null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const search = searchParams.get("search") || "";
    const pageSizeParam = searchParams.get("pageSize");
    
    // Handle 'all' page size or use default/max limits
    const pageSize = pageSizeParam === 'all' 
      ? Number.MAX_SAFE_INTEGER 
      : Math.min(
          parseInt(pageSizeParam || String(DEFAULT_PAGE_SIZE), 10),
          MAX_PAGE_SIZE
        );

    // Get all materials from KV store
    const materials = await kv.get<KBOBMaterial[]>(MATERIALS_KEY);

    if (!materials) {
      return NextResponse.json({
        success: true,
        materials: [],
        count: 0,
        totalMaterials: 0,
        totalPages: pageSizeParam === 'all' ? 1 : 0,
        currentPage: 1,
        pageSize: pageSizeParam === 'all' ? 'all' : DEFAULT_PAGE_SIZE
      });
    }

    // Filter materials if search term is provided
    let filteredMaterials = materials;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredMaterials = materials.filter(material =>
        Object.values(material).some(value =>
          value?.toString().toLowerCase().includes(searchLower)
        )
      );
    }

    // Calculate pagination
    const totalMaterials = filteredMaterials.length;
    const totalPages = pageSizeParam === 'all' ? 1 : Math.ceil(totalMaterials / pageSize);
    const startIndex = pageSizeParam === 'all' ? 0 : (page - 1) * pageSize;
    const endIndex = pageSizeParam === 'all' ? totalMaterials : startIndex + pageSize;
    const paginatedMaterials = filteredMaterials.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      materials: paginatedMaterials,
      count: paginatedMaterials.length,
      totalMaterials,
      totalPages,
      currentPage: pageSizeParam === 'all' ? 1 : page,
      pageSize: pageSizeParam === 'all' ? 'all' : pageSize
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
        totalPages: 0,
        currentPage: 1,
        pageSize: DEFAULT_PAGE_SIZE
      },
      { status: 500 }
    );
  }
}
