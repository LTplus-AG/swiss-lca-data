import React, { useState, useEffect, useMemo } from "react";
import { Search, SlidersHorizontal, ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react";
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
  primaryEnergyNonRenewableTotal: number | null;
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
  const [visibleColumns, setVisibleColumns] = useState([
    "id",
    "nameDE",
    "ubp21Total",
    "gwpTotal",
    "primaryEnergyNonRenewableTotal"
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

  // Update columns definition to use specific labels and units
  const columns: Array<{
    key: string;
    label: string;
    description?: string;
    unit?: string;
  }> = useMemo(
    () => [
      { key: "id", label: "ID" },
      { key: "nameDE", label: "Name (DE)" },
      { key: "ubp21Total", label: "UBP Total", unit: "UBP'21" },
      { key: "gwpTotal", label: "GWP Total", unit: "kg CO₂ eq" },
      { 
        key: "primaryEnergyNonRenewableTotal", 
        label: "Primary Energy Non-Renewable Total", 
        unit: "kWh oil-eq" 
      },
      // Keep other columns but they won't be visible by default
      ...indicators
        .filter(indicator => !visibleColumns.includes(indicator.id))
        .map((indicator) => ({
          key: indicator.id,
          label: indicator.label,
          description: indicator.description,
          unit: indicator.unit,
        })),
    ],
    [indicators, visibleColumns]
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
        // Set displayed materials directly without filtering
        setDisplayedMaterials(data.materials);
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

  // Calculate max values for indicators with 5% buffer
  const maxIndicatorValues = useMemo(() => {
    const maxValues: Record<string, number> = {};
    
    if (allMaterials.length > 0) {
      indicators.forEach((indicator) => {
        const max = Math.max(...allMaterials.map(material => 
          material[indicator.id] !== null ? material[indicator.id] : 0
        ));
        // Add 5% buffer and round to nearest integer
        maxValues[indicator.id] = Math.round(max * 1.05);
      });
    }
    
    return maxValues;
  }, [allMaterials, indicators]);

  // Update filterRanges state to use dynamic max values
  const [filterRanges, setFilterRanges] = useState<Record<string, [number, number]>>({});

  // Initialize filter ranges when indicators or maxValues change
  useEffect(() => {
    const newRanges: Record<string, [number, number]> = {};
    
    indicators.forEach((indicator) => {
      const maxValue = maxIndicatorValues[indicator.id] || 0;
      // Set initial range from 0 to max, but don't trigger filtering
      newRanges[indicator.id] = [0, maxValue];
    });

    setFilterRanges(newRanges);
    // Set initial displayed materials to all materials
    setDisplayedMaterials(allMaterials);
  }, [indicators, maxIndicatorValues]);

  // Function to apply filters and options to materials
  const applyFiltersAndOptions = (
    materials: KBOBMaterial[],
    skipFilters = false
  ) => {
    let filtered = materials;

    // Apply text-based filters
    if (searchTerm) {
      filtered = filtered.filter(
        (material) =>
          material.nameDE?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          material.nameFR?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          material.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Only apply indicator filters if not skipping filters
    if (!skipFilters) {
      indicators.forEach((indicator) => {
        if (filterRanges[indicator.id]) {
          const [min, max] = filterRanges[indicator.id];
          filtered = filtered.filter((material) => {
            const value = material[indicator.id];
            return value === null || (value >= min && value <= max);
          });
        }
      });
    }

    setDisplayedMaterials(filtered);
  };

  // Handle filters change
  const handleFilterChange = (indicatorId: string, range: [number, number]) => {
    setFilterRanges(prev => ({
      ...prev,
      [indicatorId]: range
    }));
    
    // Apply filters with the updated ranges, don't skip filters here
    applyFiltersAndOptions(allMaterials, false);
  };

  // Add state for selected indicators to filter
  const [selectedIndicatorFilters, setSelectedIndicatorFilters] = useState<
    string[]
  >(["ubp21Total", "gwpTotal", "primaryEnergyNonRenewableTotal"]);

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
        } else if (indicator.id === "primaryEnergyNonRenewableTotal") {
          initialRanges[indicator.id] = [0, 1000];
        } else {
          initialRanges[indicator.id] = [0, 100];
        }
      });
      setIndicatorRanges(initialRanges);
    }
  }, [indicators]);

  // Add effect to trigger filtering when ranges change
  useEffect(() => {
    applyFiltersAndOptions(allMaterials, false);
  }, [
    indicatorRanges,
    selectedIndicatorFilters,
    allMaterials,
    filters,
    displayOptions,
    searchTerm,
  ]);

  // Add state for sorting
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc' | null;
  }>({ key: '', direction: null });

  // Add sorting function
  const onSort = (columnKey: string) => {
    setSortConfig((currentSort) => {
      if (currentSort.key === columnKey) {
        // Cycle through: asc -> desc -> no sort
        return {
          key: columnKey,
          direction: currentSort.direction === 'asc' ? 'desc' : 
                    currentSort.direction === 'desc' ? null : 'asc'
        };
      }
      // First click on a column sets ascending sort
      return { key: columnKey, direction: 'asc' };
    });
  };

  // Update material sorting
  const sortedMaterials = useMemo(() => {
    if (!sortConfig.direction || !sortConfig.key) {
      return displayedMaterials;
    }

    return [...displayedMaterials].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle null values
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string values
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();
      return sortConfig.direction === 'asc' 
        ? aString.localeCompare(bString)
        : bString.localeCompare(aString);
    });
  }, [displayedMaterials, sortConfig]);

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
                        false
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
                          value={filterRanges[indicatorId] || [0, maxIndicatorValues[indicatorId] || 100]}
                          min={0}
                          max={maxIndicatorValues[indicatorId] || 100}
                          step={1}
                          minStepsBetweenThumbs={1}
                          onValueChange={(value) => {
                            handleFilterChange(indicatorId, value as [number, number]);
                          }}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>{filterRanges[indicatorId]?.[0] || 0}</span>
                          <span>
                            {filterRanges[indicatorId]?.[1] || maxIndicatorValues[indicatorId] || 100}
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
                    if (!column) return null;
                    
                    const headerContent = (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-sm">
                            {column.label}
                          </div>
                          <button
                            onClick={() => onSort(columnKey)}
                            className="p-0 h-4 w-4 hover:text-foreground text-muted-foreground/50"
                          >
                            {sortConfig.key === columnKey ? (
                              sortConfig.direction === 'asc' ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : sortConfig.direction === 'desc' ? (
                                <ArrowDown className="h-4 w-4" />
                              ) : (
                                <ArrowUpDown className="h-4 w-4" />
                              )
                            ) : (
                              <ArrowUpDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {column.unit && (
                          <div className="text-xs text-muted-foreground">
                            {column.unit}
                          </div>
                        )}
                      </div>
                    );

                    return (
                      <TableHead key={columnKey} className="min-w-[120px]">
                        {column.description ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                {headerContent}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs text-sm">{column.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          headerContent
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
                ) : sortedMaterials.length > 0 ? (
                  sortedMaterials.map((material) => (
                    <TableRow key={material.uuid}>
                      {visibleColumns.map((columnKey) => (
                        <TableCell key={columnKey}>
                          {formatCellValue(material[columnKey])}
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
