"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { ImpactChart } from "@/components/impact-chart";
import { Search, CheckSquare, Square, X } from "lucide-react";
import { clientConfig } from "@/lib/client-config";

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
  [key: string]: any; // Allow any additional fields
}

// Legacy impactCategories - now using indicators from API instead
// Keeping for backward compatibility with ImpactChart component
const impactCategories = [
  { label: "GWP Total", value: "gwpTotal" },
  { label: "UBP21 Total", value: "ubp21Total" },
  { label: "Primary Energy Total", value: "primaryEnergyTotal" },
];

// Add this interface for chart data type
interface ChartDataItem {
  name: string;
  version: string;
  [key: string]: string | number;
}

// Add new interface and state
interface Indicator {
  id: string;
  label: string;
  unit: string;
  description: string;
  group: "environmental" | "economic" | "social";
}

// Number formatting functions (matching material list)
function detectEULocale(): string {
  if (typeof navigator === "undefined") {
    // Default to EU locale (Swiss/German) for server-side rendering
    return "de-CH";
  }

  const browserLocale = navigator.language || navigator.languages?.[0] || "en";
  const localeLower = browserLocale.toLowerCase();

  // EU language codes
  const euLanguages = ["de", "fr", "it", "es", "pt", "nl", "pl", "cs", "sk", "sl", "hu", "ro", "bg", "hr", "el", "fi", "sv", "da", "et", "lv", "lt", "mt"];

  // Check if browser language is an EU language
  const isEULanguage = euLanguages.some(lang => localeLower.startsWith(lang));

  if (isEULanguage) {
    // Use the browser's locale
    return browserLocale;
  }

  // Default to Swiss German for non-EU languages
  return "de-CH";
}

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

export default function DataExplorerPage() {
  const [materials, setMaterials] = useState<KBOBMaterial[]>([]);
  const [materialsByVersion, setMaterialsByVersion] = useState<Record<string, KBOBMaterial[]>>({});
  const [availableVersions, setAvailableVersions] = useState<Array<{ version: string; date?: string; publishDate?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [selectedImpact, setSelectedImpact] = useState("gwpTotal");
  const [searchTerm, setSearchTerm] = useState("");
  // Add new state for indicators
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  // Track visible materials in scroll area
  const [visibleMaterialIds, setVisibleMaterialIds] = useState<Set<string>>(new Set());
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const materialRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Fetch available versions on component mount
  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const response = await fetch("/api/kbob/versions", {
          headers: {
            'Authorization': `Bearer ${clientConfig.API_KEY}`
          }
        });
        const data = await response.json();
        if (data.versions && Array.isArray(data.versions)) {
          setAvailableVersions(data.versions);
          // Set default to latest version
          const latestVersion = data.versions.length > 0 ? data.versions[0].version : null;
          if (latestVersion) {
            setSelectedVersions([latestVersion]);
          }
        }
      } catch (error) {
        console.error("Error fetching versions:", error);
      }
    };
    fetchVersions();
  }, []);

  // Fetch materials after versions are loaded
  useEffect(() => {
    if (availableVersions.length > 0) {
      fetchMaterials();
    }
  }, [availableVersions.length]);

  // Update the useEffect for fetching indicators
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
          // Set default indicator if none selected
          if (!selectedImpact && data.indicators.length > 0) {
            setSelectedImpact(data.indicators[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching indicators:", error);
      }
    };

    fetchIndicators();
  }, [selectedImpact]);

  // Helper function to map API material to KBOBMaterial
  const mapMaterial = (material: any): KBOBMaterial => ({
    id: material.uuid, // Map uuid to id for compatibility
    uuid: material.uuid,
    nameDE: material.nameDE,
    nameFR: material.nameFR,
    group: material.group || "Uncategorized",
    density: material.density,
    unit: material.unit,
    ubp21Total: material.ubp21Total,
    ubp21Production: material.ubp21Production,
    ubp21Disposal: material.ubp21Disposal,
    gwpTotal: material.gwpTotal,
    gwpProduction: material.gwpProduction,
    gwpDisposal: material.gwpDisposal,
    biogenicCarbon: material.biogenicCarbon,
    primaryEnergyTotal: material.primaryEnergyTotal,
    primaryEnergyProductionTotal: material.primaryEnergyProductionTotal,
    primaryEnergyProductionEnergetic: material.primaryEnergyProductionEnergetic,
    primaryEnergyProductionMaterial: material.primaryEnergyProductionMaterial,
    primaryEnergyDisposal: material.primaryEnergyDisposal,
    primaryEnergyRenewableTotal: material.primaryEnergyRenewableTotal,
    primaryEnergyRenewableProductionTotal: material.primaryEnergyRenewableProductionTotal,
    primaryEnergyRenewableProductionEnergetic: material.primaryEnergyRenewableProductionEnergetic,
    primaryEnergyRenewableProductionMaterial: material.primaryEnergyRenewableProductionMaterial,
    primaryEnergyRenewableDisposal: material.primaryEnergyRenewableDisposal,
    primaryEnergyNonRenewableTotal: material.primaryEnergyNonRenewableTotal,
    primaryEnergyNonRenewableProductionTotal: material.primaryEnergyNonRenewableProductionTotal,
    primaryEnergyNonRenewableProductionEnergetic: material.primaryEnergyNonRenewableProductionEnergetic,
    primaryEnergyNonRenewableProductionMaterial: material.primaryEnergyNonRenewableProductionMaterial,
    primaryEnergyNonRenewableDisposal: material.primaryEnergyNonRenewableDisposal,
    // Include any other fields that might exist
    ...Object.fromEntries(
      Object.entries(material).filter(([key]) =>
        !['uuid', 'id', 'nameDE', 'nameFR', 'group', 'density', 'unit'].includes(key)
      )
    ),
  });

  // Track which versions are currently being fetched to avoid duplicate requests
  const fetchingVersionsRef = useRef<Set<string>>(new Set());
  // Use a ref to track cached versions without triggering re-renders
  const cachedVersionsRef = useRef<Set<string>>(new Set());

  // Fetch materials for a specific version
  const fetchVersionData = useCallback(async (version: string) => {
    // Skip if already cached or currently fetching
    if (cachedVersionsRef.current.has(version) || fetchingVersionsRef.current.has(version)) {
      return;
    }

    // Mark as fetching
    fetchingVersionsRef.current.add(version);

    try {
      const response = await fetch(`/api/kbob/materials?pageSize=all&version=${version}`, {
        headers: {
          'Authorization': `Bearer ${clientConfig.API_KEY}`
        }
      });
      const data = await response.json();

      if (data.success && Array.isArray(data.materials)) {
        const mappedMaterials = data.materials.map(mapMaterial);
        // Mark as cached before setting state
        cachedVersionsRef.current.add(version);
        setMaterialsByVersion(prev => ({
          ...prev,
          [version]: mappedMaterials
        }));
      }
    } catch (error) {
      console.error(`Error fetching materials for version ${version}:`, error);
    } finally {
      // Remove from fetching set
      fetchingVersionsRef.current.delete(version);
    }
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      // Use latest version if available, otherwise no version param (defaults to current)
      const latestVersion = availableVersions.length > 0 ? availableVersions[0].version : null;
      const versionParam = latestVersion ? `&version=${latestVersion}` : "";
      const response = await fetch(`/api/kbob/materials?pageSize=all${versionParam}`, {
        headers: {
          'Authorization': `Bearer ${clientConfig.API_KEY}`
        }
      });
      const data = await response.json();

      if (data.success && Array.isArray(data.materials)) {
        const mappedMaterials = data.materials.map(mapMaterial);
        const version = data.version || latestVersion || "unknown";

        setMaterials(mappedMaterials);
        // Mark as cached and cache the initial load
        cachedVersionsRef.current.add(version);
        setMaterialsByVersion(prev => ({
          ...prev,
          [version]: mappedMaterials
        }));
      } else {
        console.error("Invalid data format received:", data);
        setMaterials([]);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = useMemo(() => {
    const filtered = materials.filter(
      (material) =>
        material.nameDE.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.group.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort: selected materials first, then unselected
    return filtered.sort((a, b) => {
      const aSelected = selectedMaterials.includes(a.id);
      const bSelected = selectedMaterials.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }, [materials, searchTerm, selectedMaterials]);

  // Fetch data for selected versions when they change
  useEffect(() => {
    selectedVersions.forEach(version => {
      fetchVersionData(version);
    });
  }, [selectedVersions, fetchVersionData]);

  // Track visible materials using Intersection Observer
  useEffect(() => {
    if (filteredMaterials.length === 0) {
      setVisibleMaterialIds(new Set());
      return;
    }

    let observer: IntersectionObserver | null = null;

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      // Find the actual scrollable viewport (ScrollArea creates a viewport element)
      const scrollAreaElement = scrollAreaRef.current;
      if (!scrollAreaElement) return;

      // ScrollArea from shadcn/ui wraps content in a viewport div
      const viewport = scrollAreaElement.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (!viewport) return;

      observer = new IntersectionObserver(
        (entries) => {
          setVisibleMaterialIds(prev => {
            const newVisibleIds = new Set(prev);
            entries.forEach((entry) => {
              const materialId = entry.target.getAttribute('data-material-id');
              if (materialId) {
                if (entry.isIntersecting) {
                  newVisibleIds.add(materialId);
                } else {
                  newVisibleIds.delete(materialId);
                }
              }
            });
            return newVisibleIds;
          });
        },
        {
          root: viewport,
          rootMargin: '0px',
          threshold: 0.1, // Consider visible if 10% is showing
        }
      );

      // Observe all material elements
      const materialElements = Array.from(materialRefs.current.values());
      materialElements.forEach((element) => {
        if (element) {
          observer!.observe(element);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [filteredMaterials]);

  const handleMaterialSelect = (materialId: string) => {
    setSelectedMaterials((prev) => {
      const newSelection = prev.includes(materialId)
        ? prev.filter((id) => id !== materialId)
        : [...prev, materialId];

      // Ensure at least one version is selected if we have materials
      if (newSelection.length > 0 && selectedVersions.length === 0) {
        const defaultVersion = availableVersions.length > 0
          ? availableVersions[0].version
          : null;
        if (defaultVersion) {
          setSelectedVersions([defaultVersion]);
        }
      }

      return newSelection;
    });
  };

  const handleVersionSelect = (version: string) => {
    setSelectedVersions((prev) => {
      const newSelection = prev.includes(version)
        ? prev.filter((v) => v !== version)
        : [...prev, version];

      // Ensure at least one version is selected
      if (newSelection.length === 0) {
        const defaultVersion = availableVersions.length > 0
          ? availableVersions[0].version
          : null;
        if (defaultVersion) {
          return [defaultVersion];
        }
        return [];
      }

      return newSelection;
    });
  };

  const handleSelectAllVisible = () => {
    // If filtered: select all filtered materials
    // If not filtered: select only visible materials in scroll area
    const idsToSelect = searchTerm.trim()
      ? filteredMaterials.map(m => m.id) // All filtered when search is active
      : Array.from(visibleMaterialIds); // Only visible when no search

    setSelectedMaterials(prev => {
      const newSelection = [...prev];
      idsToSelect.forEach(id => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      return newSelection;
    });
  };

  const handleDeselectAllVisible = () => {
    // If filtered: deselect all filtered materials
    // If not filtered: deselect only visible materials in scroll area
    const idsToDeselect = searchTerm.trim()
      ? filteredMaterials.map(m => m.id) // All filtered when search is active
      : Array.from(visibleMaterialIds); // Only visible when no search

    setSelectedMaterials(prev => prev.filter(id => !idsToDeselect.includes(id)));
  };

  const handleDeselectAll = () => {
    setSelectedMaterials([]);
  };

  const selectedCount = selectedMaterials.length;
  const filteredCount = filteredMaterials.length;
  const isFiltered = searchTerm.trim().length > 0;

  // Check if all relevant materials are selected
  // If filtered: check all filtered materials
  // If not filtered: check only visible materials
  const relevantMaterialIds = isFiltered
    ? filteredMaterials.map(m => m.id)
    : Array.from(visibleMaterialIds);

  const relevantSelectedCount = relevantMaterialIds.filter(id =>
    selectedMaterials.includes(id)
  ).length;

  const allRelevantSelected = relevantMaterialIds.length > 0 &&
    relevantSelectedCount === relevantMaterialIds.length;

  // Check which indicators are available in selected versions
  const availableIndicators = useMemo(() => {
    if (!selectedVersions.length || !indicators.length) return [];

    return indicators.map(indicator => {
      const availableInVersions: string[] = [];
      const unavailableInVersions: string[] = [];

      selectedVersions.forEach(version => {
        const versionMaterials = materialsByVersion[version] || [];
        if (versionMaterials.length === 0) {
          unavailableInVersions.push(version);
          return;
        }

        // Check if at least one material has this indicator with a value
        const hasData = versionMaterials.some(material => {
          const value = material[indicator.id];
          return value !== undefined && value !== null && typeof value === 'number' && !isNaN(value);
        });

        if (hasData) {
          availableInVersions.push(version);
        } else {
          unavailableInVersions.push(version);
        }
      });

      return {
        ...indicator,
        availableInVersions,
        unavailableInVersions,
        isAvailableInAll: unavailableInVersions.length === 0,
        isAvailableInAny: availableInVersions.length > 0,
      };
    });
  }, [indicators, selectedVersions, materialsByVersion]);

  // Filter indicators to show only those available in at least one selected version
  const filteredIndicators = useMemo(() => {
    return availableIndicators.filter(ind => ind.isAvailableInAny);
  }, [availableIndicators]);

  // Helper function to resolve impact label from API indicators first, then fall back to hardcoded categories
  const getImpactLabel = useCallback((impactId: string): string => {
    // First try to find in filteredIndicators (indicators available in selected versions)
    const indicatorFromFiltered = filteredIndicators.find(ind => ind.id === impactId);
    if (indicatorFromFiltered) {
      return indicatorFromFiltered.label;
    }

    // Fall back to all indicators (even if not available in selected versions)
    const indicatorFromAll = indicators.find(ind => ind.id === impactId);
    if (indicatorFromAll) {
      return indicatorFromAll.label;
    }

    // Fall back to hardcoded impactCategories for backward compatibility
    const legacyCategory = impactCategories.find(cat => cat.value === impactId);
    if (legacyCategory) {
      return legacyCategory.label;
    }

    // Final fallback: return the raw impact ID
    return impactId;
  }, [filteredIndicators, indicators]);

  // Auto-switch to available indicator if current one becomes unavailable
  useEffect(() => {
    if (selectedImpact && filteredIndicators.length > 0) {
      const currentIndicator = filteredIndicators.find(ind => ind.id === selectedImpact);
      if (!currentIndicator || !currentIndicator.isAvailableInAny) {
        // Current indicator not available, switch to first available one
        setSelectedImpact(filteredIndicators[0].id);
      }
    } else if (filteredIndicators.length > 0 && !selectedImpact) {
      // No indicator selected, select first available
      setSelectedImpact(filteredIndicators[0].id);
    }
  }, [filteredIndicators, selectedImpact]);

  const chartData = useMemo(() => {
    if (!selectedMaterials.length || !selectedVersions.length) return [];

    if (selectedVersions.length === 1) {
      // Single version comparison - compare materials within one version
      const version = selectedVersions[0];
      const versionMaterials = materialsByVersion[version] || [];

      return selectedMaterials
        .map((materialId) => {
          const material = versionMaterials.find((m) => m.id === materialId);
          const impactValue = material?.[selectedImpact];
          if (
            !material ||
            impactValue === undefined ||
            impactValue === null
          )
            return null;

          return {
            name: material.nameDE,
            version,
            [selectedImpact]: impactValue || 0,
          };
        })
        .filter((item): item is ChartDataItem => item !== null);
    } else {
      // Version comparison - compare materials across multiple versions
      return selectedVersions.map((version) => {
        const versionMaterials = materialsByVersion[version] || [];
        const dataItem: ChartDataItem = {
          version,
          name: `v${version}`,
        };

        selectedMaterials.forEach((materialId) => {
          const material = versionMaterials.find((m) => m.id === materialId);
          const impactValue = material?.[selectedImpact];
          if (material && impactValue !== undefined && impactValue !== null) {
            // Use material nameDE as the key for the chart
            dataItem[material.nameDE] = impactValue || 0;
          }
        });

        return dataItem;
      });
    }
  }, [selectedMaterials, selectedVersions, selectedImpact, materialsByVersion]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Data Explorer</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Select Materials</CardTitle>
                <CardDescription>
                  {selectedCount > 0
                    ? `${selectedCount} material${selectedCount !== 1 ? 's' : ''} selected`
                    : 'Choose materials to compare'}
                </CardDescription>
              </div>
              {filteredCount > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={allRelevantSelected ? handleDeselectAllVisible : handleSelectAllVisible}
                    className="h-8"
                    title={
                      isFiltered
                        ? "Select all filtered materials"
                        : "Select all visible materials in scroll area"
                    }
                  >
                    {allRelevantSelected ? (
                      <>
                        <Square className="h-3.5 w-3.5 mr-1.5" />
                        {isFiltered ? "Deselect Filtered" : "Deselect Visible"}
                      </>
                    ) : (
                      <>
                        <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                        {isFiltered ? "Select Filtered" : "Select Visible"}
                      </>
                    )}
                  </Button>
                  {selectedCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMaterials([])}
                      className="h-8"
                      title="Clear all selections"
                    >
                      <X className="h-3.5 w-3.5 mr-1.5" />
                      Clear All
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label htmlFor="search-materials">Search Materials</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-materials"
                  placeholder="Search by material name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <ScrollArea className="h-[200px] border rounded-md p-4" ref={scrollAreaRef}>
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  Loading materials...
                </div>
              ) : filteredCount === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No materials found
                </div>
              ) : (
                filteredMaterials.map((material) => {
                  const isSelected = selectedMaterials.includes(material.id);
                  return (
                    <div
                      key={material.id}
                      ref={(el) => {
                        if (el) {
                          materialRefs.current.set(material.id, el);
                        } else {
                          materialRefs.current.delete(material.id);
                        }
                      }}
                      data-material-id={material.id}
                      className={`flex items-center space-x-2 mb-2 p-1.5 rounded-md transition-colors ${isSelected ? 'bg-muted/50' : 'hover:bg-muted/30'
                        }`}
                    >
                      <Checkbox
                        id={material.id}
                        checked={isSelected}
                        onCheckedChange={() => handleMaterialSelect(material.id)}
                      />
                      <Label
                        htmlFor={material.id}
                        className="flex-grow cursor-pointer text-sm"
                      >
                        {material.nameDE}
                      </Label>
                    </div>
                  );
                })
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>
                  {selectedVersions.length > 0
                    ? `${selectedVersions.length} version${selectedVersions.length !== 1 ? 's' : ''} selected`
                    : 'Select versions and impact category'}
                </CardDescription>
              </div>
              {availableVersions.length > 0 && selectedVersions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const defaultVersion = availableVersions[0].version;
                    setSelectedVersions([defaultVersion]);
                  }}
                  className="h-8"
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Reset
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>KBOB Versions</Label>
                  {availableVersions.length > 1 && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const allVersions = availableVersions.map(v => v.version);
                          setSelectedVersions(allVersions);
                        }}
                        className="h-7 text-xs"
                        disabled={selectedVersions.length === availableVersions.length}
                      >
                        All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const latestVersion = availableVersions[0].version;
                          setSelectedVersions([latestVersion]);
                        }}
                        className="h-7 text-xs"
                        disabled={selectedVersions.length === 1 && selectedVersions[0] === availableVersions[0].version}
                      >
                        Latest
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableVersions.length > 0 ? (
                    availableVersions.map((v) => {
                      const isSelected = selectedVersions.includes(v.version);
                      return (
                        <Button
                          key={v.version}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleVersionSelect(v.version)}
                          className={`transition-all ${isSelected ? 'ring-2 ring-primary/20' : ''
                            }`}
                        >
                          v{v.version}
                        </Button>
                      );
                    })
                  ) : (
                    <div className="text-sm text-muted-foreground">Loading versions...</div>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="impact-category">Impact Category</Label>
                  {selectedImpact && filteredIndicators.length > 0 && (() => {
                    const currentIndicator = filteredIndicators.find(ind => ind.id === selectedImpact);
                    if (currentIndicator && !currentIndicator.isAvailableInAll && currentIndicator.unavailableInVersions.length > 0) {
                      return (
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          Not available in v{currentIndicator.unavailableInVersions.join(', v')}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                <Select
                  value={selectedImpact}
                  onValueChange={setSelectedImpact}
                >
                  <SelectTrigger id="impact-category" className="mt-2">
                    <SelectValue placeholder="Select impact category">
                      {filteredIndicators.find((i) => i.id === selectedImpact)?.label ||
                        "Select indicator"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {filteredIndicators.length > 0 ? (
                      filteredIndicators.map((indicator) => {
                        const isPartiallyAvailable = !indicator.isAvailableInAll && indicator.availableInVersions.length > 0;
                        return (
                          <SelectItem
                            key={indicator.id}
                            value={indicator.id}
                            disabled={!indicator.isAvailableInAny}
                          >
                            <div className="flex flex-col w-full">
                              <div className="flex items-center justify-between">
                                <span className={`font-medium ${!indicator.isAvailableInAny ? 'opacity-50' : ''}`}>
                                  {indicator.label}
                                </span>
                                {isPartiallyAvailable && (
                                  <span className="text-xs text-amber-600 dark:text-amber-400 ml-2">
                                    Partial
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {indicator.description} ({indicator.unit})
                              </span>
                              {isPartiallyAvailable && (
                                <span className="text-xs text-muted-foreground mt-1">
                                  Available in: v{indicator.availableInVersions.join(', v')}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })
                    ) : indicators.length > 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No indicators available for selected versions
                      </div>
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        Loading indicators...
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {selectedVersions.length > 0 && filteredIndicators.length === 0 && indicators.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ⚠️ No indicators have data for the selected versions. Try selecting different versions.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Impact Comparison
          </CardTitle>
          <CardDescription>
            {selectedVersions.length === 1
              ? `Compare materials for v${selectedVersions[0]}`
              : "Compare materials across versions"}
          </CardDescription>
          {selectedImpact && filteredIndicators.length > 0 && (() => {
            const currentIndicator = filteredIndicators.find(ind => ind.id === selectedImpact);
            if (currentIndicator && !currentIndicator.isAvailableInAll && currentIndicator.availableInVersions.length > 0) {
              return (
                <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                  <span className="text-xs text-amber-800 dark:text-amber-200 font-medium block">
                    ⚠️ Partial Data Availability
                  </span>
                  <span className="text-xs text-amber-700 dark:text-amber-300 mt-1 block">
                    This indicator is only available in v{currentIndicator.availableInVersions.join(', v')}.
                    {currentIndicator.unavailableInVersions.length > 0 && (
                      <span> Not available in v{currentIndicator.unavailableInVersions.join(', v')}.</span>
                    )}
                  </span>
                </div>
              );
            }
            return null;
          })()}
        </CardHeader>
        <CardContent className="min-h-[400px] relative p-0">
          <ImpactChart
            chartData={chartData}
            selectedMaterials={selectedMaterials}
            selectedVersions={selectedVersions}
            selectedImpact={selectedImpact}
            selectedImpactLabel={getImpactLabel(selectedImpact)}
            materials={materials}
            impactCategories={impactCategories}
            loading={loading}
          />
        </CardContent>
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
                      {getImpactLabel(selectedImpact)}
                    </th>
                  ) : (
                    selectedMaterials.map((materialId) => {
                      const material = materials.find(
                        (m) => m.id === materialId
                      );
                      return material ? (
                        <th key={material.id} className="text-left p-2">
                          {material.nameDE}
                        </th>
                      ) : null;
                    })
                  )}
                </tr>
              </thead>
              <tbody>
                {chartData
                  .filter((row): row is ChartDataItem => row !== null)
                  .map((row, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">
                        {selectedVersions.length === 1 ? row.name : row.version}
                      </td>
                      {selectedVersions.length === 1 ? (
                        <td className="p-2">
                          {typeof row[selectedImpact] === "number"
                            ? formatCellValue(row[selectedImpact])
                            : "-"}
                        </td>
                      ) : (
                        selectedMaterials.map((materialId) => {
                          const material = materials.find(
                            (m) => m.id === materialId
                          );
                          return material ? (
                            <td key={material.id} className="p-2">
                              {typeof row[material.nameDE] === "number" &&
                                !isNaN(row[material.nameDE] as number)
                                ? formatCellValue(row[material.nameDE] as number)
                                : "-"}
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
