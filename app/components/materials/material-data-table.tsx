import React, { useState, useEffect } from "react";
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
  columns: Array<{ key: string; label: string }>;
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

// Add the MaterialsTableComponent
export function MaterialsTableComponent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "id",
    "nameDE",
    "group",
    "ubp21Total",
    "gwpTotal",
  ]);
  const [loading, setLoading] = useState(true);
  const [allMaterials, setAllMaterials] = useState<KBOBMaterial[]>([]); // Store all materials
  const [displayedMaterials, setDisplayedMaterials] = useState<KBOBMaterial[]>(
    []
  ); // Filtered/grouped materials
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Add columns definition
  const columns = [
    { key: "id", label: "ID" },
    { key: "nameDE", label: "Name (DE)" },
    { key: "nameFR", label: "Name (FR)" },
    { key: "group", label: "Group" },
    { key: "density", label: "Density" },
    { key: "unit", label: "Unit" },
    { key: "ubp21Total", label: "UBP21 Total" },
    { key: "ubp21Production", label: "UBP21 Production" },
    { key: "ubp21Disposal", label: "UBP21 Disposal" },
    { key: "gwpTotal", label: "GWP Total" },
    { key: "gwpProduction", label: "GWP Production" },
    { key: "gwpDisposal", label: "GWP Disposal" },
    { key: "biogenicCarbon", label: "Biogenic Carbon" },
  ];

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

  // Fetch all materials once on component mount
  const fetchAllMaterials = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/kbob/materials");
      const data = await response.json();

      if (data.materials?.data) {
        setAllMaterials(data.materials.data);
        applyFiltersAndOptions(data.materials.data, filters, displayOptions);
      } else {
        console.error("Invalid data format received:", data);
        setAllMaterials([]);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
      setAllMaterials([]);
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

    // Apply text filters
    if (currentFilters.idNumber) {
      filtered = filtered.filter((m) =>
        m.id.toLowerCase().includes(currentFilters.idNumber.toLowerCase())
      );
    }
    if (currentFilters.group) {
      filtered = filtered.filter((m) =>
        m.group.toLowerCase().includes(currentFilters.group.toLowerCase())
      );
    }
    if (currentFilters.disposal) {
      filtered = filtered.filter(
        (m) =>
          m.disposalDE
            .toLowerCase()
            .includes(currentFilters.disposal.toLowerCase()) ||
          m.disposalFR
            .toLowerCase()
            .includes(currentFilters.disposal.toLowerCase())
      );
    }

    // Apply range filters
    filtered = filtered.filter((m) => {
      const ubp = m.ubp21Total || 0;
      const gwp = m.gwpTotal || 0;
      // Add appropriate field for primaryEnergy when available

      return (
        ubp >= currentFilters.ubpTotal[0] &&
        ubp <= currentFilters.ubpTotal[1] &&
        gwp >= currentFilters.greenhouseGasEmissionsTotal[0] &&
        gwp <= currentFilters.greenhouseGasEmissionsTotal[1]
      );
    });

    // Apply search term
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((material) =>
        Object.values(material).some((value) =>
          value?.toString().toLowerCase().includes(searchLower)
        )
      );
    }

    // Update displayed materials and pagination
    setDisplayedMaterials(filtered);
    setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE));
    setPage(1); // Reset to first page when filters change
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

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>KBOB Materials</CardTitle>
        </CardHeader>
        <CardContent>
          <MaterialsFiltersOptions
            onFiltersChange={handleFiltersChange}
            onOptionsChange={handleOptionsChange}
          />

          {/* Search and columns dropdown */}
          <div className="flex gap-4 mb-4">
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
                  // Apply search filter immediately
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
                <Button variant="outline">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {columns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.key}
                    checked={visibleColumns.includes(column.key)}
                    onCheckedChange={() => {
                      toggleColumn(column.key);
                    }}
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Table section */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.map((columnKey) => (
                    <TableHead key={columnKey} className="whitespace-nowrap">
                      {columns.find((col) => col.key === columnKey)?.label}
                    </TableHead>
                  ))}
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

          {/* Pagination section with current page indicator */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={loading || page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
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
