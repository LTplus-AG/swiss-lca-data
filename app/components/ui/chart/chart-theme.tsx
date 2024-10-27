interface ThemeConfig {
  baseBackground?: string;
  legend?: {
    fontSize?: number;
    fill?: string;
  };
  xAxis?: {
    fontSize?: number;
    fill?: string;
    tickLine?: boolean;
  };
  yAxis?: {
    fontSize?: number;
    fill?: string;
    tickLine?: boolean;
  };
  cartesianGrid?: {
    strokeDasharray?: string;
    stroke?: string;
  };
  tooltip?: {
    cursor?: boolean;
  };
}

// Default color palette for charts
export const defaultColors = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--muted))",
];

// Recharts theme configuration
export const ChartTheme: ThemeConfig = {
  baseBackground: "transparent",
  legend: {
    fontSize: 12,
    fill: "hsl(var(--foreground))",
  },
  xAxis: {
    fontSize: 12,
    fill: "hsl(var(--muted-foreground))",
    tickLine: false,
  },
  yAxis: {
    fontSize: 12,
    fill: "hsl(var(--muted-foreground))",
    tickLine: false,
  },
  cartesianGrid: {
    strokeDasharray: "3 3",
    stroke: "hsl(var(--border))",
  },
  tooltip: {
    cursor: false,
  },
};

// Utility types for chart data
export interface DataPoint {
  [key: string]: string | number;
}

export interface ChartData {
  data: DataPoint[];
  xAxis: string;
  yAxis: string[];
}

// Common formatters for chart values
export const formatters = {
  number: (value: number) => value.toLocaleString(),
  currency: (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value),
  percent: (value: number) =>
    `${value.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`,
  decimal: (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
};
