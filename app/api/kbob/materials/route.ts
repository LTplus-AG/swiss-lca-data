import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import {
  MATERIALS_KEY,
  getMaterialVersionKey,
  getBlobContent,
  KBOB_VERSIONS_KEY,
  KBOB_CURRENT_VERSION_KEY
} from "../lib/storage";
import dotenv from "dotenv";
dotenv.config();

// Add helper function to attach CORS headers to a response
function addCorsHeaders(
  response: NextResponse,
  request: Request
): NextResponse {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : [];
  const origin = request.headers.get("origin");
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  } else {
    // Optionally, use a fallback or reject the request
    response.headers.set("Access-Control-Allow-Origin", "*");
  }
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return response;
}

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

interface KBOBMaterial {
  uuid: string;
  nameDE: string;
  nameFR: string;
  density: string;
  densityMin: number | null;
  densityMax: number | null;
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
  // Handle preflight OPTIONS request
  if (request.method === "OPTIONS") {
    return addCorsHeaders(NextResponse.json({}, { status: 200 }), request);
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const search = searchParams.get("search") || "";
    const pageSizeParam = searchParams.get("pageSize");
    const version = searchParams.get("version");

    // Handle 'all' page size or use default/max limits
    const pageSize =
      pageSizeParam === "all"
        ? Number.MAX_SAFE_INTEGER
        : Math.min(
          parseInt(pageSizeParam || String(DEFAULT_PAGE_SIZE), 10),
          MAX_PAGE_SIZE
        );

    // Get materials based on version
    let materials: KBOBMaterial[] | null = null;
    let dataVersion = version || "current";

    if (version && version !== "current") {
      const blobContent = await getBlobContent(getMaterialVersionKey(version));
      if (blobContent) {
        try {
          materials = JSON.parse(blobContent);
        } catch (e) {
          console.error("Error parsing versioned materials:", e);
        }
      }
    } else {
      // If current, try to get the explicit version number
      const currentVersion = await kv.get<string>(KBOB_CURRENT_VERSION_KEY);
      if (currentVersion) {
        dataVersion = currentVersion;
      }

      materials = await kv.get<KBOBMaterial[]>(MATERIALS_KEY);

      // Fallback: If KV is empty or null, try to get 'current' from versions list
      if (!materials || (Array.isArray(materials) && materials.length === 0)) {
        console.log("MATERIALS_KEY empty, checking versions list for fallback");
        const versions = await kv.get<any[]>(KBOB_VERSIONS_KEY);

        if (versions && versions.length > 0) {
          // Sort by date desc to find latest
          const sortedVersions = [...versions].sort((a, b) => {
            const dateA = new Date(a.date || 0).getTime();
            const dateB = new Date(b.date || 0).getTime();
            return dateB - dateA;
          });

          const latest = sortedVersions[0];
          if (latest) {
            console.log(`Falling back to latest version: ${latest.version}`);
            dataVersion = latest.version;
            const blobContent = await getBlobContent(getMaterialVersionKey(latest.version));
            if (blobContent) {
              try {
                materials = JSON.parse(blobContent);
              } catch (e) {
                console.error("Error parsing fallback version materials:", e);
              }
            }
          }
        }
      }
    }

    if (!materials) {
      return addCorsHeaders(
        NextResponse.json({
          success: true,
          version: dataVersion,
          materials: [],
          count: 0,
          totalMaterials: 0,
          totalPages: pageSizeParam === "all" ? 1 : 0,
          currentPage: 1,
          pageSize: pageSizeParam === "all" ? "all" : DEFAULT_PAGE_SIZE,
        }),
        request
      );
    }

    // Filter materials if search term is provided
    let filteredMaterials = materials;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredMaterials = materials.filter((material) =>
        Object.values(material).some((value) =>
          value?.toString().toLowerCase().includes(searchLower)
        )
      );
    }

    // Calculate pagination
    const totalMaterials = filteredMaterials.length;
    const totalPages =
      pageSizeParam === "all" ? 1 : Math.ceil(totalMaterials / pageSize);
    const startIndex = pageSizeParam === "all" ? 0 : (page - 1) * pageSize;
    const endIndex =
      pageSizeParam === "all" ? totalMaterials : startIndex + pageSize;
    const paginatedMaterials = filteredMaterials.slice(startIndex, endIndex);

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        version: dataVersion,
        materials: paginatedMaterials,
        count: paginatedMaterials.length,
        totalMaterials,
        totalPages,
        currentPage: pageSizeParam === "all" ? 1 : page,
        pageSize: pageSizeParam === "all" ? "all" : pageSize,
      }),
      request
    );
  } catch (error) {
    console.error("Error fetching materials:", error);
    return addCorsHeaders(
      NextResponse.json(
        {
          success: false,
          error: "Failed to fetch materials",
          materials: [],
          count: 0,
          totalMaterials: 0,
          totalPages: 0,
          currentPage: 1,
          pageSize: DEFAULT_PAGE_SIZE,
        },
        { status: 500 }
      ),
      request
    );
  }
}
