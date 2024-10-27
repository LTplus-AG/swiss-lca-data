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

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleOptionChange = (key, value) => {
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
    { id: "UBP (Total)", label: "UBP (Total)" },
    { id: "UBP (Herstellung)", label: "UBP (Herstellung)" },
    { id: "UBP (Entsorgung)", label: "UBP (Entsorgung)" },
    {
      id: "Primärenergie gesamt, Total [kWh oil-eq]",
      label: "Primärenergie gesamt, Total",
    },
    {
      id: "Primärenergie gesamt, Herstellung total [kWh oil-eq]",
      label: "Primärenergie gesamt, Herstellung total",
    },
    {
      id: "Primärenergie gesamt, Entsorgung [kWh oil-eq]",
      label: "Primärenergie gesamt, Entsorgung",
    },
    {
      id: "Primärenergie erneuerbar, Total [kWh oil-eq]",
      label: "Primärenergie erneuerbar, Total",
    },
    {
      id: "Primärenergie nicht erneuerbar, Total [kWh oil-eq]",
      label: "Primärenergie nicht erneuerbar, Total",
    },
    {
      id: "Treibhausgasemissionen, Total [kg CO2-eq]",
      label: "Treibhausgasemissionen, Total",
    },
    {
      id: "Treibhausgasemissionen, Herstellung [kg CO2-eq]",
      label: "Treibhausgasemissionen, Herstellung",
    },
    {
      id: "Treibhausgasemissionen, Entsorgung [kg CO2-eq]",
      label: "Treibhausgasemissionen, Entsorgung",
    },
    {
      id: "Biogener Kohlenstoff, im Produkt enthalten [kg C]",
      label: "Biogener Kohlenstoff, im Produkt enthalten",
    },
  ];

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
      </CardContent>
    </Card>
  );
}
