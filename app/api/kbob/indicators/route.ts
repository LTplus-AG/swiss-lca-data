import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { MATERIALS_KEY } from "../lib/storage";

interface Indicator {
  id: string;
  label: string;
  unit: string;
  description: string;
}

// Metadata for known indicators - will be used if found in data
const INDICATOR_METADATA: Record<string, Omit<Indicator, "id">> = {
  ubp21Total: {
    label: "UBP Total",
    unit: "UBP/unit",
    description:
      "Total environmental impact using the Swiss Eco-points method (2021). Includes both production and disposal phases.",
  },
  ubp21Production: {
    label: "UBP Production",
    unit: "UBP/unit",
    description:
      "Environmental impact of the production phase using Swiss Eco-points (2021). Includes raw material extraction and manufacturing.",
  },
  ubp21Disposal: {
    label: "UBP Disposal",
    unit: "UBP/unit",
    description:
      "Environmental impact of the disposal phase using Swiss Eco-points (2021). Includes end-of-life treatment and disposal processes.",
  },
  gwpTotal: {
    label: "GWP Total",
    unit: "kg CO₂ eq/unit",
    description:
      "Total Global Warming Potential over 100 years. Sum of emissions from both production and disposal phases.",
  },
  gwpProduction: {
    label: "GWP Production",
    unit: "kg CO₂ eq/unit",
    description:
      "Global Warming Potential from the production phase. Includes emissions from raw material extraction and manufacturing.",
  },
  gwpDisposal: {
    label: "GWP Disposal",
    unit: "kg CO₂ eq/unit",
    description:
      "Global Warming Potential from the disposal phase. Includes emissions from end-of-life treatment and disposal.",
  },
  biogenicCarbon: {
    label: "Biogenic Carbon",
    unit: "kg C/unit",
    description:
      "Amount of carbon stored in biological materials. Important for understanding carbon sequestration in bio-based materials.",
  },
  primaryEnergyTotal: {
    label: "Primary Energy Total",
    unit: "MJ/unit",
    description:
      "Total primary energy consumption throughout the lifecycle. Includes both renewable and non-renewable energy sources.",
  },
  primaryEnergyProduction: {
    label: "Primary Energy Production",
    unit: "MJ/unit",
    description:
      "Primary energy consumption during production phase. Includes energy for raw material extraction and manufacturing.",
  },
  primaryEnergyDisposal: {
    label: "Primary Energy Disposal",
    unit: "MJ/unit",
    description:
      "Primary energy consumption during disposal phase. Includes energy for end-of-life treatment and disposal processes.",
  },
};

export async function GET() {
  try {
    // Get materials from KV store
    const materials = await kv.get<Record<string, any>[]>(MATERIALS_KEY);

    if (!materials || !materials.length) {
      return NextResponse.json({
        success: true,
        indicators: [],
        count: 0,
      });
    }

    // Get first material to analyze structure
    const sampleMaterial = materials[0];

    // Get all numeric fields from the data
    const numericFields = Object.entries(sampleMaterial)
      .filter(([_, value]) => typeof value === "number" || value === null)
      .map(([key]) => key);

    // Get the material's unit for appending to indicator units
    const materialUnit = sampleMaterial.unit || "unit";

    // Create indicators from the fields
    const indicators = numericFields.map((id) => {
      // Use predefined metadata if available, otherwise create generic metadata
      const metadata = INDICATOR_METADATA[id] || {
        label: id
          .replace(/([A-Z])/g, " $1") // Add spaces before capital letters
          .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
          .trim(),
        unit: `per ${materialUnit}`,
        description: `${id} value measured per ${materialUnit} of material`,
      };

      // Replace 'unit' placeholder with actual unit if present
      const unit = metadata.unit.replace("unit", materialUnit);

      return {
        id,
        ...metadata,
        unit,
      };
    });

    return NextResponse.json({
      success: true,
      indicators,
      count: indicators.length,
    });
  } catch (error) {
    console.error("Error fetching indicators:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch indicators",
        indicators: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
