import React, { useState, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import { SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { MaterialsFiltersOptions } from "./materials-filters-options";
import { clientConfig } from "@/lib/client-config";

interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {value.length > 0 ? `${value.length} selected` : placeholder}
          <SlidersHorizontal className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={value.includes(option.value)}
            onCheckedChange={(checked) => {
              if (checked) {
                onChange([...value, option.value]);
              } else {
                onChange(value.filter((item: string) => item !== option.value));
              }
            }}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface FiltersAndOptionsProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  visibleColumns: string[];
  toggleColumn: (column: string) => void;
  columns: Array<{
    key: string;
    label: string;
    description?: string;
    unit?: string;
  }>;
  groupByMaterial: boolean;
  setGroupByMaterial: (value: boolean) => void;
  filterOption: string;
  setFilterOption: (value: string) => void;
  selectedMaterials: string[];
  setSelectedMaterials: (value: string[]) => void;
  materialGroups: string[];
  selectedIndicators: string[];
  setSelectedIndicators: (value: string[]) => void;
  indicatorOptions: Option[];
  initialMaxValues: Record<string, number>;
  maxValues: Record<string, number>;
  updateMaxValues: (indicator: string, value: number) => void;
}

export const FiltersAndOptions: React.FC<FiltersAndOptionsProps> = ({
  searchTerm,
  setSearchTerm,
  visibleColumns,
  toggleColumn,
  columns,
  groupByMaterial,
  setGroupByMaterial,
  filterOption,
  setFilterOption,
  selectedMaterials,
  setSelectedMaterials,
  materialGroups,
  selectedIndicators,
  setSelectedIndicators,
  indicatorOptions,
  initialMaxValues,
  maxValues,
  updateMaxValues,
}) => {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Filters and Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Copy the existing filters and options JSX here */}
        {/* ... */}
      </CardContent>
    </Card>
  );
};

// Add KBOBMaterial interface
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

// Add new interface for indicators
interface Indicator {
  id: string;
  label: string;
  unit: string;
  description: string;
}

// Add the MaterialsTableComponent
export function MaterialsTableComponent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "id",
    "nameDE",
    "ubp21Total",
    "gwpTotal",
  ]);
  const [loading, setLoading] = useState(true);
  const [allMaterials, setAllMaterials] = useState<KBOBMaterial[]>([]); // Store all materials
  const [displayedMaterials, setDisplayedMaterials] = useState<KBOBMaterial[]>( // Filtered/grouped materials
    []
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Add state for indicators
  const [indicators, setIndicators] = useState<Indicator[]>([]);

  // Add useEffect to fetch indicators
  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        const response = await fetch("/api/kbob/indicators", {
          headers: {
            'Authorization': `Bearer ${clientConfig.API_KEY}`
          }
        });
        const data = await response.json();
        if (data.success && Array.isArray(data.indicators)) {
          setIndicators(data.indicators);
        }
      } catch (error) {
        console.error("Error fetching indicators:", error);
      }
    };

    fetchIndicators();
  }, []);

  // Update columns definition to use indicators
  const columns: Array<{
    key: string;
    label: string;
    description?: string;
    unit?: string;
  }> = useMemo(
    () => [
      { key: "id", label: "ID" },
      { key: "nameDE", label: "Name (DE)" },
      { key: "nameFR", label: "Name (FR)" },
      { key: "group", label: "Group" },
      { key: "density", label: "Density" },
      { key: "unit", label: "Unit" },
      // Add indicator columns dynamically
      ...indicators.map((indicator) => ({
        key: indicator.id,
        label: indicator.label,
        description: indicator.description,
        unit: indicator.unit,
      })),
    ],
    [indicators]
  );

  // Add toggleColumn function
  const toggleColumn = (columnKey: string) => {
    setVisibleColumns((current) =>
      current.includes(columnKey)
        ? current.filter((key) => key !== columnKey)
        : [...current, columnKey]
    );
  };

  // Add filters state
  const [filters, setFilters] = useState({
    idNumber: "",
    group: "",
    disposal: "",
    ubpTotal: [0, 597],
    primaryEnergyTotal: [31, 663],
    greenhouseGasEmissionsTotal: [0, 1000],
  });

  const [displayOptions, setDisplayOptions] = useState({
    language: "de",
    columns: visibleColumns,
  });

  // Add new state for column search
  const [columnSearchTerm, setColumnSearchTerm] = useState("");

  // Add filtered columns computation
  const filteredColumns = useMemo(() => {
    return columns.filter((column) =>
      column.label.toLowerCase().includes(columnSearchTerm.toLowerCase())
    );
  }, [columns, columnSearchTerm]);

  // Update fetchAllMaterials function to use the correct endpoint
  const fetchAllMaterials = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/kbob/materials", {
        headers: {
          'Authorization': `Bearer ${clientConfig.API_KEY}`
        }
      });
      const data = await response.json();

      if (data.success && Array.isArray(data.materials)) {
        setAllMaterials(data.materials);
        applyFiltersAndOptions(data.materials, filters, displayOptions);
      } else {
        console.error("Invalid data format received:", data);
        setAllMaterials([]);
        setDisplayedMaterials([]);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
      setAllMaterials([]);
      setDisplayedMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to apply filters and options to materials
  const applyFiltersAndOptions = (
    materials: KBOBMaterial[],
    currentFilters = filters,
    currentOptions = displayOptions,
    search = searchTerm
  ) => {
    let filtered = [...materials];

    // Apply text search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((material) =>
        Object.entries(material).some(([key, value]) => {
          if (value === null || key === "uuid") return false;
          return value.toString().toLowerCase().includes(searchLower);
        })
      );
    }

    // Apply indicator range filters
    filtered = filtered.filter((material) => {
      return selectedIndicatorFilters.every((indicatorId) => {
        const value = material[indicatorId as keyof KBOBMaterial] as
          | number
          | null;
        const range = indicatorRanges[indicatorId];

        // Skip filtering if no range is set or value is null
        if (!range || value === null) return true;

        return value >= range[0] && value <= range[1];
      });
    });

    // Update displayed materials and pagination
    setDisplayedMaterials(filtered);
    setTotalPages(Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE)));
    setPage(1);
  };

  // Handle filters change
  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    applyFiltersAndOptions(allMaterials, newFilters, displayOptions);
  };

  // Handle options change
  const handleOptionsChange = (newOptions: any) => {
    setDisplayOptions(newOptions);
    setVisibleColumns(
      newOptions.columns.map((col: string) =>
        col.toLowerCase().replace(/[^a-z0-9]/g, "")
      )
    );
    applyFiltersAndOptions(allMaterials, filters, newOptions);
  };

  // Fetch materials on mount
  useEffect(() => {
    fetchAllMaterials();
  }, []);

  // Get current page items
  const getCurrentPageItems = () => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return displayedMaterials.slice(start, end);
  };

  // Add state for selected indicators to filter
  const [selectedIndicatorFilters, setSelectedIndicatorFilters] = useState<
    string[]
  >(["ubp21Total", "gwpTotal"]);

  // Add state for indicator ranges at the top with other state declarations
  const [indicatorRanges, setIndicatorRanges] = useState<
    Record<string, [number, number]>
  >({});

  // Add useEffect to initialize ranges when indicators are loaded
  useEffect(() => {
    if (indicators.length > 0) {
      const initialRanges: Record<string, [number, number]> = {};
      indicators.forEach((indicator) => {
        // Set initial range based on indicator type
        if (indicator.id.includes("ubp")) {
          initialRanges[indicator.id] = [0, 1000];
        } else if (indicator.id.includes("gwp")) {
          initialRanges[indicator.id] = [0, 500];
        } else {
          initialRanges[indicator.id] = [0, 100];
        }
      });
      setIndicatorRanges(initialRanges);
    }
  }, [indicators]);

  // Add effect to trigger filtering when ranges change
  useEffect(() => {
    applyFiltersAndOptions(allMaterials, filters, displayOptions, searchTerm);
  }, [
    indicatorRanges,
    selectedIndicatorFilters,
    allMaterials,
    filters,
    displayOptions,
    searchTerm,
  ]);

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>KBOB Materials</CardTitle>
        </CardHeader>
        <CardContent>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Search and Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search and columns selection */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-3 top-3 text-gray-400"
                    size={20}
                  />
                  <Input
                    placeholder="Search materials..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      applyFiltersAndOptions(
                        allMaterials,
                        filters,
                        displayOptions,
                        e.target.value
                      );
                    }}
                    className="pl-10"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-[200px]">
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Columns ({visibleColumns.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-[400px]"
                    onCloseAutoFocus={(e) => e.preventDefault()}
                  >
                    <div className="p-2">
                      <div className="relative mb-2">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search columns..."
                          value={columnSearchTerm}
                          onChange={(e) => setColumnSearchTerm(e.target.value)}
                          className="pl-8"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          autoComplete="off"
                        />
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {filteredColumns.map((column) => (
                          <DropdownMenuCheckboxItem
                            key={column.key}
                            checked={visibleColumns.includes(column.key)}
                            onCheckedChange={() => {
                              toggleColumn(column.key);
                            }}
                            className="py-2"
                            onSelect={(e) => {
                              e.preventDefault();
                            }}
                          >
                            <div className="flex flex-col">
                              <span>{column.label}</span>
                              {column.description && (
                                <span className="text-xs text-muted-foreground">
                                  {column.description}
                                </span>
                              )}
                            </div>
                          </DropdownMenuCheckboxItem>
                        ))}
                        {filteredColumns.length === 0 && (
                          <div className="text-sm text-muted-foreground text-center py-2">
                            No columns match your search
                          </div>
                        )}
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Indicator selection for filters */}
              <div>
                <Label>Filter by Indicators</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full mt-2">
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Selected Indicators ({selectedIndicatorFilters.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[400px]" align="end">
                    <div className="p-2">
                      <div className="max-h-[300px] overflow-y-auto">
                        {indicators.map((indicator) => (
                          <DropdownMenuCheckboxItem
                            key={indicator.id}
                            checked={selectedIndicatorFilters.includes(
                              indicator.id
                            )}
                            onCheckedChange={(checked) => {
                              setSelectedIndicatorFilters((prev) =>
                                checked
                                  ? [...prev, indicator.id]
                                  : prev.filter((id) => id !== indicator.id)
                              );
                            }}
                            className="py-2"
                          >
                            <div className="flex flex-col">
                              <span>{indicator.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {indicator.description}
                              </span>
                            </div>
                          </DropdownMenuCheckboxItem>
                        ))}
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Indicator range sliders */}
              <div className="space-y-6">
                {selectedIndicatorFilters.map((indicatorId) => {
                  const indicator = indicators.find(
                    (i) => i.id === indicatorId
                  );
                  if (!indicator) return null;

                  return (
                    <div key={indicatorId} className="space-y-2">
                      <Label className="flex items-center justify-between">
                        <span>{indicator.label}</span>
                        <span className="text-xs text-muted-foreground">
                          ({indicator.unit})
                        </span>
                      </Label>
                      <div className="pt-2">
                        <Slider
                          value={indicatorRanges[indicatorId] || [0, 100]}
                          min={0}
                          max={indicator.id.includes("ubp") ? 1000 : 500}
                          step={1}
                          minStepsBetweenThumbs={1}
                          onValueChange={(value) => {
                            setIndicatorRanges((prev) => ({
                              ...prev,
                              [indicatorId]: value as [number, number],
                            }));
                            // Filtering will be triggered by the useEffect above
                          }}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>{indicatorRanges[indicatorId]?.[0] || 0}</span>
                          <span>
                            {indicatorRanges[indicatorId]?.[1] || 100}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Table section */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.map((columnKey) => {
                    const column = columns.find((col) => col.key === columnKey);
                    return (
                      <TableHead key={columnKey} className="whitespace-nowrap">
                        {column?.description ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="cursor-help">
                                {column.label}
                                {column.unit && ` (${column.unit})`}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{column.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          column?.label
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={visibleColumns.length}
                      className="h-24 text-center"
                    >
                      <div className="flex items-center justify-center">
                        Loading materials...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : getCurrentPageItems().length > 0 ? (
                  getCurrentPageItems().map((material) => (
                    <TableRow key={material.id}>
                      {visibleColumns.map((columnKey) => (
                        <TableCell key={columnKey}>
                          {formatCellValue(
                            material[columnKey as keyof KBOBMaterial]
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={visibleColumns.length}
                      className="h-24 text-center"
                    >
                      No materials found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination section */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={loading || page === 1}
              >
                Previous
              </Button>
              <Button
                variant="default"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={loading || page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Add helper function to format cell values
function formatCellValue(value: any): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "number") {
    // Format numbers with 2 decimal places if they have decimals
    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
  }
  return value.toString();
}
