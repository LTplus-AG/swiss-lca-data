"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, SlidersHorizontal } from "lucide-react";

interface FiltersProps {
  onFiltersChange: (filters: any) => void;
  onOptionsChange: (options: any) => void;
}

export function MaterialsFiltersOptions({
  onFiltersChange,
  onOptionsChange,
}: FiltersProps) {
  const [filters, setFilters] = useState({
    idNumber: "",
    group: "",
    disposal: "",
    ubpTotal: [0, 597],
    primaryEnergyTotal: [31, 663],
    greenhouseGasEmissionsTotal: [0, 1000],
  });

  const [options, setOptions] = useState({
    language: "de", // 'de' for German, 'fr' for French
    columns: [
      "ID-Nummer [KBOB / ecobau / IPB  2009/1:2022, Version 5]",
      "UUID-Nummer",
      "[group]",
      "BAUMATERIALIEN",
      "Entsorgung",
      "UBP (Total)",
      "Primärenergie gesamt, Total [kWh oil-eq]",
      "Treibhausgasemissionen, Total [kg CO2-eq]",
    ],
  });

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleOptionChange = (key: keyof typeof options, value: any) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
    onOptionsChange({ ...options, [key]: value });
  };

  const columnOptions = [
    {
      id: "ID-Nummer [KBOB / ecobau / IPB  2009/1:2022, Version 5]",
      label: "ID-Nummer",
    },
    { id: "UUID-Nummer", label: "UUID-Nummer" },
    { id: "[group]", label: "Gruppe" },
    { id: "BAUMATERIALIEN", label: "Baumaterialien" },
    { id: "ID-Nummer Entsorgung", label: "ID-Nummer Entsorgung" },
    { id: "Entsorgung", label: "Entsorgung" },
    { id: "Rohdichte/ Flächenmasse", label: "Rohdichte/Flächenmasse" },
    { id: "Bezug", label: "Bezug" },
    { id: "UBP (Total)", label: "UBP Total [UBP'21]" },
    { id: "UBP (Herstellung)", label: "UBP Herstellung [UBP'21]" },
    { id: "UBP (Entsorgung)", label: "UBP Entsorgung [UBP'21]" },
    {
      id: "Primärenergie gesamt, Total [kWh oil-eq]",
      label: "Primärenergie gesamt, Total [kWh oil-eq]",
    },
    {
      id: "Primärenergie gesamt, Herstellung total [kWh oil-eq]",
      label: "Primärenergie gesamt, Herstellung total [kWh oil-eq]",
    },
    {
      id: "Primärenergie gesamt, Entsorgung [kWh oil-eq]",
      label: "Primärenergie gesamt, Entsorgung [kWh oil-eq]",
    },
    {
      id: "Primärenergie erneuerbar, Total [kWh oil-eq]",
      label: "Primärenergie erneuerbar, Total [kWh oil-eq]",
    },
    {
      id: "Primärenergie nicht erneuerbar, Total [kWh oil-eq]",
      label: "Primärenergie nicht erneuerbar, Total [kWh oil-eq]",
    },
    {
      id: "Treibhausgasemissionen, Total [kg CO2-eq]",
      label: "Treibhausgasemissionen, Total [kg CO₂ eq]",
    },
    {
      id: "Treibhausgasemissionen, Herstellung [kg CO2-eq]",
      label: "Treibhausgasemissionen, Herstellung [kg CO₂ eq]",
    },
    {
      id: "Treibhausgasemissionen, Entsorgung [kg CO2-eq]",
      label: "Treibhausgasemissionen, Entsorgung [kg CO₂ eq]",
    },
    {
      id: "Biogener Kohlenstoff, im Produkt enthalten [kg C]",
      label: "Biogener Kohlenstoff, im Produkt enthalten [kg C]",
    },
  ];

  // NEW: Indicator Range Filters state––each indicator is initialized from 0 to its maximum
  // initialMaxValues is passed by props; fallback to 100 if not provided.
  const [indicatorFilters, setIndicatorFilters] = useState<
    Record<string, [number, number]>
  >(() => {
    const initial: Record<string, [number, number]> = {};
    // indicatorOptions contains the list of indicator selections (with id in value)
    indicatorOptions.forEach((option) => {
      const maxVal = initialMaxValues[option.value] || 100;
      initial[option.value] = [0, maxVal];
    });
    return initial;
  });

  // NEW: Handler to update an indicator filter range with debug logging
  const handleIndicatorFilterChange = (
    indicatorId: string,
    range: [number, number]
  ) => {
    console.log("Indicator", indicatorId, "range changed to", range);
    setIndicatorFilters((prev) => {
      const newFilters = { ...prev, [indicatorId]: range };
      // Propagate the new indicator filters along with other filters
      onFiltersChange({ ...filters, indicatorFilters: newFilters });
      return newFilters;
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Filters and Options</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="idNumber">ID-Nummer</Label>
                  <Input
                    id="idNumber"
                    placeholder="Enter ID-Nummer"
                    value={filters.idNumber}
                    onChange={(e) =>
                      handleFilterChange("idNumber", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group">Group</Label>
                  <Input
                    id="group"
                    placeholder="Enter group"
                    value={filters.group}
                    onChange={(e) =>
                      handleFilterChange("group", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disposal">Disposal</Label>
                  <Input
                    id="disposal"
                    placeholder="Enter disposal"
                    value={filters.disposal}
                    onChange={(e) =>
                      handleFilterChange("disposal", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>UBP Total Range</Label>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <Input
                      type="number"
                      value={filters.ubpTotal[0]}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        const newRange = [value, filters.ubpTotal[1]];
                        handleFilterChange("ubpTotal", newRange);
                      }}
                      min={0}
                      max={filters.ubpTotal[1]}
                    />
                    <Input
                      type="number"
                      value={filters.ubpTotal[1]}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        const newRange = [filters.ubpTotal[0], value];
                        handleFilterChange("ubpTotal", newRange);
                      }}
                      min={filters.ubpTotal[0]}
                      max={597}
                    />
                  </div>
                  <Slider
                    min={0}
                    max={597}
                    step={1}
                    value={filters.ubpTotal}
                    onValueChange={(value) =>
                      handleFilterChange("ubpTotal", value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Primary Energy Total Range</Label>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <Input
                      type="number"
                      value={filters.primaryEnergyTotal[0]}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        const newRange = [value, filters.primaryEnergyTotal[1]];
                        handleFilterChange("primaryEnergyTotal", newRange);
                      }}
                      min={0}
                      max={filters.primaryEnergyTotal[1]}
                    />
                    <Input
                      type="number"
                      value={filters.primaryEnergyTotal[1]}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        const newRange = [filters.primaryEnergyTotal[0], value];
                        handleFilterChange("primaryEnergyTotal", newRange);
                      }}
                      min={filters.primaryEnergyTotal[0]}
                      max={663}
                    />
                  </div>
                  <Slider
                    min={31}
                    max={663}
                    step={1}
                    value={filters.primaryEnergyTotal}
                    onValueChange={(value) =>
                      handleFilterChange("primaryEnergyTotal", value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Greenhouse Gas Emissions Total Range</Label>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <Input
                      type="number"
                      value={filters.greenhouseGasEmissionsTotal[0]}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        const newRange = [
                          value,
                          filters.greenhouseGasEmissionsTotal[1],
                        ];
                        handleFilterChange(
                          "greenhouseGasEmissionsTotal",
                          newRange
                        );
                      }}
                      min={0}
                      max={filters.greenhouseGasEmissionsTotal[1]}
                    />
                    <Input
                      type="number"
                      value={filters.greenhouseGasEmissionsTotal[1]}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        const newRange = [
                          filters.greenhouseGasEmissionsTotal[0],
                          value,
                        ];
                        handleFilterChange(
                          "greenhouseGasEmissionsTotal",
                          newRange
                        );
                      }}
                      min={filters.greenhouseGasEmissionsTotal[0]}
                      max={1000}
                    />
                  </div>
                  <Slider
                    min={0}
                    max={1000}
                    step={1}
                    value={filters.greenhouseGasEmissionsTotal}
                    onValueChange={(value) =>
                      handleFilterChange("greenhouseGasEmissionsTotal", value)
                    }
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Options
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={options.language}
                    onValueChange={(value) =>
                      handleOptionChange("language", value)
                    }
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Visible Columns</Label>
                  {columnOptions.map((column) => (
                    <div
                      key={column.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={column.id}
                        checked={options.columns.includes(column.id)}
                        onCheckedChange={(checked) => {
                          const newColumns = checked
                            ? [...options.columns, column.id]
                            : options.columns.filter((c) => c !== column.id);
                          handleOptionChange("columns", newColumns);
                        }}
                      />
                      <Label htmlFor={column.id}>{column.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* NEW: Indicator Range Filters Section */}
        <div className="mt-4">
          <Label>Filter by Indicator Ranges</Label>
          {indicatorOptions.map((option) => (
            <div key={option.value} className="mb-4 border rounded p-2">
              <div className="flex justify-between mb-1">
                <span>{option.label}</span>
                <span>
                  {indicatorFilters[option.value][0]} -{" "}
                  {indicatorFilters[option.value][1]}
                </span>
              </div>
              <div className="flex space-x-2 items-center">
                <Input
                  type="number"
                  className="w-20"
                  value={indicatorFilters[option.value][0]}
                  onChange={(e) => {
                    const newLower = Number(e.target.value);
                    handleIndicatorFilterChange(option.value, [
                      newLower,
                      indicatorFilters[option.value][1],
                    ]);
                  }}
                />
                <Slider
                  min={0}
                  max={initialMaxValues[option.value] || 100}
                  step={1}
                  value={indicatorFilters[option.value]}
                  onValueChange={(val) =>
                    handleIndicatorFilterChange(option.value, [val[0], val[1]])
                  }
                />
                <Input
                  type="number"
                  className="w-20"
                  value={indicatorFilters[option.value][1]}
                  onChange={(e) => {
                    const newUpper = Number(e.target.value);
                    handleIndicatorFilterChange(option.value, [
                      indicatorFilters[option.value][0],
                      newUpper,
                    ]);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Assume indicatorOptions and initialMaxValues are passed to this component via props or context.
interface Option {
  label: string;
  value: string;
}
interface MaterialsFiltersOptionsProps extends FiltersProps {
  indicatorOptions: Option[];
  initialMaxValues: Record<string, number>;
}
