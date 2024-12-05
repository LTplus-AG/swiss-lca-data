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
    unit: "UBP'21/unit",
    description:
      "Total environmental impact of production and disposal according to the ecological scarcity method 2021 (UBP'21). Based on Swiss environmental policy.",
  },
  ubp21Production: {
    label: "UBP Production",
    unit: "UBP'21/unit",
    description:
      "Environmental impact of the production phase according to UBP'21. Includes resource consumption and emissions during raw material extraction, processing, and manufacturing phases.",
  },
  ubp21Disposal: {
    label: "UBP Disposal",
    unit: "UBP'21/unit",
    description:
      "Environmental impact of the disposal phase according to UBP'21. Quantifies impacts from waste treatment, recycling processes and final disposal.",
  },
  gwpTotal: {
    label: "GWP Total",
    unit: "kg CO₂ eq/unit",
    description:
      "Total greenhouse gas emissions from production and disposal phases based on IPCC AR5 (2013). Biogenic carbon is considered separately.",
  },
  gwpProduction: {
    label: "GWP Production",
    unit: "kg CO₂ eq/unit",
    description:
      "Greenhouse gas emissions from production phase according to IPCC AR5 (2013). Includes emissions from raw material extraction and manufacturing.",
  },
  gwpDisposal: {
    label: "GWP Disposal",
    unit: "kg CO₂ eq/unit",
    description:
      "Greenhouse gas emissions from disposal phase according to IPCC AR5 (2013). Includes emissions from waste treatment and disposal processes.",
  },
  biogenicCarbon: {
    label: "Biogenic Carbon",
    unit: "kg C/unit",
    description:
      "Carbon content stored in bio-based building materials (e.g., wood, straw) according to EN 15804:2012+A2:2019. Quantifies carbon in renewable materials.",
  },
  primaryEnergyTotal: {
    label: "Primary Energy Total",
    unit: "kWh oil-eq/unit",
    description:
      "Total cumulative energy demand, sum of renewable and non-renewable primary energy.",
  },
  primaryEnergyProductionTotal: {
    label: "Primary Energy Production Total",
    unit: "kWh oil-eq/unit",
    description:
      "Total cumulative energy demand during production, including both material and energetic use.",
  },
  primaryEnergyProductionEnergetic: {
    label: "Primary Energy Production Energetic",
    unit: "kWh oil-eq/unit",
    description:
      "Primary energy used as energy source during production phase.",
  },
  primaryEnergyProductionMaterial: {
    label: "Primary Energy Production Material",
    unit: "kWh oil-eq/unit",
    description:
      "Primary energy embodied in materials during production phase.",
  },
  primaryEnergyDisposal: {
    label: "Primary Energy Disposal",
    unit: "kWh oil-eq/unit",
    description:
      "Cumulative energy demand during disposal phase.",
  },
  primaryEnergyRenewableTotal: {
    label: "Primary Energy Renewable Total",
    unit: "kWh oil-eq/unit",
    description:
      "Total renewable primary energy from hydropower, biomass (excl. primary forest clearing), solar, wind, geothermal, and ambient heat sources.",
  },
  primaryEnergyRenewableProductionTotal: {
    label: "Primary Energy Renewable Production Total",
    unit: "kWh oil-eq/unit",
    description:
      "Renewable primary energy consumption during production phase, including energetic and material use.",
  },
  primaryEnergyRenewableProductionEnergetic: {
    label: "Primary Energy Renewable Production Energetic",
    unit: "kWh oil-eq/unit",
    description:
      "Renewable primary energy used as energy source during production.",
  },
  primaryEnergyRenewableProductionMaterial: {
    label: "Primary Energy Renewable Production Material",
    unit: "kWh oil-eq/unit",
    description:
      "Renewable primary energy embodied in materials during production.",
  },
  primaryEnergyRenewableDisposal: {
    label: "Primary Energy Renewable Disposal",
    unit: "kWh oil-eq/unit",
    description:
      "Renewable primary energy consumption during disposal phase.",
  },
  primaryEnergyNonRenewableTotal: {
    label: "Primary Energy Non-Renewable Total",
    unit: "kWh oil-eq/unit",
    description:
      "Total non-renewable primary energy (grey energy) from fossil and nuclear sources, including wood from primary forest clearing.",
  },
  primaryEnergyNonRenewableProductionTotal: {
    label: "Primary Energy Non-Renewable Production Total",
    unit: "kWh oil-eq/unit",
    description:
      "Non-renewable primary energy consumption during production, including energetic and material use.",
  },
  primaryEnergyNonRenewableProductionEnergetic: {
    label: "Primary Energy Non-Renewable Production Energetic",
    unit: "kWh oil-eq/unit",
    description:
      "Non-renewable primary energy used as energy source during production.",
  },
  primaryEnergyNonRenewableProductionMaterial: {
    label: "Primary Energy Non-Renewable Production Material",
    unit: "kWh oil-eq/unit",
    description:
      "Non-renewable primary energy embodied in materials during production.",
  },
  primaryEnergyNonRenewableDisposal: {
    label: "Primary Energy Non-Renewable Disposal",
    unit: "kWh oil-eq/unit",
    description:
      "Non-renewable primary energy consumption during disposal phase.",
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
