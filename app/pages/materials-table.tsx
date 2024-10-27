"use client"

import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Custom MultiSelect component
const MultiSelect = ({ options, value, onChange, placeholder }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {value.length > 0 ? `${value.length} selected` : placeholder}
          <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={value.includes(option.value)}
            onCheckedChange={(checked) => {
              if (checked) {
                onChange([...value, option.value])
              } else {
                onChange(value.filter((item) => item !== option.value))
              }
            }}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Mock data (replace with actual API call in a real application)
const mockData = [
  {
    id: "1.001",
    uuid: "A05F4D90-D030-49B6-A08A-BAD5228E3552",
    group: "Beton",
    name: "Magerbeton (ohne Bewehrung)",
    disposal: "Entsorgung, Beton",
    density: 2150,
    unit: "kg",
    ubpTotal: 104,
    ubpProduction: 68.8,
    ubpDisposal: 35.4,
    ghgTotal: 0.0628,
    ghgProduction: 0.0502,
    ghgDisposal: 0.0126,
    nameFr: "Béton maigre (sans armature)",
  },
  {
    id: "6.008",
    uuid: "92E11D9B-9BC5-4032-BB06-2082CE3D8AFD",
    group: "Metallbaustoffe",
    name: "Kupferblech, blank",
    disposal: "Entsorgung, Nichteisenmetalle",
    density: 8900,
    unit: "kg",
    ubpTotal: 24500,
    ubpProduction: 24500,
    ubpDisposal: 19.8,
    ghgTotal: 2.2,
    ghgProduction: 2.2,
    ghgDisposal: 0.00792,
    nameFr: "Tôle de cuivre, nue",
  },
  {
    id: "10.016.01",
    uuid: "109E7CA4-9DB1-46E0-AAA8-EF6E159A7A63",
    group: "Wärmedämmstoffe",
    name: "Flachsfasern, MAGRIPOL, Premium",
    disposal: "Entsorgung, Flachsfaser-Dämmung",
    density: 30,
    unit: "kg",
    ubpTotal: 2880,
    ubpProduction: 2510,
    ubpDisposal: 370,
    ghgTotal: 0.98,
    ghgProduction: 0.75,
    ghgDisposal: 0.235,
    nameFr: "Isolation en lin, MAGRIPOL, Premium",
  },
  {
    id: "7.016",
    uuid: "FB830352-0350-46F9-BF46-73733C576386",
    group: "Holz und Holzwerkstoffe",
    name: "Spanplatte, UF-gebunden, beschichtet, Trockenbereich",
    disposal: "Entsorgung, Spanplatte, 10% Bindemittel, 3.5% MF-gebunden",
    density: 640,
    unit: "kg",
    ubpTotal: 1210,
    ubpProduction: 1090,
    ubpDisposal: 122,
    ghgTotal: 0.735,
    ghgProduction: 0.641,
    ghgDisposal: 0.095,
    nameFr: "Panneau de particules, colle UF, enduit, zone sèche",
  },
]

type SortConfig = {
  key: string
  direction: "ascending" | "descending"
}

export function MaterialsTableComponent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "id", direction: "ascending" })
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "id",
    "name",
    "group",
    "density",
    "ubpTotal",
    "ghgTotal",
  ])
  const [groupByMaterial, setGroupByMaterial] = useState(false)
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([])
  const [maxValues, setMaxValues] = useState<Record<string, number>>({})
  const [filterOption, setFilterOption] = useState("material")

  const materialGroups = useMemo(() => {
    return Array.from(new Set(mockData.map(item => item.group)))
  }, [])

  const indicatorOptions = [
    { label: "UBP Total", value: "ubpTotal" },
    { label: "UBP Production", value: "ubpProduction" },
    { label: "UBP Disposal", value: "ubpDisposal" },
    { label: "GHG Total", value: "ghgTotal" },
    { label: "GHG Production", value: "ghgProduction" },
    { label: "GHG Disposal", value: "ghgDisposal" },
  ]

  const initialMaxValues = useMemo(() => {
    return indicatorOptions.reduce((acc, { value }) => {
      acc[value] = Math.max(...mockData.map(item => item[value]))
      return acc
    }, {} as Record<string, number>)
  }, [])

  const sortedData = useMemo(() => {
    const sortableData = [...mockData]
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    }
    return sortableData
  }, [mockData, sortConfig])

  const filteredData = useMemo(() => {
    return sortedData.filter((item) =>
      (filterOption === "material" ? selectedMaterials.length === 0 || selectedMaterials.includes(item.group) : true) &&
      (filterOption === "indicator" ? Object.entries(maxValues).every(([key, value]) => item[key] <= value) : true) &&
      Object.values(item).some(
        (value) =>
          typeof value === "string" &&
          value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [sortedData, searchTerm, selectedMaterials, maxValues, filterOption])

  const groupedData = useMemo(() => {
    if (!groupByMaterial) return { "": filteredData }
    return filteredData.reduce((acc, item) => {
      if (!acc[item.group]) {
        acc[item.group] = []
      }
      acc[item.group].push(item)
      return acc
    }, {})
  }, [filteredData, groupByMaterial])

  const handleSort = (key: string) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "ascending"
          ? "descending"
          : "ascending",
    }))
  }

  const toggleColumn = (column: string) => {
    setVisibleColumns((prev) =>
      prev.includes(column)
        ? prev.filter((col) => col !== column)
        : [...prev, column]
    )
  }

  const updateMaxValues = (indicator: string, value: number) => {
    setMaxValues((prev) => ({ ...prev, [indicator]: value }))
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name (DE)" },
    { key: "nameFr", label: "Name (FR)" },
    { key: "group", label: "Group" },
    { key: "density", label: "Density" },
    { key: "unit", label: "Unit" },
    { key: "ubpTotal", label: "UBP Total" },
    { key: "ubpProduction", label: "UBP Production" },
    { key: "ubpDisposal", label: "UBP Disposal" },
    { key: "ghgTotal", label: "GHG Total" },
    { key: "ghgProduction", label: "GHG Production" },
    { key: "ghgDisposal", label: "GHG Disposal" },
  ]

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Construction Materials Data</h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filters and Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="search" className="mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="tableOptions" className="mb-2 block">Table Options</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button id="tableOptions" variant="outline" className="w-full">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  {columns.map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.key}
                      className="capitalize"
                      checked={visibleColumns.includes(column.key)}
                      onCheckedChange={() => toggleColumn(column.key)}
                    >
                      {column.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center space-x-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="groupByMaterial"
                        checked={groupByMaterial}
                        onCheckedChange={() => setGroupByMaterial(!groupByMaterial)}
                      />
                      <Label htmlFor="groupByMaterial">Group by Material</Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Group table rows by material type</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <RadioGroup defaultValue="material" onValueChange={setFilterOption} className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="material" id="material" />
                        <Label htmlFor="material">Material</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="indicator" id="indicator" />
                        <Label htmlFor="indicator">Indicator</Label>
                      </div>
                    </RadioGroup>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Choose to filter by material type or by indicator values</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          {filterOption === "material" && (
            <div>
              <Label htmlFor="materialFilter" className="mb-2 block">Filter by Material</Label>
              <MultiSelect
                options={materialGroups.map(group => ({ label: group, value: group }))}
                value={selectedMaterials}
                onChange={setSelectedMaterials}
                placeholder="Select materials"
              />
            </div>
          )}
          {filterOption === "indicator" && (
            <>
              <div>
                <Label htmlFor="indicatorSelect" className="mb-2 block">Select Indicators to Limit</Label>
                <MultiSelect
                  id="indicatorSelect"
                  options={indicatorOptions}
                  value={selectedIndicators}
                  onChange={setSelectedIndicators}
                  placeholder="Select indicators"
                />
              </div>
              
              {selectedIndicators.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {selectedIndicators.map((indicator) => {
                    const max = initialMaxValues[indicator]
                    const currentMax = maxValues[indicator] ?? max
                    return (
                      <div key={indicator}>
                        <Label htmlFor={indicator} className="mb-2 block">
                          Max {indicatorOptions.find(opt => opt.value === indicator)?.label}: {currentMax.toFixed(2)}
                        </Label>
                        <Slider
                          id={indicator}
                          min={0}
                          max={max}
                          step={max / 100}
                          value={[currentMax]}
                          onValueChange={(value) => updateMaxValues(indicator, value[0])}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Materials Data Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {groupByMaterial && <TableHead className="w-[30px]" />}
                  {columns.map(
                    (column) =>
                      visibleColumns.includes(column.key) && (
                        <TableHead
                          key={column.key}
                          className="cursor-pointer"
                          onClick={() => handleSort(column.key)}
                        >
                          {column.label}
                          {sortConfig.key === column.key && (
                            <span className="ml-2">
                              {sortConfig.direction === "ascending" ? "▲" : "▼"}
                            </span>
                          )}
                        </TableHead>
                      )
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedData).map(([group, items]) => (
                  <React.Fragment key={group}>
                    {groupByMaterial && (
                      <TableRow>
                        <TableCell colSpan={visibleColumns.length + 1} className="font-bold bg-muted">
                          {group}
                        </TableCell>
                      </TableRow>
                    )}
                    {items.map((row) => (
                      <TableRow key={row.id}>
                        {groupByMaterial && <TableCell />}
                        {columns.map(
                          (column) =>
                            visibleColumns.includes(column.key) && (
                              <TableCell key={column.key}>
                                {row[column.key]}
                              </TableCell>
                            )
                        )}
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}