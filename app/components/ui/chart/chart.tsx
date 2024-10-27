import * as React from "react";
import { ChartTheme, defaultColors } from "./chart-theme";
import { cn } from "@/lib/utils";

// Types for chart configuration
export interface ChartConfig {
  [key: string]: {
    label: string;
    color?: string;
    formatter?: (value: number) => string;
  };
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
  children: React.ReactNode;
}

// Main chart container component
export function ChartContainer({
  config,
  className,
  children,
  ...props
}: ChartContainerProps) {
  return (
    <div className={cn("w-full", className)} {...props}>
      <style>
        {Object.entries(config).map(([key, value], i) => {
          const color = value.color ?? defaultColors[i % defaultColors.length];
          return `:root {--chart-${key}: ${color}}`;
        })}
      </style>
      {children}
    </div>
  );
}

interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    dataKey: string;
  }>;
  config: ChartConfig;
}

// Custom chart tooltip component
export function ChartTooltip({
  active,
  payload,
  config,
  className,
  ...props
}: TooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className={cn("rounded-lg border bg-background p-2 shadow-sm", className)}
      {...props}
    >
      <div className="grid grid-cols-2 gap-2">
        {payload.map((item) => {
          const conf = config[item.dataKey];
          return (
            <div key={item.dataKey} className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                {conf.label}
              </span>
              <span className="font-bold text-muted-foreground">
                {conf.formatter
                  ? conf.formatter(item.value)
                  : item.value.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Export chart tooltip content as a formatted component
export function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-muted-foreground">
            Label
          </span>
          <span className="font-bold">{label}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-muted-foreground">
            Value
          </span>
          <span className="font-bold">
            {payload[0].value?.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

// Chart loading placeholder
export function ChartLoading() {
  return (
    <div className="flex h-[350px] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <div className="text-sm text-muted-foreground">
          Loading chart data...
        </div>
      </div>
    </div>
  );
}

// Chart empty state
export function ChartEmpty() {
  return (
    <div className="flex h-[350px] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="text-sm text-muted-foreground">No data available</div>
      </div>
    </div>
  );
}

// Chart error state
export function ChartError({ message }: { message: string }) {
  return (
    <div className="flex h-[350px] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="text-sm text-destructive">
          {message || "Error loading chart data"}
        </div>
      </div>
    </div>
  );
}
