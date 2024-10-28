"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Download,
  Upload,
  X,
  ChevronDown,
  ArrowRight,
  Check,
  Search,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface Material {
  id: string;
  nameDE: string;
  group: string;
  density?: number | null;
  unit?: string;
  ubp21Total?: number | null;
  ubp21Production?: number | null;
  ubp21Disposal?: number | null;
  gwpTotal?: number | null;
  gwpProduction?: number | null;
  gwpDisposal?: number | null;
}

interface MaterialField {
  label: string;
  value: string;
  example?: string | number | null;
}

export function Page() {
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [mappingConfig, setMappingConfig] = useState<Record<string, string>>({
    id: "KBOB_ID",
    nameDE: "Name DE",
    gwpTotal: "Global Warming Potential",
    ubp21Total: "Environmental Impact Points",
  });
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "id",
    "nameDE",
    "gwpTotal",
    "ubp21Total",
  ]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("mapping");
  const [completionStatus, setCompletionStatus] = useState({
    mapping: false,
    materials: false,
    export: false,
  });
  const [includeMetadata, setIncludeMetadata] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Material;
    direction: "asc" | "desc";
  }>({ key: "id", direction: "asc" });
  const [searchTerm, setSearchTerm] = useState("");
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null
  );
  const [availableFields, setAvailableFields] = useState<MaterialField[]>([]);
  const [fieldSearchTerm, setFieldSearchTerm] = useState("");
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/kbob/materials");
        if (!response.ok) {
          throw new Error("Failed to fetch materials");
        }
        const data = await response.json();
        console.log(data);

        // Updated to handle the actual API response format
        if (data.success && Array.isArray(data.materials)) {
          setMaterials(data.materials);
        } else {
          console.error("Invalid data format received:", data);
          setMaterials([]);
        }
      } catch (err) {
        console.error("Error fetching materials:", err);
        setError("Failed to load materials. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await fetch("/api/kbob/materials/fields");
        if (!response.ok) {
          throw new Error("Failed to fetch fields");
        }
        const data = await response.json();

        if (data.success && Array.isArray(data.fields)) {
          setAvailableFields(data.fields);
        } else {
          console.error("Invalid fields data format received:", data);
          setAvailableFields([]);
        }
      } catch (err) {
        console.error("Error fetching fields:", err);
        setAvailableFields([]);
      }
    };

    fetchFields();
  }, []);

  useEffect(() => {
    if (availableFields.length > 0 && Object.keys(mappingConfig).length === 0) {
      const defaultFields = ["id", "nameDE", "gwpTotal", "ubp21Total"];
      const defaultMapping: Record<string, string> = {};

      defaultFields.forEach((field) => {
        const fieldInfo = availableFields.find((f) => f.value === field);
        if (fieldInfo) {
          defaultMapping[field] = fieldInfo.label;
        }
      });

      setMappingConfig(defaultMapping);
      setSelectedFields(Object.keys(defaultMapping));
    }
  }, [availableFields]);

  const handleMaterialSelect = (
    materialId: string,
    index: number,
    event: React.MouseEvent
  ) => {
    if (event.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const newSelections = filteredMaterials
        .slice(start, end + 1)
        .map((m) => m.id);

      setSelectedMaterials((prev) => {
        const existing = new Set(prev);
        newSelections.forEach((id) => existing.add(id));
        return Array.from(existing);
      });
    } else {
      setSelectedMaterials((prev) =>
        prev.includes(materialId)
          ? prev.filter((id) => id !== materialId)
          : [...prev, materialId]
      );
    }
    setLastSelectedIndex(index);
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

  const handleNextTab = () => {
    const tabOrder = ["mapping", "materials", "export"];
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1]);
    }
  };

  const isTabComplete = (tab: string) => {
    switch (tab) {
      case "mapping":
        return (
          selectedFields.length > 0 &&
          selectedFields.every(
            (field) => mappingConfig[field]?.trim().length > 0
          )
        );
      case "materials":
        return selectedMaterials.length > 0;
      case "export":
        return false; // Always false until export is done
      default:
        return false;
    }
  };

  // Update completion status when relevant state changes
  useEffect(() => {
    setCompletionStatus((prev) => ({
      ...prev,
      mapping: isTabComplete("mapping"),
      materials: isTabComplete("materials"),
    }));
  }, [selectedFields, mappingConfig, selectedMaterials]);

  const handleExport = async (format: "csv" | "excel" | "json" | "speckle") => {
    // Get selected materials data
    const selectedMaterialsData = materials
      .filter((m) => selectedMaterials.includes(m.id))
      .map((material) => {
        const mappedMaterial: Record<string, any> = {};

        // Add mapped fields
        selectedFields.forEach((field) => {
          mappedMaterial[mappingConfig[field] || field] =
            material[field as keyof Material];
        });

        return mappedMaterial;
      });

    // Create export metadata
    const exportMetadata = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        format: format,
        source: "KBOB Database",
        version: "2024",
        settings: {
          selectedFields: selectedFields,
          fieldMapping: mappingConfig,
          includeMetadata: includeMetadata,
        },
      },
    };

    try {
      switch (format) {
        case "csv": {
          // Create CSV content
          const headers = selectedFields.map(
            (field) => mappingConfig[field] || field
          );
          const csvContent = [
            headers.join(","),
            ...selectedMaterialsData.map((item) =>
              headers
                .map((header) => JSON.stringify(item[header] ?? ""))
                .join(",")
            ),
            "", // Empty line before metadata
            "# Export Information",
            ...Object.entries(exportMetadata.exportInfo).map(
              ([key, value]) =>
                `# ${key}: ${
                  typeof value === "object" ? JSON.stringify(value) : value
                }`
            ),
          ].join("\n");

          // Create and trigger download
          const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
          });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `kbob_materials_export_${
            new Date().toISOString().split("T")[0]
          }.csv`;
          link.click();
          break;
        }
        case "excel": {
          // Use server endpoint for Excel generation
          const response = await fetch("/api/export/excel", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              materials: selectedMaterialsData,
              metadata: exportMetadata,
            }),
          });

          if (!response.ok) throw new Error("Excel export failed");

          const blob = await response.blob();
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `kbob_materials_export_${
            new Date().toISOString().split("T")[0]
          }.xlsx`;
          link.click();
          break;
        }
        case "json": {
          // Create JSON file with metadata
          const exportData = {
            ...exportMetadata,
            materials: selectedMaterialsData,
          };

          const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json",
          });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(jsonBlob);
          link.download = `kbob_materials_export_${
            new Date().toISOString().split("T")[0]
          }.json`;
          link.click();
          break;
        }
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    }
  };

  // Add sorting function
  const sortedMaterials = [...materials].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    const comparison = String(aValue).localeCompare(String(bValue), undefined, {
      numeric: true,
    });
    return sortConfig.direction === "asc" ? comparison : -comparison;
  });

  // Add filtering function
  const filteredMaterials = sortedMaterials.filter((material) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      material.id.toLowerCase().includes(searchLower) ||
      material.nameDE.toLowerCase().includes(searchLower) ||
      material.group.toLowerCase().includes(searchLower) ||
      material.gwpTotal?.toString().includes(searchLower)
    );
  });

  // Add sort handler
  const handleSort = (key: keyof Material) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Add select all handler
  const handleSelectAll = () => {
    if (selectedMaterials.length === filteredMaterials.length) {
      setSelectedMaterials([]);
    } else {
      setSelectedMaterials(filteredMaterials.map((m) => m.id));
    }
  };

  // Filter available fields based on search
  const filteredFields = availableFields.filter(
    (field) =>
      field.label.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
      field.value.toLowerCase().includes(fieldSearchTerm.toLowerCase())
  );

  const PaginationControls = () => {
    const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);

    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, filteredMaterials.length)} of{" "}
          {filteredMaterials.length}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  const paginatedMaterials = filteredMaterials.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 grid w-full grid-cols-3">
          <TabsTrigger value="mapping" className="relative">
            {completionStatus.mapping && (
              <Check className="h-4 w-4 absolute right-2 text-green-500" />
            )}
            1. Mapping
          </TabsTrigger>
          <TabsTrigger value="materials" className="relative">
            {completionStatus.materials && (
              <Check className="h-4 w-4 absolute right-2 text-green-500" />
            )}
            2. Materials
          </TabsTrigger>
          <TabsTrigger value="export" className="relative">
            {completionStatus.export && (
              <Check className="h-4 w-4 absolute right-2 text-green-500" />
            )}
            3. Export
          </TabsTrigger>
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
                <DropdownMenu
                  open={isFieldDropdownOpen}
                  onOpenChange={setIsFieldDropdownOpen}
                >
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
                  <DropdownMenuContent
                    className="w-[400px] p-2"
                    onCloseAutoFocus={(e) => e.preventDefault()}
                  >
                    <div className="mb-2">
                      <Input
                        placeholder="Search fields..."
                        value={fieldSearchTerm}
                        onChange={(e) => setFieldSearchTerm(e.target.value)}
                        className="w-full"
                        onKeyDown={(e) => {
                          // Prevent dropdown from closing on key press
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          // Prevent dropdown from closing on click
                          e.stopPropagation();
                        }}
                        autoComplete="off"
                      />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {filteredFields.map((field) => (
                        <DropdownMenuCheckboxItem
                          key={field.value}
                          checked={selectedFields.includes(field.value)}
                          onCheckedChange={() => handleFieldSelect(field.value)}
                          className="py-2"
                          onSelect={(e) => {
                            // Prevent closing on selection
                            e.preventDefault();
                          }}
                        >
                          {field.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Show selected fields as a table */}
              {selectedFields.length > 0 && (
                <div className="rounded-md border mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>KBOB Field</TableHead>
                        <TableHead>BIM Field Name</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedFields.map((field) => (
                        <TableRow key={field}>
                          <TableCell>
                            {
                              availableFields.find((f) => f.value === field)
                                ?.label
                            }
                          </TableCell>
                          <TableCell>
                            <Input
                              value={mappingConfig[field] || ""}
                              onChange={(e) =>
                                handleMappingChange(field, e.target.value)
                              }
                              placeholder="Enter BIM field name"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMapping(field)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedFields.length === 0
                  ? "Select at least one field to continue"
                  : !completionStatus.mapping
                  ? "Fill in all mapping fields to continue"
                  : "Mapping configuration complete"}
              </div>
              <Button
                onClick={handleNextTab}
                disabled={!completionStatus.mapping}
              >
                Next Step <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
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
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search materials..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Button variant="outline" onClick={handleSelectAll}>
                    {selectedMaterials.length === filteredMaterials.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={
                              selectedMaterials.length ===
                              filteredMaterials.length
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort("id")}
                        >
                          ID{" "}
                          {sortConfig.key === "id" &&
                            (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </TableHead>
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort("nameDE")}
                        >
                          Name{" "}
                          {sortConfig.key === "nameDE" &&
                            (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </TableHead>
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort("group")}
                        >
                          Group{" "}
                          {sortConfig.key === "group" &&
                            (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </TableHead>
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort("gwpTotal")}
                        >
                          GWP Total{" "}
                          {sortConfig.key === "gwpTotal" &&
                            (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedMaterials.map((material, index) => (
                        <TableRow
                          key={material.id}
                          className={
                            selectedMaterials.includes(material.id)
                              ? "bg-muted/50"
                              : ""
                          }
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedMaterials.includes(material.id)}
                              onCheckedChange={() => {
                                handleMaterialSelect(
                                  material.id,
                                  (currentPage - 1) * itemsPerPage + index,
                                  { shiftKey: false } as React.MouseEvent
                                );
                              }}
                            />
                          </TableCell>
                          <TableCell>{material.id}</TableCell>
                          <TableCell>{material.nameDE}</TableCell>
                          <TableCell>{material.group}</TableCell>
                          <TableCell>
                            {material.gwpTotal?.toFixed(2) || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <PaginationControls />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedMaterials.length === 0
                  ? "Select at least one material to continue"
                  : `${selectedMaterials.length} of ${filteredMaterials.length} materials selected`}
              </div>
              <Button
                onClick={handleNextTab}
                disabled={!completionStatus.materials}
              >
                Next Step <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
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
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeMetadata"
                    checked={includeMetadata}
                    onCheckedChange={(checked) =>
                      setIncludeMetadata(checked as boolean)
                    }
                  />
                  <Label htmlFor="includeMetadata">
                    Include export metadata
                  </Label>
                </div>
                <div className="text-sm text-muted-foreground">
                  {includeMetadata ? (
                    <div className="space-y-4">
                      <p>
                        The export will include a metadata section containing:
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Export timestamp and format</li>
                        <li>
                          Export configuration:
                          <ul className="list-disc pl-5 mt-1">
                            <li>Selected fields and their mappings</li>
                            <li>Number of materials exported</li>
                          </ul>
                        </li>
                        <li>
                          Format-specific details:
                          <ul className="list-disc pl-5 mt-1">
                            <li>
                              CSV: Added as comments at the end of the file
                            </li>
                            <li>
                              Excel: Included as a separate "Export Information"
                              sheet
                            </li>
                            <li>
                              JSON: Added as a top-level "exportInfo" object
                            </li>
                          </ul>
                        </li>
                      </ul>
                    </div>
                  ) : (
                    <p>
                      Enable to include information about when and how this
                      export was created
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Ready to export {selectedMaterials.length} materials
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>
                      <Download className="mr-2 h-4 w-4" />
                      Export As
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport("csv")}>
                      CSV File
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("excel")}>
                      Excel Workbook
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("json")}>
                      JSON File
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button disabled className="relative">
                  <Download className="mr-2 h-4 w-4" />
                  Export to Speckle
                  <span className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Import Existing Configuration
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              Coming Soon
            </span>
          </CardTitle>
          <CardDescription>
            Load a previously saved BIM integration configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 opacity-50">
            <Input id="configFile" type="file" disabled />
            <Button disabled>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
