"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Search, Filter } from "lucide-react";

interface KBOBMaterial {
  id: string;
  uuid: string;
  group: string;
  nameDE: string;
  nameFR: string;
  disposalId: string;
  disposalNameDE: string;
  disposalNameFR: string;
  density: string | null;
  unit: string;
  ubp21Total: number | null;
  ubp21Production: number | null;
  ubp21Disposal: number | null;
  primaryEnergyTotal: number | null;
  primaryEnergyProductionTotal: number | null;
  primaryEnergyDisposal: number | null;
  gwpTotal: number | null;
  gwpProduction: number | null;
  gwpDisposal: number | null;
  biogenicCarbon: number | null;
}

interface KbobDataTableProps {
  initialData?: KBOBMaterial[];
}

export function KbobDataTable({ initialData }: KbobDataTableProps) {
  const [data, setData] = useState<KBOBMaterial[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const baseUrl = window.location.origin;
      const response = await fetch(
        `${baseUrl}/api/kbob/materials?page=${page}&search=${encodeURIComponent(
          search
        )}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const result = await response.json();
      setData(result.materials || []);
      setTotalPages(result.totalPages || 1);
    } catch (err) {
      setError("Failed to load KBOB data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialData && Array.isArray(initialData) && initialData.length > 0) {
      setData(initialData);
      setTotalPages(Math.ceil(initialData.length / 10));
      setLoading(false);
    } else if (initialData) {
      // If initialData is empty array
      setData([]);
      setTotalPages(1);
      setLoading(false);
    } else {
      fetchData();
    }
  }, [initialData, fetchData]);

  const getPaginatedData = () => {
    let filteredData = data;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = data.filter((material) =>
        Object.values(material).some((value) =>
          value?.toString().toLowerCase().includes(searchLower)
        )
      );
    }
    const start = (page - 1) * 10;
    const end = start + 10;
    return filteredData.slice(start, end);
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>{error}</p>
            <Button onClick={handleRefresh} variant="outline" className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-gray-500">No materials data available.</p>
            {!initialData && (
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="mt-4"
              >
                Refresh
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>KBOB Materials Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-3 text-gray-400"
                size={20}
              />
              <Input
                placeholder="Search materials..."
                value={search}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name (DE)</TableHead>
                  <TableHead>Name (FR)</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Density</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>UBP Total</TableHead>
                  <TableHead>UBP Production</TableHead>
                  <TableHead>UBP Disposal</TableHead>
                  <TableHead>Primary Energy Total</TableHead>
                  <TableHead>GWP Total</TableHead>
                  <TableHead>GWP Production</TableHead>
                  <TableHead>GWP Disposal</TableHead>
                  <TableHead>Biogenic Carbon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getPaginatedData().map((material) => (
                  <TableRow key={material.id}>
                    <TableCell>{material.id}</TableCell>
                    <TableCell>{material.nameDE}</TableCell>
                    <TableCell>{material.nameFR}</TableCell>
                    <TableCell>{material.group}</TableCell>
                    <TableCell>{material.density || "-"}</TableCell>
                    <TableCell>{material.unit}</TableCell>
                    <TableCell>
                      {material.ubp21Total?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {material.ubp21Production?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {material.ubp21Disposal?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {material.primaryEnergyTotal?.toLocaleString()}
                    </TableCell>
                    <TableCell>{material.gwpTotal?.toLocaleString()}</TableCell>
                    <TableCell>
                      {material.gwpProduction?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {material.gwpDisposal?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {material.biogenicCarbon?.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default KbobDataTable;
