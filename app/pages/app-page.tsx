"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  FileSpreadsheet,
  BarChart3,
  Code,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MainAppPage() {
  const [language, setLanguage] = useState("en");
  const [showModal, setShowModal] = useState(false);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8"></div>

      <Alert
        className={cn("mb-8", "border-yellow-500 bg-yellow-50 text-yellow-900")}
      >
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Important Information</AlertTitle>
        <AlertDescription>
          We provide access to environmental impact material data sourced from
          open data published by KBOB (Koordinationskonferenz der Bau- und
          Liegenschaftsorgane der öffentlichen Bauherren KBOB), a Swiss
          government entity. This data is not created or verified by us, and we
          are not responsible for its accuracy, completeness, or reliability.
          Use the information for reference purposes only and verify critical
          data from primary sources. For more information, visit{" "}
          <a
            href="https://www.kbob.admin.ch/de/oekobilanzdaten-im-baubereich"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4"
          >
            KBOB
          </a>
          .
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="mr-2 h-4 w-4" />
              Material Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Access a comprehensive database of construction material impact
              data. Search, filter, and compare environmental impact data to
              make informed decisions for your sustainable building projects.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/materials">
              <Button>Explore Materials</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              BIM Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Seamlessly integrate KBOB data with your BIM software. Configure
              mapping settings, export data in compatible formats, and enhance
              your building information models with accurate environmental
              impact data.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/bim-integration">
              <Button>Configure BIM</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              Data Explorer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Dive deep into material impact data with our interactive Data
              Explorer. Compare materials, analyze trends across different KBOB
              versions, and gain valuable insights to support sustainable design
              decisions.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/data-explorer">
              <Button>Explore Data</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-12 bg-secondary p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Code className="mr-2 h-6 w-6" />
          API Access
        </h2>
        <div className="space-y-4">
          <p>
            Integrate KBOB data directly into your applications with our
            comprehensive API:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">
                Interactive Playground:
              </span>{" "}
              Test API endpoints in real-time with our built-in playground
            </li>
            <li>
              <span className="font-medium text-foreground">
                Complete Documentation:
              </span>{" "}
              Detailed guides and examples for all available endpoints
            </li>
            <li>
              <span className="font-medium text-foreground">Data Access:</span>{" "}
              Environmental impact data, material properties, and more
            </li>
          </ul>
          <div className="pt-4">
            <Link href="/api-access">
              <Button>
                <Code className="mr-2 h-4 w-4" />
                Explore API
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Recent Updates</h2>
        <Card>
          <CardHeader>
            <CardTitle>News</CardTitle>
            <CardDescription>
              Stay informed about the latest changes and improvements:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                New materials added to the database, expanding our coverage of
                sustainable building products
              </li>
              <li>
                Improved BIM export functionality for seamless integration with
                popular design software
              </li>
              <li>
                Enhanced Data Explorer with advanced comparison tools and
                visualization options
              </li>
              <li>
                Performance optimizations and user interface improvements for a
                smoother experience
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/news">
              <Button variant="outline">Read More</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Important Information</DialogTitle>
            <DialogDescription>
              Please read this disclaimer carefully.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              We provide access to environmental impact material data sourced
              from open data published by KBOB (Koordinationskonferenz der Bau-
              und Liegenschaftsorgane der öffentlichen Bauherren KBOB), a Swiss
              government entity. This data is not created or verified by us, and
              we are not responsible for its accuracy, completeness, or
              reliability. Use the information for reference purposes only and
              verify critical data from primary sources.
            </p>
            {/* Remove the bullet points list since it's redundant with the new text */}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowModal(false)}>I Understand</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
