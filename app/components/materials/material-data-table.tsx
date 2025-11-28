import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { clientConfig } from "@/lib/client-config";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Search,
  SlidersHorizontal,
  History,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


// KBOBMaterial interface
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
  primaryEnergyTotal: number | null;
  primaryEnergyProductionTotal: number | null;
  primaryEnergyProductionEnergetic: number | null;
  primaryEnergyProductionMaterial: number | null;
  primaryEnergyDisposal: number | null;
  primaryEnergyRenewableTotal: number | null;
  primaryEnergyRenewableProductionTotal: number | null;
  primaryEnergyRenewableProductionEnergetic: number | null;
  primaryEnergyRenewableProductionMaterial: number | null;
  primaryEnergyRenewableDisposal: number | null;
  primaryEnergyNonRenewableTotal: number | null;
  primaryEnergyNonRenewableProductionTotal: number | null;
  primaryEnergyNonRenewableProductionEnergetic: number | null;
  primaryEnergyNonRenewableProductionMaterial: number | null;
  primaryEnergyNonRenewableDisposal: number | null;
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
    "density",
    "unit",
    "ubp21Total",
    "gwpTotal",
    "primaryEnergyNonRenewableTotal",
  ]);
  const [loading, setLoading] = useState(true);
  const [allMaterials, setAllMaterials] = useState<KBOBMaterial[]>([]); // Store all materials
  const [displayedMaterials, setDisplayedMaterials] = useState<KBOBMaterial[]>( // Filtered/grouped materials
    []
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSizeOptions = [20, 50, 100, "All"] as const;
  type PageSizeOption = (typeof pageSizeOptions)[number];
  const [pageSize, setPageSize] = useState<PageSizeOption>(20);
  const ITEMS_PER_PAGE =
    typeof pageSize === "number" ? pageSize : Number.MAX_SAFE_INTEGER;

  // Add state for indicators
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  
  // Add state for versions
  const [selectedVersion, setSelectedVersion] = useState<string>("current");
  const [availableVersions, setAvailableVersions] = useState<any[]>([]);

  // Fetch versions on mount
  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const res = await fetch("/api/kbob/versions", {
          headers: {
            Authorization: `Bearer ${clientConfig.API_KEY}`,
          },
        });
        const data = await res.json();
        if (data.versions && Array.isArray(data.versions)) {
          setAvailableVersions(data.versions);
        }
      } catch (e) {
        console.error("Failed to fetch versions", e);
      }
    };
    fetchVersions();
  }, []);

  // Add useEffect to fetch indicators
  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        const response = await fetch("/api/kbob/indicators", {
          headers: {
            Authorization: `Bearer ${clientConfig.API_KEY}`,
          },
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
      { key: "density", label: "Density", description: "Material density" },
      { key: "unit", label: "Unit", description: "Measurement unit" },
      { key: "ubp21Total", label: "UBP Total", unit: "UBP'21" },
      { key: "gwpTotal", label: "GWP Total", unit: "kg CO₂ eq" },
      {
        key: "primaryEnergyNonRenewableTotal",
        label: "Primary Energy Non-Renewable Total",
        unit: "kWh oil-eq",
      },
      // Keep other columns but they won't be visible by default
      ...indicators
        .filter((indicator) => !visibleColumns.includes(indicator.id))
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

  // Update fetchAllMaterials function to use pagination
  const fetchMaterials = async (currentPage: number) => {
    try {
      setLoading(true);
      const pageSizeParam = pageSize === "All" ? "all" : pageSize;
      const searchQuery = searchTerm ? `&search=${searchTerm}` : "";
      const versionParam = selectedVersion && selectedVersion !== "current" ? `&version=${selectedVersion}` : "";
      
      const response = await fetch(
        `/api/kbob/materials?page=${currentPage}&pageSize=${pageSizeParam}${searchQuery}${versionParam}`,
        {
          headers: {
            Authorization: `Bearer ${clientConfig.API_KEY}`,
          },
        }
      );
      const data = await response.json();

      if (data.success) {
        setAllMaterials(data.materials);
        setDisplayedMaterials(data.materials);
        setTotalPages(data.totalPages);
        setPage(data.currentPage);
      } else {
        console.error("Invalid data format received:", data);
        setDisplayedMaterials([]);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
      setDisplayedMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  // Update useEffect to use the new fetch function
  useEffect(() => {
    fetchMaterials(page);
  }, [page, searchTerm, pageSize, selectedVersion]);

  // Add pagination range function
  const getPaginationRange = (currentPage: number, totalPages: number) => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    range.push(1);

    if (totalPages <= 1) {
      return range;
    }

    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i < totalPages && i > 1) {
        range.push(i);
      }
    }
    range.push(totalPages);

    for (let i = 0; i < range.length; i++) {
      if (l) {
        if (range[i] - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (range[i] - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(range[i]);
      l = range[i];
    }

    return rangeWithDots;
  };

  // Calculate max values for indicators with 5% buffer
  const maxIndicatorValues = useMemo(() => {
    const maxValues: Record<string, number> = {};

    if (allMaterials.length > 0) {
      indicators.forEach((indicator) => {
        const max = Math.max(
          ...allMaterials.map((material) =>
            material[indicator.id] !== null ? material[indicator.id] : 0
          )
        );
        // Add 5% buffer and round to nearest integer
        maxValues[indicator.id] = Math.round(max * 1.05);
      });
    }

    return maxValues;
  }, [allMaterials, indicators]);

  // Update filterRanges state to use dynamic max values
  const [filterRanges, setFilterRanges] = useState<
    Record<string, [number, number]>
  >({});

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
    setFilterRanges((prev) => ({
      ...prev,
      [indicatorId]: range,
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
    direction: "asc" | "desc" | null;
  }>({ key: "", direction: null });

  // Add sorting function
  const onSort = (columnKey: string) => {
    setSortConfig((currentSort) => {
      if (currentSort.key === columnKey) {
        // Cycle through: asc -> desc -> no sort
        return {
          key: columnKey,
          direction:
            currentSort.direction === "asc"
              ? "desc"
              : currentSort.direction === "desc"
              ? null
              : "asc",
        };
      }
      // First click on a column sets ascending sort
      return { key: columnKey, direction: "asc" };
    });
  };

  // First, define the indicator filter states and handlers
  const [indicatorRangeFilters, setIndicatorRangeFilters] = useState<
    Record<string, [number, number]>
  >({});

  const handleIndicatorRangeChange = (id: string, range: [number, number]) => {
    console.log("Indicator range filter updated for", id, "to", range);
    setIndicatorRangeFilters((prev) => ({ ...prev, [id]: range }));
  };

  // Then compute filteredMaterials
  const filteredMaterials = useMemo(() => {
    return allMaterials.filter((material) => {
      // Apply both search and indicator filters
      const matchesSearch = searchTerm
        ? material.nameDE?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          material.group?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      const matchesIndicators = Object.keys(indicatorRangeFilters).every(
        (indId) => {
          const [filterMin, filterMax] = indicatorRangeFilters[indId];
          const value = material[indId];
          if (value === null || value === undefined) return true;
          return value >= filterMin && value <= filterMax;
        }
      );

      return matchesSearch && matchesIndicators;
    });
  }, [allMaterials, indicatorRangeFilters, searchTerm]);

  // Then define sortedMaterials using the filtered list
  const sortedMaterials = useMemo(() => {
    if (!sortConfig.direction || !sortConfig.key) {
      return filteredMaterials;
    }
    return [...filteredMaterials].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      // Handle null values
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;
      // Handle numeric values
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }
      // Fallback to string compare
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();
      return sortConfig.direction === "asc"
        ? aString.localeCompare(bString)
        : bString.localeCompare(aString);
    });
  }, [filteredMaterials, sortConfig]);

  // Finally, define getCurrentPageItems
  const getCurrentPageItems = () => {
    if (pageSize === "All") {
      return sortedMaterials;
    }
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return sortedMaterials.slice(start, end);
  };

  // Fetch materials on mount
  useEffect(() => {
    fetchMaterials(1);
  }, []);

  // NEW: Dummy default max value for indicators (replace with dynamic values if available)
  const defaultIndicatorMax = 100;

  // DEBUG: Log filtering conditions and counts
  useEffect(() => {
    console.log("DEBUG: searchTerm =", searchTerm);
    console.log("DEBUG: indicatorRangeFilters =", indicatorRangeFilters);
    console.log("DEBUG: allMaterials count =", allMaterials.length);
    console.log("DEBUG: filteredMaterials count =", filteredMaterials.length);
    // Optionally, log a sample of filtered materials
    if (filteredMaterials.length > 0) {
      console.log("DEBUG: Sample filtered material:", filteredMaterials[0]);
    }
  }, [searchTerm, indicatorRangeFilters, allMaterials, filteredMaterials]);

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>KBOB Materials</CardTitle>
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Version" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Version</SelectItem>
                  {availableVersions.map((v) => {
                    const date = new Date(v.publishDate || v.date);
                    const day = date.getDate();
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const month = monthNames[date.getMonth()];
                    const year = date.getFullYear();
                    const formattedDate = `${day} ${month} ${year}`;
                    return (
                      <SelectItem key={v.version} value={v.version}>
                        {v.version} ({formattedDate})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
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
                <Label>Filter by Indicator Ranges</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full mt-2">
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Adjust Indicator Ranges
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[400px] max-h-[600px] overflow-y-auto"
                    align="end"
                  >
                    <div className="p-2">
                      {indicators.map((indicator, index) => (
                        <div
                          key={`${indicator.id}-${index}`}
                          className="mb-4 border-b pb-2"
                        >
                          <div className="flex justify-between">
                            <span>{indicator.label}</span>
                            <span>
                              {indicatorRangeFilters[indicator.id]
                                ? `${
                                    indicatorRangeFilters[indicator.id][0]
                                  } - ${indicatorRangeFilters[indicator.id][1]}`
                                : `0 - ${
                                    maxIndicatorValues[indicator.id] ||
                                    defaultIndicatorMax
                                  }`}
                            </span>
                          </div>
                          <div className="flex space-x-2 items-center mt-1">
                            <Input
                              type="number"
                              className="w-20"
                              value={
                                indicatorRangeFilters[indicator.id]?.[0] ?? 0
                              }
                              onChange={(e) => {
                                const newLower = Number(e.target.value);
                                const current = indicatorRangeFilters[
                                  indicator.id
                                ] || [
                                  0,
                                  maxIndicatorValues[indicator.id] ||
                                    defaultIndicatorMax,
                                ];
                                handleIndicatorRangeChange(indicator.id, [
                                  newLower,
                                  current[1],
                                ]);
                              }}
                            />
                            <Slider
                              min={0}
                              max={
                                maxIndicatorValues[indicator.id] ||
                                defaultIndicatorMax
                              }
                              step={1}
                              value={
                                indicatorRangeFilters[indicator.id] || [
                                  0,
                                  maxIndicatorValues[indicator.id] ||
                                    defaultIndicatorMax,
                                ]
                              }
                              onValueChange={(val: number[]) =>
                                handleIndicatorRangeChange(indicator.id, [
                                  val[0],
                                  val[1],
                                ])
                              }
                            />
                            <Input
                              type="number"
                              className="w-20"
                              value={
                                indicatorRangeFilters[indicator.id]?.[1] ??
                                (maxIndicatorValues[indicator.id] ||
                                  defaultIndicatorMax)
                              }
                              onChange={(e) => {
                                const newUpper = Number(e.target.value);
                                const current = indicatorRangeFilters[
                                  indicator.id
                                ] || [
                                  0,
                                  maxIndicatorValues[indicator.id] ||
                                    defaultIndicatorMax,
                                ];
                                handleIndicatorRangeChange(indicator.id, [
                                  current[0],
                                  newUpper,
                                ]);
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                              sortConfig.direction === "asc" ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : sortConfig.direction === "desc" ? (
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
                                <p className="max-w-xs text-sm">
                                  {column.description}
                                </p>
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
                  getCurrentPageItems().map((material) => (
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
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setPageSize(
                      newValue === "All"
                        ? "All"
                        : (Number(newValue) as PageSizeOption)
                    );
                  }}
                  className="h-8 w-[70px] rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-muted-foreground">entries</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(1)}
                disabled={loading || page === 1}
              >
                First
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={loading || page === 1}
              >
                Previous
              </Button>
              <div className="flex gap-1">
                {getPaginationRange(page, totalPages).map((pageNum, idx) => (
                  <Button
                    key={idx}
                    variant={pageNum === page ? "default" : "outline"}
                    onClick={() => {
                      if (typeof pageNum === "number") {
                        setPage(pageNum);
                      }
                    }}
                    disabled={loading || pageNum === "..."}
                    className={cn(
                      "min-w-[40px]",
                      pageNum === "..." && "cursor-default hover:bg-background"
                    )}
                  >
                    {pageNum}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={loading || page === totalPages}
              >
                Next
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage(totalPages)}
                disabled={loading || page === totalPages}
              >
                Last
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to detect if user is in EU region
function detectEULocale(): string {
  if (typeof navigator === "undefined") {
    // Default to EU locale (Swiss/German) for server-side rendering
    return "de-CH";
  }
  
  const browserLocale = navigator.language || navigator.languages?.[0] || "en";
  const localeLower = browserLocale.toLowerCase();
  
  // EU language codes
  const euLanguages = ["de", "fr", "it", "es", "pt", "nl", "pl", "cs", "sk", "sl", "hu", "ro", "bg", "hr", "el", "fi", "sv", "da", "et", "lv", "lt", "mt"];
  
  // Check if browser locale starts with EU language code
  const isEULocale = euLanguages.some(lang => localeLower.startsWith(lang.toLowerCase()));
  
  // Also check timezone as fallback (EU timezones)
  let isEUTimezone = false;
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const euTimezones = ["Europe/", "Africa/Casablanca", "Africa/Algiers", "Africa/Tunis"];
    isEUTimezone = euTimezones.some(tz => timezone.includes(tz));
  } catch (e) {
    // Ignore timezone detection errors
  }
  
  // If EU language detected, use it
  if (isEULocale) {
    // Use the browser locale if it's EU, or default to de-CH for Swiss context
    if (browserLocale.includes("CH") || browserLocale.includes("ch")) {
      return browserLocale;
    }
    // For other EU locales, use the language code with CH for Swiss context
    const langCode = browserLocale.split("-")[0];
    return langCode + "-CH";
  }
  
  // If timezone suggests EU but language doesn't, default to EU formatting
  if (isEUTimezone) {
    return "de-CH"; // Default to Swiss/German formatting
  }
  
  // Check if locale is explicitly US/Canada (must be explicit, not just "en")
  if (localeLower === "en-us" || localeLower === "en-ca" || localeLower.startsWith("en-us") || localeLower.startsWith("en-ca")) {
    return "en-US";
  }
  
  // If just "en" without country code, check timezone or default to EU for Swiss app
  if (localeLower === "en" || localeLower.startsWith("en-")) {
    // If timezone suggests EU, use EU formatting
    if (isEUTimezone) {
      return "de-CH";
    }
    // Otherwise, if it's explicitly en-GB or other non-US English, use EU formatting
    if (localeLower.includes("gb") || localeLower.includes("ie") || localeLower.includes("au") || localeLower.includes("nz")) {
      return "en-GB"; // UK uses EU-style formatting (space/comma)
    }
    // Default to EU for Swiss app context
    return "de-CH";
  }
  
  // Default to EU (Swiss) formatting since this is a Swiss LCA app
  return "de-CH";
}

// Add helper function to format cell values with locale-aware formatting
function formatCellValue(value: any): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "number") {
    // Detect user's locale - prefer EU formatting for Swiss LCA app
    const locale = detectEULocale();
    
    // For numbers >= 1000, show no decimal places with thousand separators
    if (Math.abs(value) >= 1000) {
      return new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      }).format(Math.round(value));
    }
    
    // Check if the number is effectively a whole number (all decimals are zeros)
    const roundedToZero = Math.round(value);
    const isWholeNumber = Math.abs(value - roundedToZero) < 0.0001;
    
    // If it's a whole number, format without decimals
    if (isWholeNumber) {
      return new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      }).format(roundedToZero);
    }
    
    // For numbers < 1000 with decimals, show up to 3 decimal places, remove trailing zeros
    // Intl.NumberFormat with minimumFractionDigits: 0 automatically removes trailing zeros
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: 3,
      minimumFractionDigits: 0,
    }).format(value);
  }
  return value.toString();
}
