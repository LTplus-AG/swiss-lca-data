"use client";

import { useState } from "react";
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
    name: "Sample Materials",
    method: "GET",
    endpoint: "/api/kbob/materials",
    description:
      "Get a random sample of 10 materials. Useful for testing and exploration.",
    params: [], // No parameters needed
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
];

const API_PLANS = [
  { name: "Basic", requests: "500", price: "50.-" },
  { name: "Pro", requests: "10,000", price: "200.-" },
  { name: "Enterprise", requests: "Unlimited", price: "Get in touch" },
];

// Add more detailed response examples
const RESPONSE_EXAMPLES = {
  "Sample Materials": `{
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
    // ... 9 more materials
  ],
  "count": 10,
  "totalMaterials": 42,
  "note": "This endpoint returns a random sample of 10 materials"
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
};

// Update DOCUMENTATION_SECTIONS to include all endpoints
const DOCUMENTATION_SECTIONS = {
  "Sample Materials": {
    overview:
      "Returns a random selection of 10 materials from the database. This endpoint is useful for exploring the data structure and testing integrations.",
    usage:
      "No parameters required. Each call returns a different random selection.",
    responseFields: [
      { name: "success", type: "boolean", description: "Operation status" },
      {
        name: "materials",
        type: "array",
        description: "Array of 10 random material objects",
      },
      {
        name: "count",
        type: "number",
        description: "Number of materials returned (always 10)",
      },
      {
        name: "totalMaterials",
        type: "number",
        description: "Total number of materials in database",
      },
      {
        name: "note",
        type: "string",
        description: "Informational message about the endpoint",
      },
    ],
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

  const handleEndpointChange = (value: string) => {
    const endpoint = API_ENDPOINTS.find((e) => e.name === value);
    if (endpoint) {
      setSelectedEndpoint(endpoint);
      setParams({});
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
          // Add API key header when authentication is implemented
          // "Authorization": "Bearer YOUR_API_KEY",
        },
      });

      const data = await response.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse(
        JSON.stringify(
          { error: "API call failed", details: error.message },
          null,
          2
        )
      );
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
          .map((material) => ({
            uuid: material.uuid,
            name: material.nameDE || material.nameFR,
          }));
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
        const uuids = materials.map((m) => m.uuid).join(",");
        handleParamChange(paramName, uuids);
        setResponse(
          `Using UUIDs from: ${materials.map((m) => m.name).join(" and ")}`
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
                .map((v) => param.options.find((opt) => opt.value === v)?.label)
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

              <Button onClick={handleTryApi} className="mb-4">
                Try it out
              </Button>

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
                <pre className="bg-secondary p-4 rounded-md overflow-x-auto">
                  <code className="text-sm">{response}</code>
                </pre>
              )}
            </TabsContent>
            <TabsContent value="documentation">
              <Accordion type="single" collapsible className="w-full">
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
