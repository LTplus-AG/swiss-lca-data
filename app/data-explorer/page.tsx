"use client";

import DataExplorerChart from "../pages/app-data-explorer-page";

export default function DataExplorer() {
  // You might want to fetch the data here or pass it from a parent component
  const data: Material[] = []; // Replace with actual data

  return <DataExplorerChart data={data} />;
}
