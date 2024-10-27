"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  AlertCircle,
  Save,
  Play,
  Link,
  Loader2,
} from "lucide-react";
import {
  setMonitoringLink,
  getMonitoringLink,
  getLastIngestionTime,
} from "@/lib/kbob-service";
import { KbobDataTable } from "@/components/materials/preview-data-table";

export function KbobAdminConsole() {
  const [monitoringLink, setMonitoringLinkState] = useState("");
  const [newMonitoringLink, setNewMonitoringLink] = useState("");
  const [isUpdatingLink, setIsUpdatingLink] = useState(false);
  const [isTestingLink, setIsTestingLink] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [lastIngestionTime, setLastIngestionTime] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [showKbobData, setShowKbobData] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);

  useEffect(() => {
    fetchMonitoringLink();
    fetchLastIngestionTime();
  }, []);

  const fetchMonitoringLink = async () => {
    try {
      const link = await getMonitoringLink();
      setMonitoringLinkState(link);
    } catch (err) {
      console.error("Error fetching monitoring link:", err);
      setError(
        "Failed to fetch monitoring link. Storage might not be configured."
      );
    }
  };

  const fetchLastIngestionTime = async () => {
    try {
      const time = await getLastIngestionTime();
      setLastIngestionTime(time || "No ingestion recorded");
    } catch (err) {
      console.error("Failed to load last ingestion time:", err);
      setError("Failed to load last ingestion time");
    }
  };

  const testLink = async (link: string) => {
    setIsTestingLink(true);
    setError(null);
    try {
      const response = await fetch("/api/kbob/test-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link }),
      });
      if (!response.ok) throw new Error("Link test failed");
      return true;
    } catch (err) {
      setError("Link test failed. Please check the URL and try again.");
      return false;
    } finally {
      setIsTestingLink(false);
    }
  };

  const handleUpdateLink = async () => {
    setIsUpdatingLink(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const isValid = await testLink(newMonitoringLink);
      if (!isValid) return;

      await setMonitoringLink(newMonitoringLink);
      setMonitoringLinkState(newMonitoringLink);
      setSuccessMessage("Monitoring link updated successfully");
      setIsUpdateDialogOpen(false);
    } catch (err) {
      setError("Failed to update monitoring link");
    } finally {
      setIsUpdatingLink(false);
    }
  };

  const handleManualIngestion = async () => {
    setIsIngesting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      console.log("Starting manual ingestion...");
      const response = await fetch("/api/kbob/trigger-ingestion", {
        method: "POST",
      });

      // Log the raw response
      console.log("Raw response status:", response.status);
      const result = await response.json();
      console.log("Ingestion result:", result);

      if (!response.ok) {
        throw new Error(result.error || "Failed to trigger ingestion");
      }

      if (result.success) {
        setSuccessMessage(
          `Manual ingestion triggered successfully. ${result.materials.length} materials processed.`
        );
        // Set the materials directly from the ingestion result
        setMaterials(result.materials);
        await fetchLastIngestionTime();
        setShowKbobData(true);
      } else {
        throw new Error(result.error || "Ingestion failed");
      }
    } catch (err) {
      console.error("Ingestion error:", err);
      setError(
        typeof err === "string"
          ? err
          : (err as Error).message || "Failed to trigger ingestion"
      );
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>KBOB Admin Console</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-monitoring-link">
                Current KBOB Monitoring Link
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="current-monitoring-link"
                  value={monitoringLink}
                  readOnly
                  className="bg-gray-100"
                />
                <Dialog
                  open={isUpdateDialogOpen}
                  onOpenChange={setIsUpdateDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Link className="mr-2 h-4 w-4" />
                      Update Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Update KBOB Monitoring Link</DialogTitle>
                      <DialogDescription>
                        Enter the new monitoring link. This link will be tested
                        before updating.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="new-link" className="col-span-4">
                          New Link
                        </Label>
                        <Input
                          id="new-link"
                          value={newMonitoringLink}
                          onChange={(e) => setNewMonitoringLink(e.target.value)}
                          className="col-span-4"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleUpdateLink}
                        disabled={isUpdatingLink || isTestingLink}
                      >
                        {isUpdatingLink || isTestingLink ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        {isTestingLink
                          ? "Testing..."
                          : isUpdatingLink
                          ? "Updating..."
                          : "Update"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Last Ingestion</Label>
              <p className="text-sm text-gray-500">
                {lastIngestionTime
                  ? lastIngestionTime === "No ingestion recorded"
                    ? lastIngestionTime
                    : new Date(lastIngestionTime).toLocaleString()
                  : "Loading..."}
              </p>
            </div>

            <div>
              <Button onClick={handleManualIngestion} disabled={isIngesting}>
                {isIngesting ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {isIngesting ? "Ingesting..." : "Trigger Manual Ingestion"}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            {showKbobData && (
              <Card>
                <CardHeader>
                  <CardTitle>KBOB Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <KbobDataTable initialData={materials} />
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
