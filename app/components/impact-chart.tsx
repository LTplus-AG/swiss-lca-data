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
  const oldVersions = ["1.0", "4.0", "5.0", "6.0"];
  const showComingSoon = selectedVersions.some((v) => oldVersions.includes(v));
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

  const getColorForIndex = (index: number) => {
    const colors = [
      "hsl(var(--primary))", // Primary theme color
      "hsl(220 70% 50%)", // Blue
      "hsl(142 71% 45%)", // Green
      "hsl(48 96% 53%)", // Yellow
      "hsl(280 65% 60%)", // Purple
    ];
    return colors[index % colors.length];
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
                      color: "hsl(var(--chart-1))",
                    },
                  }
                : Object.fromEntries(
                    selectedMaterials.map((materialId, index) => {
                      const material = materials.find(
                        (m) => m.id === materialId
                      );
                      return [
                        material?.nameDE || materialId,
                        {
                          label: material?.nameDE || materialId,
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
                barSize={80}
                barGap={4}
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
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => `Material: ${value}`}
                      formatter={(value) =>
                        typeof value === "number" ? value.toFixed(2) : value
                      }
                    />
                  }
                />
                {isSingleVersion ? (
                  <Bar
                    dataKey={selectedImpact}
                    fill={`var(--color-${selectedImpact})`}
                    name={selectedIndicator?.label}
                    radius={[4, 4, 0, 0]}
                  />
                ) : (
                  selectedMaterials.map((materialId, index) => {
                    const material = materials.find((m) => m.id === materialId);
                    return (
                      <Bar
                        key={material?.nameDE || materialId}
                        dataKey={material?.nameDE || materialId}
                        fill={`var(--color-${material?.nameDE || materialId})`}
                        name={material?.nameDE || materialId}
                        radius={[4, 4, 0, 0]}
                      />
                    );
                  })
                )}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          {showComingSoon && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="text-center space-y-2">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="font-semibold text-lg">Coming Soon</h3>
                <p className="text-sm text-muted-foreground max-w-[250px]">
                  Historical data for previous versions will be available in a
                  future update
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </div>
  );
}
