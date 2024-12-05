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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
    if (!initialData) {
      fetchData();
    }
  }, [page, search]);

  useEffect(() => {
    if (initialData && Array.isArray(initialData) && initialData.length > 0) {
      setData(initialData);
      setTotalPages(Math.ceil(initialData.length / 10));
      setLoading(false);
    } else if (initialData) {
      setData([]);
      setTotalPages(1);
      setLoading(false);
    }
  }, [initialData]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
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
            <Button onClick={fetchData} variant="outline" className="mt-4">
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
              <Button onClick={fetchData} variant="outline" className="mt-4">
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
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name (DE)</TableHead>
                  <TableHead>Name (FR)</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>GWP Total</TableHead>
                  <TableHead>UBP Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((material) => (
                  <TableRow key={material.uuid}>
                    <TableCell>{material.nameDE}</TableCell>
                    <TableCell>{material.nameFR}</TableCell>
                    <TableCell>{material.group}</TableCell>
                    <TableCell>{material.unit}</TableCell>
                    <TableCell>{material.gwpTotal}</TableCell>
                    <TableCell>{material.ubp21Total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 py-4">
              <PaginationPrevious
                onClick={() => page > 1 && handlePageChange(page - 1)}
                disabled={page === 1}
              />
              
              {/* First page */}
              <PaginationLink
                onClick={() => handlePageChange(1)}
                isActive={page === 1}
              >
                1
              </PaginationLink>

              {/* Left ellipsis */}
              {page > 3 && <PaginationEllipsis />}

              {/* Pages before current */}
              {page > 2 && (
                <PaginationLink
                  onClick={() => handlePageChange(page - 1)}
                >
                  {page - 1}
                </PaginationLink>
              )}

              {/* Current page (if not first or last) */}
              {page !== 1 && page !== totalPages && (
                <PaginationLink
                  isActive={true}
                >
                  {page}
                </PaginationLink>
              )}

              {/* Pages after current */}
              {page < totalPages - 1 && (
                <PaginationLink
                  onClick={() => handlePageChange(page + 1)}
                >
                  {page + 1}
                </PaginationLink>
              )}

              {/* Right ellipsis */}
              {page < totalPages - 2 && <PaginationEllipsis />}

              {/* Last page */}
              {totalPages > 1 && (
                <PaginationLink
                  onClick={() => handlePageChange(totalPages)}
                  isActive={page === totalPages}
                >
                  {totalPages}
                </PaginationLink>
              )}

              <PaginationNext
                onClick={() => page < totalPages && handlePageChange(page + 1)}
                disabled={page === totalPages}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default KbobDataTable;
