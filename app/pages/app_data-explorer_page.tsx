"use client";

import { useState, useMemo } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
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

// Mock data - replace with actual API calls in a real application
const materials = [
  { id: "1.001", name: "Concrete (standard)", group: "Structural" },
  { id: "1.002", name: "Concrete (high-strength)", group: "Structural" },
  { id: "1.003", name: "Concrete (lightweight)", group: "Structural" },
  { id: "2.001", name: "Steel (structural)", group: "Structural" },
  { id: "2.002", name: "Steel (reinforcing)", group: "Structural" },
  { id: "2.003", name: "Steel (stainless)", group: "Structural" },
  { id: "3.001", name: "Glass (single pane)", group: "Facade" },
  { id: "3.002", name: "Glass (double pane)", group: "Facade" },
  { id: "3.003", name: "Glass (triple pane)", group: "Facade" },
  { id: "4.001", name: "Wood (softwood)", group: "Finishes" },
  { id: "4.002", name: "Wood (hardwood)", group: "Finishes" },
  { id: "4.003", name: "Wood (engineered)", group: "Finishes" },
  { id: "5.001", name: "Insulation (fiberglass)", group: "Insulation" },
  { id: "5.002", name: "Insulation (mineral wool)", group: "Insulation" },
  { id: "5.003", name: "Insulation (foam)", group: "Insulation" },
];

const versions = ["2021", "2022", "2023"];

const impactCategories = [
  { label: "GHG Total", value: "ghgTotal" },
  { label: "UBP Total", value: "ubpTotal" },
  { label: "Primary Energy", value: "primaryEnergy" },
];

// Mock impact data - replace with actual data in a real application
const getImpactData = (materialId: string, version: string) => {
  const baseValue = Math.random() * 100;
  return {
    ghgTotal: baseValue,
    ubpTotal: baseValue * 10,
    primaryEnergy: baseValue * 5,
  };
};

export default function DataExplorerPage() {
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedVersions, setSelectedVersions] = useState<string[]>(["2023"]);
  const [selectedImpact, setSelectedImpact] = useState("ghgTotal");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMaterials = useMemo(() => {
    return materials.filter(
      (material) =>
        material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.group.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleMaterialSelect = (materialId: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(materialId)
        ? prev.filter((id) => id !== materialId)
        : [...prev, materialId]
    );
  };

  const handleVersionSelect = (version: string) => {
    setSelectedVersions((prev) =>
      prev.includes(version)
        ? prev.filter((v) => v !== version)
        : [...prev, version]
    );
  };

  const chartData = useMemo(() => {
    if (selectedVersions.length === 1) {
      return selectedMaterials.map((materialId) => {
        const material = materials.find((m) => m.id === materialId);
        const impactData = getImpactData(materialId, selectedVersions[0]);
        return {
          name: material?.name || materialId,
          [selectedImpact]: impactData[selectedImpact],
        };
      });
    } else {
      return versions.map((version) => ({
        version,
        ...selectedMaterials.reduce((acc, materialId) => {
          const material = materials.find((m) => m.id === materialId);
          if (material) {
            acc[material.name] = getImpactData(materialId, version)[
              selectedImpact
            ];
          }
          return acc;
        }, {} as Record<string, number>),
      }));
    }
  }, [selectedMaterials, selectedVersions, selectedImpact]);

  const renderChart = () => {
    if (selectedVersions.length === 1) {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={selectedImpact} fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="version" />
            <YAxis />
            <Tooltip />
            <Legend />
            {selectedMaterials.map((materialId, index) => {
              const material = materials.find((m) => m.id === materialId);
              return material ? (
                <Line
                  key={material.id}
                  type="monotone"
                  dataKey={material.name}
                  stroke={`hsl(${index * 30}, 70%, 50%)`}
                  strokeWidth={2}
                />
              ) : null;
            })}
          </LineChart>
        </ResponsiveContainer>
      );
    }
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
              {filteredMaterials.map((material) => (
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
                    {material.name}{" "}
                    <span className="text-muted-foreground">
                      ({material.group})
                    </span>
                  </Label>
                </div>
              ))}
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
                    <SelectValue placeholder="Select impact category" />
                  </SelectTrigger>
                  <SelectContent>
                    {impactCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
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
          <CardTitle>Impact Comparison</CardTitle>
          <CardDescription>
            {selectedVersions.length === 1
              ? `Compare materials for KBOB ${selectedVersions[0]}`
              : "Compare materials across versions"}
          </CardDescription>
        </CardHeader>
        <CardContent>{renderChart()}</CardContent>
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
                          {material.name}
                        </th>
                      ) : null;
                    })
                  )}
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-2">
                      {selectedVersions.length === 1 ? row.name : row.version}
                    </td>
                    {selectedVersions.length === 1 ? (
                      <td className="p-2">
                        {row[selectedImpact]?.toFixed(2) || "-"}
                      </td>
                    ) : (
                      selectedMaterials.map((materialId) => {
                        const material = materials.find(
                          (m) => m.id === materialId
                        );
                        return material ? (
                          <td key={material.id} className="p-2">
                            {row[material.name]?.toFixed(2) || "-"}
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
