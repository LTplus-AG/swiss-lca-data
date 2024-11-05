"use client";

import DataExplorerChart from "../pages/app-data-explorer-page";

export default function DataExplorer() {
  const data: Material[] = [];

  return <DataExplorerChart data={data} />;
}
