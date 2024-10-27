"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Download, Upload, X, ChevronDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

export default function BIMIntegrationPage() {
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [mappingConfig, setMappingConfig] = useState<Record<string, string>>({
    id: "KBOB_ID",
    name: "Name",
    group: "Category",
  });
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "id",
    "name",
    "group",
  ]);

  const materials = [
    { id: "1.001", name: "Concrete", group: "Structural" },
    { id: "2.001", name: "Steel", group: "Structural" },
    { id: "3.001", name: "Glass", group: "Facade" },
    { id: "4.001", name: "Wood", group: "Finishes" },
  ];

  const availableFields = [
    { label: "ID", value: "id" },
    { label: "Name", value: "name" },
    { label: "Group", value: "group" },
    { label: "Density", value: "density" },
    { label: "Unit", value: "unit" },
    { label: "UBP Total", value: "ubpTotal" },
    { label: "UBP Production", value: "ubpProduction" },
    { label: "UBP Disposal", value: "ubpDisposal" },
    { label: "GHG Total", value: "ghgTotal" },
    { label: "GHG Production", value: "ghgProduction" },
    { label: "GHG Disposal", value: "ghgDisposal" },
  ];

  const handleMaterialSelect = (materialId: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(materialId)
        ? prev.filter((id) => id !== materialId)
        : [...prev, materialId]
    );
  };

  const handleMappingChange = (key: string, value: string) => {
    setMappingConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleFieldSelect = (field: string) => {
    setSelectedFields((prev) => {
      if (prev.includes(field)) {
        return prev.filter((f) => f !== field);
      } else {
        return [...prev, field];
      }
    });
    if (!mappingConfig[field]) {
      setMappingConfig((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleRemoveMapping = (key: string) => {
    setMappingConfig((prev) => {
      const { [key]: removed, ...rest } = prev;
      return rest;
    });
    setSelectedFields((prev) => prev.filter((field) => field !== key));
  };

  const handleExport = (format: string) => {
    console.log("Exporting with format:", format);
    console.log("Mapping config:", mappingConfig);
    console.log("Selected materials:", selectedMaterials);
    alert(`Export started in ${format} format. Check console for details.`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">BIM Integration</h1>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          Ensure your BIM software is compatible with the KBOB data structure
          before proceeding with the integration.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="mapping">
        <TabsList className="mb-4">
          <TabsTrigger value="mapping">Mapping Configuration</TabsTrigger>
          <TabsTrigger value="materials">Material Selection</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="mapping">
          <Card>
            <CardHeader>
              <CardTitle>BIM Mapping Configuration</CardTitle>
              <CardDescription>
                Define how KBOB data fields map to your BIM software
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label htmlFor="fieldSelect" className="mb-2 block">
                  Select Fields
                </Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      {selectedFields.length > 0
                        ? `${selectedFields.length} fields selected`
                        : "Select fields"}
                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {availableFields.map((field) => (
                      <DropdownMenuCheckboxItem
                        key={field.value}
                        checked={selectedFields.includes(field.value)}
                        onCheckedChange={() => handleFieldSelect(field.value)}
                      >
                        {field.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="grid gap-4">
                {selectedFields.map((field) => (
                  <div
                    key={field}
                    className="grid grid-cols-3 items-center gap-4"
                  >
                    <Label htmlFor={field}>
                      {availableFields.find((f) => f.value === field)?.label}
                    </Label>
                    <Input
                      id={field}
                      value={mappingConfig[field] || ""}
                      onChange={(e) =>
                        handleMappingChange(field, e.target.value)
                      }
                      placeholder="Enter BIM field name"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveMapping(field)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle>Material Selection</CardTitle>
              <CardDescription>
                Choose materials to include in the BIM export
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Select</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Group</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedMaterials.includes(material.id)}
                          onCheckedChange={() =>
                            handleMaterialSelect(material.id)
                          }
                        />
                      </TableCell>
                      <TableCell>{material.id}</TableCell>
                      <TableCell>{material.name}</TableCell>
                      <TableCell>{material.group}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export Configuration</CardTitle>
              <CardDescription>
                Configure and initiate the BIM data export
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox id="includeMetadata" />
                <Label htmlFor="includeMetadata">Include metadata</Label>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={() => handleExport("csv")}>
                <Download className="mr-2 h-4 w-4" />
                Export as CSV
              </Button>
              <Button onClick={() => handleExport("excel")}>
                <Download className="mr-2 h-4 w-4" />
                Export as Excel
              </Button>
              <Button onClick={() => handleExport("speckle")}>
                <Download className="mr-2 h-4 w-4" />
                Export to Speckle
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Import Existing Configuration</CardTitle>
          <CardDescription>
            Load a previously saved BIM integration configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input id="configFile" type="file" />
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
