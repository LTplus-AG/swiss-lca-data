"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Search } from "lucide-react";

interface KBOBMaterial {
  id: string;
  uuid: string;
  nameDE: string;
  nameFR: string;
  group: string;
  density: string | null;
  unit: string;
  ubp21Total: number | null;
  ubp21Production: number | null;
  ubp21Disposal: number | null;
  gwpTotal: number | null;
  gwpProduction: number | null;
  gwpDisposal: number | null;
  biogenicCarbon: number | null;
}

const impactCategories = [
  { label: "GWP Total", value: "gwpTotal" },
  { label: "UBP21 Total", value: "ubp21Total" },
  { label: "Primary Energy", value: "primaryEnergy" }, // Note: Update when available
];

const versions = ["2021", "2022", "2023"]; // Keep this until we have version data from API

// Add this interface for chart data type
interface ChartDataItem {
  name: string;
  version: string; // Changed from version?: string; to version: string;
  [key: string]: string | number; // Change here to remove undefined
}

// Add new interface and state
interface Indicator {
  id: string;
  label: string;
  unit: string;
  description: string;
  group: "environmental" | "economic" | "social";
}

export default function DataExplorerPage() {
  const [materials, setMaterials] = useState<KBOBMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedVersions, setSelectedVersions] = useState<string[]>(["2023"]);
  const [selectedImpact, setSelectedImpact] = useState("gwpTotal");
  const [searchTerm, setSearchTerm] = useState("");
  // Add new state for indicators
  const [indicators, setIndicators] = useState<Indicator[]>([]);

  // Fetch materials on component mount
  useEffect(() => {
    fetchMaterials();
  }, []);

  // Add new useEffect for fetching indicators
  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        const response = await fetch("/api/kbob/indicators");
        const data = await response.json();
        if (data.success && Array.isArray(data.indicators)) {
          setIndicators(data.indicators);
          // Set default indicator if none selected
          if (!selectedImpact && data.indicators.length > 0) {
            setSelectedImpact(data.indicators[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching indicators:", error);
      }
    };

    fetchIndicators();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/kbob/materials/all"); // Use the /all endpoint for complete dataset
      const data = await response.json();

      if (data.success && Array.isArray(data.materials)) {
        // Update to match the actual API response structure
        setMaterials(
          data.materials.map((material: any) => ({
            id: material.uuid, // Map uuid to id for compatibility
            uuid: material.uuid,
            nameDE: material.nameDE,
            nameFR: material.nameFR,
            group: material.group || "Uncategorized",
            density: material.density,
            unit: material.unit,
            ubp21Total: material.ubp21Total,
            ubp21Production: material.ubp21Production,
            ubp21Disposal: material.ubp21Disposal,
            gwpTotal: material.gwpTotal,
            gwpProduction: material.gwpProduction,
            gwpDisposal: material.gwpDisposal,
            biogenicCarbon: material.biogenicCarbon,
          }))
        );
      } else {
        console.error("Invalid data format received:", data);
        setMaterials([]);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter(
      (material) =>
        material.nameDE.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.group.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [materials, searchTerm]);

  const handleMaterialSelect = (materialId: string) => {
    setSelectedMaterials((prev) => {
      const newSelection = prev.includes(materialId)
        ? prev.filter((id) => id !== materialId)
        : [...prev, materialId];

      // Ensure at least one version is selected if we have materials
      if (newSelection.length > 0 && selectedVersions.length === 0) {
        setSelectedVersions(["2023"]); // Default to latest version
      }

      return newSelection;
    });
  };

  const handleVersionSelect = (version: string) => {
    setSelectedVersions((prev) =>
      prev.includes(version)
        ? prev.filter((v) => v !== version)
        : [...prev, version]
    );
  };

  const chartData = useMemo(() => {
    if (!selectedMaterials.length) return []; // Add early return for no selection

    if (selectedVersions.length === 1) {
      // Single version comparison
      return selectedMaterials
        .map((materialId) => {
          const material = materials.find((m) => m.id === materialId);
          if (
            !material ||
            material[selectedImpact as keyof KBOBMaterial] === undefined
          )
            return null;

          return {
            name: material.nameDE,
            [selectedImpact]:
              material[selectedImpact as keyof KBOBMaterial] || 0,
          };
        })
        .filter((item): item is ChartDataItem => item !== null);
    } else {
      // Version comparison
      return selectedVersions.map((version) => {
        const dataItem: ChartDataItem = {
          version,
          name: version, // Add this to fix XAxis label
        };

        selectedMaterials.forEach((materialId) => {
          const material = materials.find((m) => m.id === materialId);
          if (material && material[selectedImpact as keyof KBOBMaterial]) {
            dataItem[material.nameDE] =
              material[selectedImpact as keyof KBOBMaterial] || 0;
          }
        });

        return dataItem;
      });
    }
  }, [selectedMaterials, selectedVersions, selectedImpact, materials]);

  const renderChart = () => {
    if (!selectedMaterials.length) {
      return (
        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
          Select materials to view comparison
        </div>
      );
    }

    if (selectedVersions.length === 1) {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ bottom: 90 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey={selectedImpact}
              fill="#8884d8"
              name={
                impactCategories.find((c) => c.value === selectedImpact)
                  ?.label || selectedImpact
              }
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {selectedMaterials.map((materialId, index) => {
            const material = materials.find((m) => m.id === materialId);
            return material ? (
              <Line
                key={material.id}
                type="monotone"
                dataKey={material.nameDE}
                stroke={`hsl(${(index * 137.5) % 360}, 70%, 50%)`}
                strokeWidth={2}
                name={material.nameDE}
              />
            ) : null;
          })}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Data Explorer</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Select Materials</CardTitle>
            <CardDescription>Choose materials to compare</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label htmlFor="search-materials">Search Materials</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-materials"
                  placeholder="Search by name or group"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <ScrollArea className="h-[200px] border rounded-md p-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  Loading materials...
                </div>
              ) : (
                filteredMaterials.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center space-x-2 mb-2"
                  >
                    <Checkbox
                      id={material.id}
                      checked={selectedMaterials.includes(material.id)}
                      onCheckedChange={() => handleMaterialSelect(material.id)}
                    />
                    <Label htmlFor={material.id} className="flex-grow">
                      {material.nameDE}{" "}
                      <span className="text-muted-foreground">
                        ({material.group})
                      </span>
                    </Label>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Select versions and impact category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>KBOB Versions</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {versions.map((version) => (
                    <Button
                      key={version}
                      variant={
                        selectedVersions.includes(version)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => handleVersionSelect(version)}
                    >
                      {version}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="impact-category">Impact Category</Label>
                <Select
                  value={selectedImpact}
                  onValueChange={setSelectedImpact}
                >
                  <SelectTrigger id="impact-category">
                    <SelectValue placeholder="Select impact category">
                      {indicators.find((i) => i.id === selectedImpact)?.label ||
                        "Select indicator"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {indicators.map((indicator) => (
                      <SelectItem key={indicator.id} value={indicator.id}>
                        <div className="flex flex-col">
                          <span>{indicator.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {indicator.description} ({indicator.unit})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Impact Comparison
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              Charts Coming Soon
            </span>
          </CardTitle>
          <CardDescription>
            {selectedMaterials.length === 0
              ? "Select materials to compare"
              : selectedVersions.length === 1
              ? `Compare materials for KBOB ${selectedVersions[0]}`
              : "Compare materials across versions"}
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[400px] relative">
          {loading ? (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              Loading materials data...
            </div>
          ) : (
            <div className="opacity-50">{renderChart()}</div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <div className="text-lg font-medium text-muted-foreground">
              Chart Visualization Coming Soon
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Data Table</CardTitle>
          <CardDescription>Detailed view of the selected data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">
                    {selectedVersions.length === 1 ? "Material" : "Version"}
                  </th>
                  {selectedVersions.length === 1 ? (
                    <th className="text-left p-2">
                      {
                        impactCategories.find((c) => c.value === selectedImpact)
                          ?.label
                      }
                    </th>
                  ) : (
                    selectedMaterials.map((materialId) => {
                      const material = materials.find(
                        (m) => m.id === materialId
                      );
                      return material ? (
                        <th key={material.id} className="text-left p-2">
                          {material.nameDE}
                        </th>
                      ) : null;
                    })
                  )}
                </tr>
              </thead>
              <tbody>
                {chartData
                  .filter((row): row is ChartDataItem => row !== null)
                  .map((row, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">
                        {selectedVersions.length === 1 ? row.name : row.version}
                      </td>
                      {selectedVersions.length === 1 ? (
                        <td className="p-2">
                          {typeof row[selectedImpact] === "number"
                            ? row[selectedImpact].toFixed(2)
                            : "-"}
                        </td>
                      ) : (
                        selectedMaterials.map((materialId) => {
                          const material = materials.find(
                            (m) => m.id === materialId
                          );
                          return material ? (
                            <td key={material.id} className="p-2">
                              {typeof row[material.nameDE] === "number" &&
                              !isNaN(row[material.nameDE] as number)
                                ? (row[material.nameDE] as number).toFixed(2)
                                : "-"}
                            </td>
                          ) : null;
                        })
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
