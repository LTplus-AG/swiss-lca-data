"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Code, Copy, CheckCircle2, Key, ExternalLink } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// Define METRIC_OPTIONS before it's used in API_ENDPOINTS
const METRIC_OPTIONS = [
  { label: "UBP Total", value: "ubp21Total" },
  { label: "UBP Production", value: "ubp21Production" },
  { label: "UBP Disposal", value: "ubp21Disposal" },
  { label: "GWP Total", value: "gwpTotal" },
  { label: "GWP Production", value: "gwpProduction" },
  { label: "GWP Disposal", value: "gwpDisposal" },
  { label: "Biogenic Carbon", value: "biogenicCarbon" },
];

// Then define API_ENDPOINTS
const API_ENDPOINTS = [
  {
    name: "Get Random Materials",
    method: "GET",
    endpoint: "/api/kbob/materials/random",
    description: "Get a random sample of materials from the database.",
    params: [
      {
        name: "count",
        type: "random-number",
        description: "Number of random materials to return (1-10)",
        min: 1,
        max: 10,
      },
    ],
  },
  {
    name: "Search Materials",
    method: "GET",
    endpoint: "/api/kbob/materials/search",
    description: "Search materials by name in German or French",
    params: [
      {
        name: "query",
        type: "string",
        description: "Search query",
      },
      {
        name: "language",
        type: "select",
        description: "Language to search in",
        options: [
          { label: "German", value: "de" },
          { label: "French", value: "fr" },
        ],
      },
    ],
  },
  {
    name: "Get Material Names",
    method: "GET",
    endpoint: "/api/kbob/materials/names",
    description: "Get a list of all material names in German or French",
    params: [
      {
        name: "language",
        type: "select",
        description: "Language for material names",
        options: [
          { label: "German", value: "de" },
          { label: "French", value: "fr" },
        ],
      },
    ],
  },
  {
    name: "Get Material Details",
    method: "GET",
    endpoint: "/api/kbob/materials/{uuid}",
    description: "Get detailed information about a specific material",
    params: [{ name: "uuid", type: "string", description: "Material UUID" }],
  },
  {
    name: "Get Statistics",
    method: "GET",
    endpoint: "/api/kbob/materials/stats",
    description: "Get statistical information about the materials database",
    params: [
      {
        name: "metric",
        type: "select",
        description: "Statistical metric to analyze",
        options: [
          { label: "Environmental Impact (UBP)", value: "ubp" },
          { label: "Carbon Footprint (GWP)", value: "gwp" },
          { label: "Biogenic Carbon", value: "biogenic" },
        ],
      },
    ],
  },
  {
    name: "Get Available Units",
    method: "GET",
    endpoint: "/api/kbob/materials/units",
    description: "Get all available measurement units and their usage counts",
    params: [], // No parameters needed
  },
  {
    name: "Compare Materials",
    method: "GET",
    endpoint: "/api/kbob/materials/compare",
    description: "Compare multiple materials by their properties",
    params: [
      {
        name: "uuids",
        type: "string",
        description: "Comma-separated list of material UUIDs to compare",
      },
      {
        name: "metrics",
        type: "multiselect",
        description: "Metrics to compare between materials",
        options: METRIC_OPTIONS,
        defaultValue: "ubp21Total,gwpTotal",
      },
      {
        name: "language",
        type: "select",
        description: "Language for material names",
        options: [
          { label: "German", value: "de" },
          { label: "French", value: "fr" },
        ],
      },
    ],
  },
  {
    name: "Get Indicators",
    method: "GET",
    endpoint: "/api/kbob/indicators",
    description: "Get all available environmental impact indicators",
    params: [], // No parameters needed
  },
];

const API_PLANS = [
  { name: "Basic", requests: "500", price: "50.-" },
  { name: "Pro", requests: "10,000", price: "200.-" },
  { name: "Enterprise", requests: "Unlimited", price: "Get in touch" },
];

// Add more detailed response examples
const RESPONSE_EXAMPLES = {
  "Get All Materials": `{
  "success": true,
  "materials": [
    {
      "uuid": "21330D47-1D7A-36C8-7F0E-CB11F4CB2767",
      "nameDE": "2-Komponenten Klebstoff",
      "nameFR": "Colle à 2 composants",
      "density": "1500",
      "unit": "kg",
      "ubp21Total": 2140,
      "ubp21Production": 1890,
      "ubp21Disposal": 250,
      "gwpTotal": 4.32,
      "gwpProduction": 3.95,
      "gwpDisposal": 0.37,
      "biogenicCarbon": 0
    },
    {
      "uuid": "7B912F45-8D3E-4C2A-9B1D-FF5E82A47C39",
      "nameDE": "Beton C25/30",
      "nameFR": "Béton C25/30",
      "density": "2400",
      "unit": "kg/m³",
      "ubp21Total": 380,
      "ubp21Production": 320,
      "ubp21Disposal": 60,
      "gwpTotal": 250.5,
      "gwpProduction": 200.3,
      "gwpDisposal": 50.2,
      "biogenicCarbon": null
    }
    // ... more materials
  ],
  "count": 244,
  "totalMaterials": 244
}`,
  "Search Materials": `{
  "success": true,
  "materials": [
    {
      "uuid": "123e4567-e89b-12d3-a456-426614174000",
      "nameDE": "Beton",
      "nameFR": "Béton",
      "density": "2400",
      "unit": "kg/m3",
      "ubp21Total": 380,
      "gwpTotal": 250.5
      // ... other properties
    }
  ],
  "count": 1,
  "query": "beton",
  "language": "de"
}`,
  "Get Material Names": `{
  "success": true,
  "names": [
    { "uuid": "123e4567-e89b-12d3-a456-426614174000", "name": "Beton" },
    { "uuid": "987fcdeb-51a2-43d8-b789-012345678901", "name": "Holz" }
  ],
  "count": 2
}`,
  "Get Material Details": `{
  "success": true,
  "material": {
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "nameDE": "Beton",
    "nameFR": "Béton",
    "density": "2400",
    "unit": "kg/m3",
    "ubp21Total": 380,
    "ubp21Production": 320,
    "ubp21Disposal": 60,
    "gwpTotal": 250.5,
    "gwpProduction": 200.3,
    "gwpDisposal": 50.2,
    "biogenicCarbon": 0
  }
}`,
  "Get Statistics": `{
  "success": true,
  "metric": "gwp",
  "stats": {
    "min": 0.5,
    "max": 1250.3,
    "avg": 245.7,
    "median": 180.2,
    "count": 100,
    "nonNullCount": 95
  },
  "unit": "kg CO₂ eq"
}`,
  "Get Available Units": `{
  "success": true,
  "units": [
    { "unit": "kg/m3", "count": 25 },
    { "unit": "m2", "count": 12 }
  ],
  "count": 5
}`,
  "Compare Materials": `{
  "success": true,
  "comparison": [
    {
      "uuid": "123...",
      "name": "Material A",
      "unit": "kg/m3",
      "metrics": {
        "ubp21Total": 380,
        "gwpTotal": 250.5
      }
    }
  ],
  "metrics": ["ubp21Total", "gwpTotal"],
  "language": "de"
}`,
  "Get Random Materials": `{
  "success": true,
  "materials": [
    {
      "uuid": "21330D47-1D7A-36C8-7F0E-CB11F4CB2767",
      "nameDE": "2-Komponenten Klebstoff",
      "nameFR": "Colle à 2 composants",
      "density": "1500",
      "unit": "kg",
      "ubp21Total": 2140,
      "ubp21Production": 1890,
      "ubp21Disposal": 250,
      "gwpTotal": 4.32,
      "gwpProduction": 3.95,
      "gwpDisposal": 0.37,
      "biogenicCarbon": 0
    }
    // ... more random materials
  ],
  "count": 10,
  "totalMaterials": 244
}`,
  "Get Indicators": `{
  "success": true,
  "indicators": [
    {
      "id": "gwpTotal",
      "label": "GWP Total",
      "unit": "kg CO₂ eq",
      "description": "Total Global Warming Potential over 100 years",
      "group": "environmental"
    },
    // ... more indicators
  ],
  "count": 7
}`,
};

// Update DOCUMENTATION_SECTIONS to include all endpoints
const DOCUMENTATION_SECTIONS = {
  "Get All Materials": {
    overview:
      "Returns the complete list of materials from the KBOB database with all their properties and environmental impact data.",
    usage: `This endpoint provides access to the full KBOB materials database. 
    No parameters are required. Consider using pagination in your application 
    when displaying the results, as the response contains all materials (200+ entries).`,
    responseFields: [
      {
        name: "success",
        type: "boolean",
        description: "Operation status indicator",
      },
      {
        name: "materials",
        type: "array",
        description:
          "Array of material objects containing detailed information for each material",
      },
      {
        name: "materials[].uuid",
        type: "string",
        description: "Unique identifier for the material (format: UUID v4)",
      },
      {
        name: "materials[].nameDE",
        type: "string",
        description: "Material name in German",
      },
      {
        name: "materials[].nameFR",
        type: "string",
        description: "Material name in French",
      },
      {
        name: "materials[].density",
        type: "string",
        description:
          "Material density value. Can contain special formats like ranges (e.g., '20-25') or placeholder values ('-'). Not strictly numeric.",
      },
      {
        name: "materials[].unit",
        type: "string",
        description:
          "Measurement unit for the material (e.g., 'kg', 'kg/m³', 'm²')",
      },
      {
        name: "materials[].ubp21Total",
        type: "number | null",
        description:
          "Total environmental impact points (UBP 2021). Null if not applicable.",
      },
      {
        name: "materials[].ubp21Production",
        type: "number | null",
        description:
          "Production phase environmental impact points. Null if not available.",
      },
      {
        name: "materials[].ubp21Disposal",
        type: "number | null",
        description:
          "Disposal phase environmental impact points. Null if not available.",
      },
      {
        name: "materials[].gwpTotal",
        type: "number | null",
        description:
          "Total global warming potential in kg CO₂ eq. Null if not applicable.",
      },
      {
        name: "materials[].gwpProduction",
        type: "number | null",
        description:
          "Production phase global warming potential. Null if not available.",
      },
      {
        name: "materials[].gwpDisposal",
        type: "number | null",
        description:
          "Disposal phase global warming potential. Null if not available.",
      },
      {
        name: "materials[].biogenicCarbon",
        type: "number | null",
        description:
          "Biogenic carbon content in kg C. Null if not applicable or not measured.",
      },
      {
        name: "count",
        type: "number",
        description:
          "Number of materials in the response (same as materials.length)",
      },
      {
        name: "totalMaterials",
        type: "number",
        description: "Total number of materials available in the database",
      },
    ],
    notes: [
      "All materials are returned without pagination - implement client-side pagination for large datasets",
      "The density field is a string to accommodate ranges and special values",
      "All impact values (ubp21, gwp) can be null and should be handled accordingly",
      "Material names are provided in both German (DE) and French (FR)",
      "For testing or exploration, use the 'Get Random Materials' endpoint instead",
      "The response typically contains 200+ materials",
    ],
    dataTypes: {
      density: {
        type: "string",
        examples: ["1500", "20-25", "-", "x-y"],
        note: "Stored as string to handle ranges and special cases",
      },
      units: {
        type: "string",
        examples: ["kg", "kg/m³", "m²", "m"],
      },
      impacts: {
        type: "number | null",
        note: "All impact values (UBP, GWP) can be null if not applicable",
      },
    },
  },
  "Search Materials": {
    overview: "Search for materials by their name in either German or French.",
    usage:
      "Provide a search query and language preference to find matching materials. The search is case-insensitive and matches partial names.",
    responseFields: [
      { name: "success", type: "boolean", description: "Operation status" },
      {
        name: "materials",
        type: "array",
        description: "Array of matching materials",
      },
      { name: "count", type: "number", description: "Number of matches found" },
      { name: "query", type: "string", description: "The search query used" },
      {
        name: "language",
        type: "string",
        description: "Language used for search (de/fr)",
      },
    ],
  },
  "Get Material Names": {
    overview:
      "Get a list of all material names in either German or French, sorted alphabetically.",
    usage:
      "Select the desired language to get all material names in that language. Useful for building dropdown menus or autocomplete features.",
    responseFields: [
      { name: "success", type: "boolean", description: "Operation status" },
      {
        name: "names",
        type: "array",
        description: "Array of objects containing UUID and name",
      },
      {
        name: "count",
        type: "number",
        description: "Total number of materials",
      },
    ],
  },
  "Get Material Details": {
    overview:
      "Get detailed information about a specific material using its UUID.",
    usage:
      "Provide a valid material UUID to get all available data for that material. Use the 'Use Random UUID' button to test with valid UUIDs.",
    responseFields: [
      { name: "success", type: "boolean", description: "Operation status" },
      {
        name: "material",
        type: "object",
        description: "Complete material object with all properties",
      },
      {
        name: "material.uuid",
        type: "string",
        description: "Unique identifier",
      },
      { name: "material.nameDE", type: "string", description: "German name" },
      { name: "material.nameFR", type: "string", description: "French name" },
      {
        name: "material.density",
        type: "string",
        description: "Material density",
      },
      {
        name: "material.unit",
        type: "string",
        description: "Measurement unit",
      },
      {
        name: "material.ubp21Total",
        type: "number",
        description: "Total UBP impact",
      },
      {
        name: "material.gwpTotal",
        type: "number",
        description: "Total GWP impact",
      },
    ],
  },
  "Get Statistics": {
    overview:
      "Get statistical information about environmental impact metrics across all materials.",
    usage:
      "Select a metric (UBP, GWP, or Biogenic Carbon) to get statistical analysis including min, max, average, and median values.",
    responseFields: [
      { name: "success", type: "boolean", description: "Operation status" },
      {
        name: "metric",
        type: "string",
        description: "Selected metric (ubp/gwp/biogenic)",
      },
      {
        name: "stats",
        type: "object",
        description: "Statistical calculations",
      },
      { name: "stats.min", type: "number", description: "Minimum value" },
      { name: "stats.max", type: "number", description: "Maximum value" },
      { name: "stats.avg", type: "number", description: "Average value" },
      { name: "stats.median", type: "number", description: "Median value" },
      {
        name: "stats.count",
        type: "number",
        description: "Total number of materials",
      },
      {
        name: "stats.nonNullCount",
        type: "number",
        description: "Number of materials with non-null values",
      },
      {
        name: "unit",
        type: "string",
        description: "Unit of measurement for the values",
      },
    ],
  },
  "Get Available Units": {
    overview:
      "Get a list of all measurement units used in the database with their usage counts.",
    usage:
      "No parameters required. Returns all unique units and how many materials use each unit.",
    responseFields: [
      { name: "success", type: "boolean", description: "Operation status" },
      { name: "units", type: "array", description: "Array of unit objects" },
      {
        name: "units[].unit",
        type: "string",
        description: "Unit name (e.g., kg/m3)",
      },
      {
        name: "units[].count",
        type: "number",
        description: "Number of materials using this unit",
      },
      {
        name: "count",
        type: "number",
        description: "Total number of unique units",
      },
    ],
  },
  "Compare Materials": {
    overview:
      "Compare multiple materials by their environmental impact metrics.",
    usage:
      "Provide two or more UUIDs and select which metrics to compare. Use the 'Use Random UUID' button to get valid UUIDs for testing.",
    responseFields: [
      { name: "success", type: "boolean", description: "Operation status" },
      {
        name: "comparison",
        type: "array",
        description: "Array of compared materials",
      },
      {
        name: "comparison[].uuid",
        type: "string",
        description: "Material UUID",
      },
      {
        name: "comparison[].name",
        type: "string",
        description: "Material name in selected language",
      },
      {
        name: "comparison[].unit",
        type: "string",
        description: "Measurement unit",
      },
      {
        name: "comparison[].metrics",
        type: "object",
        description: "Selected metrics with values and labels",
      },
      {
        name: "metrics",
        type: "array",
        description: "List of compared metric keys",
      },
      {
        name: "metricLabels",
        type: "array",
        description: "Human-readable labels for metrics",
      },
      {
        name: "language",
        type: "string",
        description: "Selected language (de/fr)",
      },
      {
        name: "count",
        type: "number",
        description: "Number of materials compared",
      },
    ],
  },
  "Get Random Materials": {
    overview: "Returns a random sample of materials from the KBOB database.",
    usage:
      "Optionally specify the number of random materials to return using the 'count' parameter. Default is 10 materials.",
    responseFields: [
      { name: "success", type: "boolean", description: "Operation status" },
      {
        name: "materials",
        type: "array",
        description: "Array of randomly selected materials",
      },
      {
        name: "count",
        type: "number",
        description: "Number of materials returned",
      },
      {
        name: "totalMaterials",
        type: "number",
        description: "Total number of materials in database",
      },
    ],
  },
  "Get Indicators": {
    overview:
      "Returns all available environmental impact indicators with their metadata.",
    usage:
      "Use this endpoint to get information about available indicators for material impact assessment. Includes units, descriptions, and grouping.",
    responseFields: [
      {
        name: "success",
        type: "boolean",
        description: "Operation status",
      },
      {
        name: "indicators",
        type: "array",
        description: "Array of indicator objects",
      },
      {
        name: "indicators[].id",
        type: "string",
        description: "Unique identifier for the indicator (e.g., 'gwpTotal')",
      },
      {
        name: "indicators[].label",
        type: "string",
        description: "Human-readable name of the indicator (e.g., 'GWP Total')",
      },
      {
        name: "indicators[].unit",
        type: "string",
        description: "Unit of measurement (e.g., 'kg CO₂ eq', 'UBP')",
      },
      {
        name: "indicators[].description",
        type: "string",
        description: "Detailed description of what the indicator measures",
      },
      {
        name: "indicators[].group",
        type: "string",
        description:
          "Category of the indicator ('environmental', 'economic', 'social')",
      },
      {
        name: "count",
        type: "number",
        description: "Total number of available indicators",
      },
    ],
    notes: [
      "All indicators are currently in the 'environmental' group",
      "Units are provided in their proper scientific notation (e.g., CO₂ with subscript)",
      "Indicators include both total values and phase-specific values (production/disposal)",
      "Each indicator has a unique ID that can be used in other API endpoints",
    ],
  },
};

export default function ApiAccessPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(API_ENDPOINTS[0]);
  const [params, setParams] = useState<Record<string, string>>({});
  const [response, setResponse] = useState("");
  const [copied, setCopied] = useState(false);
  const [showApiPlanModal, setShowApiPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [materials, setMaterials] = useState<
    Array<{ uuid: string; name: string }>
  >([]);
  const [apiCallStatus, setApiCallStatus] = useState<{
    status: "idle" | "success" | "error";
    message?: string;
  }>({ status: "idle" });

  // Add useEffect to set initial random count
  useEffect(() => {
    // Only set initial count if it's not already set
    if (!params.count) {
      const initialCount = Math.floor(Math.random() * 10) + 1;
      setParams((prev) => ({ ...prev, count: initialCount.toString() }));
    }
  }, []); // Empty dependency array means this runs once after mount

  const handleEndpointChange = (value: string) => {
    const endpoint = API_ENDPOINTS.find((e) => e.name === value);
    if (endpoint) {
      setSelectedEndpoint(endpoint);
      setParams({});
      setApiCallStatus({ status: "idle" }); // Reset status when changing endpoints
      setResponse(""); // Also clear the response
    }
  };

  const handleParamChange = (name: string, value: string) => {
    setParams((prev) => ({ ...prev, [name]: value }));
  };

  const handleCopyCode = () => {
    const code = generateCode();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateCode = () => {
    const url = selectedEndpoint.endpoint.replace(
      /{(\w+)}/g,
      (_, p) => params[p] || `{${p}}`
    );

    const queryParams = selectedEndpoint.params
      .filter((p) => !url.includes(`{${p.name}}`) && params[p.name])
      .map((p) => `${p.name}=${encodeURIComponent(params[p.name])}`)
      .join("&");

    const fullUrl = `\${baseUrl}${url}${queryParams ? `?${queryParams}` : ""}`;

    return `// Replace baseUrl with your API base URL
const baseUrl = "https://your-api-domain.com";

fetch('${fullUrl}', {
  method: '${selectedEndpoint.method}',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`;
  };

  const handleTryApi = async () => {
    try {
      setApiCallStatus({ status: "idle" });
      setResponse("Loading...");

      // Build the URL with parameters
      const url = selectedEndpoint.endpoint.replace(
        /{(\w+)}/g,
        (_, p) => params[p] || `{${p}}`
      );

      const queryParams = selectedEndpoint.params
        .filter((p) => !url.includes(`{${p.name}}`) && params[p.name])
        .map((p) => `${p.name}=${encodeURIComponent(params[p.name])}`)
        .join("&");

      const fullUrl = `${window.location.origin}${url}${
        queryParams ? `?${queryParams}` : ""
      }`;

      const response = await fetch(fullUrl, {
        method: selectedEndpoint.method,
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      setResponse(JSON.stringify(data, null, 2));
      setApiCallStatus({
        status: "success",
        message: "✓ Response updated below",
      });

      // Modified scrolling behavior
      setTimeout(() => {
        const responseElement = document.getElementById("api-response");
        if (responseElement) {
          const yOffset = -20; // Add a small offset from the top
          const y =
            responseElement.getBoundingClientRect().top +
            window.pageYOffset +
            yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }, 100);
    } catch (error) {
      setResponse(
        JSON.stringify(
          { error: "API call failed", details: (error as Error).message },
          null,
          2
        )
      );
      setApiCallStatus({
        status: "error",
        message: "API call failed. Check the response below for details.",
      });
    }
  };

  const handleGetApiAccess = () => {
    // In a real application, you would implement the logic to process the API plan request
    console.log(`Requested API plan: ${selectedPlan}`);
    setShowApiPlanModal(false);
  };

  // Update the fetchRandomUUID function to get multiple unique UUIDs
  const fetchRandomUUIDs = async (count: number = 2) => {
    try {
      const response = await fetch("/api/kbob/materials");
      const data = await response.json();
      if (data.success && data.materials.length >= count) {
        // Get 'count' number of different materials
        const randomMaterials = data.materials
          .sort(() => 0.5 - Math.random()) // Shuffle array
          .slice(0, count) // Take first 'count' items
          .map(
            (material: { uuid: string; nameDE?: string; nameFR?: string }) => ({
              uuid: material.uuid,
              name: material.nameDE || material.nameFR,
            })
          );
        return randomMaterials;
      }
    } catch (error) {
      console.error("Failed to fetch random UUIDs:", error);
    }
    return null;
  };

  // Update the handleUseRandomUUID function
  const handleUseRandomUUID = async (paramName: string) => {
    if (paramName === "uuids") {
      // For compare endpoint, get two different UUIDs
      const materials = await fetchRandomUUIDs(2);
      if (materials) {
        const uuids = materials.map((m: { uuid: string }) => m.uuid).join(",");
        handleParamChange(paramName, uuids);
        setResponse(
          `Using UUIDs from: ${materials
            .map((m: { name: string }) => m.name)
            .join(" and ")}`
        );
      }
    } else {
      // For single UUID endpoints
      const materials = await fetchRandomUUIDs(1);
      if (materials && materials[0]) {
        handleParamChange(paramName, materials[0].uuid);
        setResponse(`Using UUID from: ${materials[0].name}`);
      }
    }
  };

  // Add helper function to generate random count
  const generateRandomCount = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  // Update the parameter input rendering to include the random UUID button
  const renderParamInput = (param: any) => {
    if (param.type === "select" && param.options) {
      return (
        <Select
          value={params[param.name] || ""}
          onValueChange={(value) => handleParamChange(param.name, value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Select ${param.name}`} />
          </SelectTrigger>
          <SelectContent>
            {param.options.map((option: { label: string; value: string }) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Add special handling for UUID parameters
    if (param.name === "uuid" || param.name === "uuids") {
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              id={param.name}
              placeholder={`Enter ${param.name}`}
              value={params[param.name] || ""}
              onChange={(e) => handleParamChange(param.name, e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => handleUseRandomUUID(param.name)}
              type="button"
            >
              Use Random UUID
            </Button>
          </div>
        </div>
      );
    }

    if (param.type === "multiselect" && param.options) {
      const selectedValues = (
        params[param.name] ||
        param.defaultValue ||
        ""
      ).split(",");

      return (
        <Select
          value={selectedValues.join(",")}
          onValueChange={(value) => {
            // If value is empty, use default value
            const newValue = value || param.defaultValue || "";
            handleParamChange(param.name, newValue);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Select ${param.name}`}>
              {selectedValues
                .map(
                  (
                    v: string // Explicitly define 'v' as a string
                  ) =>
                    param.options.find(
                      (opt: { label: string; value: string }) => opt.value === v
                    )?.label
                )
                .join(", ")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {param.options.map((option: { label: string; value: string }) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Update the renderParamInput function for the random-number type
    if (param.type === "random-number") {
      return (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 p-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:rotate-12 flex-shrink-0"
              onClick={() => {
                const randomCount = generateRandomCount(param.min, param.max);
                handleParamChange(param.name, randomCount.toString());
                // Add a small animation to the input
                const input = document.getElementById(param.name);
                if (input) {
                  input.classList.add("scale-105");
                  setTimeout(() => input.classList.remove("scale-105"), 150);
                }
              }}
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                <path d="M8.5 8.5v0" />
                <path d="M15.5 15.5v0" />
                <path d="M12 12v0" />
              </svg>
            </Button>
            <div className="relative w-20">
              <Input
                id={param.name}
                value={params[param.name] || ""}
                readOnly
                placeholder="-"
                className="pl-6 text-center text-lg font-mono bg-muted"
              />
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                #
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground flex items-center justify-between px-1">
            <span>Min: {param.min}</span>
            <span>Max: {param.max}</span>
          </div>
        </div>
      );
    }

    return (
      <Input
        id={param.name}
        placeholder={`Enter ${param.name}`}
        value={params[param.name] || ""}
        onChange={(e) => handleParamChange(param.name, e.target.value)}
      />
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">API Access</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Get API Access</CardTitle>
          <CardDescription>
            Choose a plan to access our API and integrate KBOB data into your
            applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Our API provides programmatic access to the KBOB database, allowing
            you to integrate sustainable building material data directly into
            your applications.
          </p>
          <Button onClick={() => setShowApiPlanModal(true)}>
            <Key className="mr-2 h-4 w-4" />
            View API Plans
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Documentation & Playground</CardTitle>
          <CardDescription>Explore and test our API endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="playground" className="space-y-4">
            <TabsList>
              <TabsTrigger value="playground">Playground</TabsTrigger>
              <TabsTrigger value="documentation">Documentation</TabsTrigger>
            </TabsList>
            <TabsContent value="playground" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="endpoint">Select Endpoint</Label>
                <Select
                  onValueChange={handleEndpointChange}
                  defaultValue={selectedEndpoint.name}
                >
                  <SelectTrigger id="endpoint">
                    <SelectValue placeholder="Select an endpoint" />
                  </SelectTrigger>
                  <SelectContent>
                    {API_ENDPOINTS.map((endpoint) => (
                      <SelectItem key={endpoint.name} value={endpoint.name}>
                        {endpoint.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEndpoint.params.map((param) => (
                <div key={param.name} className="space-y-2">
                  <Label htmlFor={param.name}>{param.name}</Label>
                  {renderParamInput(param)}
                  {param.description && (
                    <p className="text-sm text-muted-foreground">
                      {param.description}
                    </p>
                  )}
                </div>
              ))}

              <div className="flex items-center gap-2">
                <Button onClick={handleTryApi} className="mb-4">
                  Try it out
                </Button>
                {apiCallStatus.status !== "idle" && (
                  <div
                    className={cn(
                      "text-sm px-3 py-1 rounded-md transition-all opacity-80",
                      apiCallStatus.status === "success"
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                    )}
                  >
                    {apiCallStatus.status === "success"
                      ? "✓ Response updated below"
                      : "× API call failed"}
                  </div>
                )}
              </div>

              <div className="relative">
                <pre className="bg-secondary p-4 rounded-md overflow-x-auto">
                  <code className="text-sm">{generateCode()}</code>
                </pre>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={handleCopyCode}
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {response && (
                <div id="api-response" className="relative mt-8 border-t pt-4">
                  <div className="absolute -top-3 left-0 bg-background px-2 text-sm text-muted-foreground">
                    Response
                  </div>
                  <pre className="bg-secondary p-4 rounded-md overflow-x-auto">
                    <code className="text-sm">{response}</code>
                  </pre>
                </div>
              )}
            </TabsContent>
            <TabsContent value="documentation">
              <Accordion type="single" collapsible className="w-full">
                {/* Add Get All Materials as first item */}
                <AccordionItem value="item-get-all">
                  <AccordionTrigger>
                    <div className="flex items-center space-x-2">
                      <Code className="h-4 w-4" />
                      <span>Get All Materials</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-2">Overview</h4>
                        <p className="text-muted-foreground">
                          {DOCUMENTATION_SECTIONS["Get All Materials"].overview}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Endpoint</h4>
                        <div className="bg-secondary p-3 rounded-md flex items-center space-x-2">
                          <span className="text-sm font-mono text-green-600">
                            GET
                          </span>
                          <code className="text-sm">/api/kbob/materials</code>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Response Fields</h4>
                        <div className="border rounded-md divide-y">
                          {DOCUMENTATION_SECTIONS[
                            "Get All Materials"
                          ].responseFields.map((field) => (
                            <div key={field.name} className="p-2">
                              <div className="flex items-center space-x-2">
                                <code className="text-sm bg-secondary px-1 rounded">
                                  {field.name}
                                </code>
                                <span className="text-xs text-muted-foreground">
                                  {field.type}
                                </span>
                              </div>
                              <p className="text-sm mt-1 text-muted-foreground">
                                {field.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Example Response</h4>
                        <div className="relative">
                          <pre className="bg-secondary p-4 rounded-md overflow-x-auto">
                            <code className="text-sm">
                              {RESPONSE_EXAMPLES["Get All Materials"]}
                            </code>
                          </pre>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Data Types</h4>
                        <div className="space-y-4">
                          {Object.entries(
                            DOCUMENTATION_SECTIONS["Get All Materials"]
                              .dataTypes
                          ).map(([key, value]) => (
                            <div key={key} className="border rounded-md p-3">
                              <h5 className="font-medium mb-2">{key}</h5>
                              {value.examples &&
                                "examples" in value &&
                                "note" in value && ( // Ensure both 'examples' and 'note' exist
                                  <div className="bg-secondary/50 p-2 rounded-sm text-sm">
                                    Examples:{" "}
                                    {Array.isArray(value.examples) &&
                                      value.examples
                                        .map((ex) => `"${ex}"`)
                                        .join(", ")}
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Notes</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          {DOCUMENTATION_SECTIONS[
                            "Get All Materials"
                          ].notes.map((note, index) => (
                            <li key={index}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Rest of the endpoints */}
                {API_ENDPOINTS.map((endpoint, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger>
                      <div className="flex items-center space-x-2">
                        <Code className="h-4 w-4" />
                        <span>{endpoint.name}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-semibold mb-2">Overview</h4>
                          <p className="text-muted-foreground">
                            {DOCUMENTATION_SECTIONS[
                              endpoint.name as keyof typeof DOCUMENTATION_SECTIONS
                            ]?.overview || endpoint.description}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Endpoint</h4>
                          <div className="bg-secondary p-3 rounded-md flex items-center space-x-2">
                            <span className="text-sm font-mono text-green-600">
                              {endpoint.method}
                            </span>
                            <code className="text-sm">{endpoint.endpoint}</code>
                          </div>
                        </div>

                        {endpoint.params.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Parameters</h4>
                            <div className="border rounded-md divide-y">
                              {endpoint.params.map((param) => (
                                <div key={param.name} className="p-3">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <code className="bg-secondary px-2 py-0.5 rounded text-sm">
                                      {param.name}
                                    </code>
                                    <span className="text-sm text-muted-foreground">
                                      ({param.type})
                                    </span>
                                    {param.required && (
                                      <span className="text-xs text-red-500">
                                        Required
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    {param.description}
                                  </p>
                                  {param.options && (
                                    <div className="text-xs bg-secondary/50 p-2 rounded-sm">
                                      Valid values:{" "}
                                      {param.options
                                        .map((o) => `"${o.value}"`)
                                        .join(", ")}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <h4 className="font-semibold mb-2">
                            Example Response
                          </h4>
                          <div className="relative">
                            <pre className="bg-secondary p-4 rounded-md overflow-x-auto">
                              <code className="text-sm">
                                {
                                  RESPONSE_EXAMPLES[
                                    endpoint.name as keyof typeof RESPONSE_EXAMPLES
                                  ]
                                }
                              </code>
                            </pre>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">
                            Response Fields
                          </h4>
                          <div className="border rounded-md divide-y">
                            {DOCUMENTATION_SECTIONS[
                              endpoint.name as keyof typeof DOCUMENTATION_SECTIONS
                            ]?.responseFields.map((field) => (
                              <div key={field.name} className="p-2">
                                <div className="flex items-center space-x-2">
                                  <code className="text-sm bg-secondary px-1 rounded">
                                    {field.name}
                                  </code>
                                  <span className="text-xs text-muted-foreground">
                                    {field.type}
                                  </span>
                                </div>
                                <p className="text-sm mt-1 text-muted-foreground">
                                  {field.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {DOCUMENTATION_SECTIONS[
                          endpoint.name as keyof typeof DOCUMENTATION_SECTIONS
                        ]?.usage && (
                          <div>
                            <h4 className="font-semibold mb-2">Usage Notes</h4>
                            <p className="text-sm text-muted-foreground">
                              {
                                DOCUMENTATION_SECTIONS[
                                  endpoint.name as keyof typeof DOCUMENTATION_SECTIONS
                                ].usage
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showApiPlanModal} onOpenChange={setShowApiPlanModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose an API Plan</DialogTitle>
            <DialogDescription>
              Select a plan that suits your needs. Each plan offers different
              levels of access and request limits.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
              {API_PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className="flex items-center space-x-2 mb-2"
                >
                  <RadioGroupItem value={plan.name} id={plan.name} />
                  <Label htmlFor={plan.name}>
                    <span className="font-semibold">{plan.name}</span> -{" "}
                    {plan.requests} requests per month: {plan.price}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button onClick={handleGetApiAccess} disabled={!selectedPlan}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Request Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
