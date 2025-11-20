"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

interface ChartDataItem {
  name: string;
  version: string;
  [key: string]: string | number;
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

function formatNumber(value: number): string {
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

interface ImpactChartProps {
  chartData: ChartDataItem[];
  selectedMaterials: string[];
  selectedVersions: string[];
  selectedImpact: string;
  materials: Array<{ id: string; nameDE: string }>;
  impactCategories: Array<{ value: string; label: string }>;
  loading: boolean;
}

export function ImpactChart({
  chartData,
  selectedMaterials,
  selectedVersions,
  selectedImpact,
  materials,
  impactCategories,
  loading,
}: ImpactChartProps) {
  const isSingleVersion = selectedVersions.length === 1;
  const selectedIndicator = impactCategories.find(
    (cat) => cat.value === selectedImpact
  );

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="h-[400px] w-full">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center text-muted-foreground">
            Select materials to compare
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get actual color value for a material index (for direct use in fill prop)
  // Using explicit HSL colors that are bright and visible in both light and dark modes
  // Expanded palette with high contrast colors for dark mode visibility
  const getColorValueForIndex = (index: number) => {
    const colors = [
      "hsl(221, 83%, 60%)", // Bright blue - increased lightness for visibility
      "hsl(142, 71%, 55%)", // Green - increased lightness
      "hsl(48, 96%, 60%)",  // Yellow - increased lightness
      "hsl(280, 65%, 65%)", // Purple - increased lightness
      "hsl(0, 72%, 58%)",   // Red - increased lightness
      "hsl(200, 90%, 60%)", // Cyan blue - bright
      "hsl(30, 90%, 60%)",  // Orange - bright
      "hsl(300, 70%, 65%)", // Magenta - bright
      "hsl(160, 70%, 55%)", // Teal - bright
      "hsl(15, 85%, 60%)",  // Coral - bright
      "hsl(250, 75%, 60%)", // Indigo - bright
      "hsl(60, 90%, 60%)",  // Bright yellow
    ];
    return colors[index % colors.length];
  };

  const getColorForIndex = (index: number) => {
    // Same colors for ChartContainer config
    return getColorValueForIndex(index);
  };

  return (
    <div className="w-full">
      <CardContent className="p-0">
        <div className="relative w-full">
          <ChartContainer
            config={
              isSingleVersion
                ? {
                  [selectedImpact]: {
                    label: selectedIndicator?.label || selectedImpact,
                    color: "hsl(221, 83%, 53%)",
                  },
                }
                : Object.fromEntries(
                  selectedMaterials.map((materialId, index) => {
                    const material = materials.find(
                      (m) => m.id === materialId
                    );
                    const materialName = material?.nameDE || materialId;
                    return [
                      materialName,
                      {
                        label: materialName,
                        color: getColorForIndex(index),
                      },
                    ];
                  })
                )
            }
            className="h-[400px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 20, left: 20, bottom: 70 }}
                barSize={isSingleVersion ? 80 : Math.max(30, 400 / selectedMaterials.length)}
                barGap={4}
                barCategoryGap="10%"
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ fill: "hsl(var(--foreground))" }}
                />
                <YAxis
                  label={{
                    value: selectedIndicator?.label || "",
                    angle: -90,
                    position: "insideLeft",
                    style: {
                      textAnchor: "middle",
                      fill: "hsl(var(--foreground))",
                    },
                  }}
                  tick={{ fill: "hsl(var(--foreground))" }}
                />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;

                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-md">
                        <div className="font-semibold mb-2">
                          {isSingleVersion ? `Material: ${label}` : `Version: ${label}`}
                        </div>
                        <div className="space-y-1">
                          {payload.map((entry, index) => {
                            const value = entry.value as number;
                            const dataKey = entry.dataKey as string;

                            // For multi-version mode, dataKey is the material nameDE
                            // Find the material index to get the correct color
                            let materialIndex = index;
                            let displayName = dataKey;

                            if (!isSingleVersion) {
                              // Find which material this dataKey corresponds to
                              const materialIndexFound = selectedMaterials.findIndex((materialId) => {
                                const material = materials.find((m) => m.id === materialId);
                                return material?.nameDE === dataKey;
                              });
                              if (materialIndexFound >= 0) {
                                materialIndex = materialIndexFound;
                              }
                              displayName = dataKey; // Material name
                            } else {
                              displayName = selectedIndicator?.label || dataKey;
                            }

                            const color = getColorValueForIndex(materialIndex);

                            return (
                              <div key={`${dataKey}-${index}`} className="flex items-center gap-2 text-sm">
                                <div
                                  className="w-3 h-3 rounded-sm flex-shrink-0"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="font-medium">{displayName}:</span>
                                <span>{formatNumber(value)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }}
                />
                {isSingleVersion ? (
                  <Bar
                    dataKey={selectedImpact}
                    fill="hsl(221, 83%, 53%)"
                    name={selectedIndicator?.label}
                    radius={[4, 4, 0, 0]}
                  />
                ) : (
                  selectedMaterials.map((materialId, index) => {
                    const material = materials.find((m) => m.id === materialId);
                    const materialName = material?.nameDE || materialId;
                    const color = getColorValueForIndex(index);
                    // Ensure color is always set and visible
                    const barColor = color || getColorValueForIndex(0);

                    return (
                      <Bar
                        key={`${materialId}-${index}`}
                        dataKey={materialName}
                        fill={barColor}
                        name={materialName}
                        radius={[4, 4, 0, 0]}
                        stroke={barColor}
                        strokeWidth={1}
                      />
                    );
                  })
                )}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </div>
  );
}
