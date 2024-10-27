"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Search,
  FileSpreadsheet,
  BarChart3,
  Settings,
  User,
  Globe,
  AlertTriangle,
  Code,
  ShieldAlert,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export default function MainAppPage() {
  const [language, setLanguage] = useState("en");
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const hasVisited = localStorage.getItem("hasVisitedBefore");
    if (!hasVisited) {
      setShowModal(true);
      localStorage.setItem("hasVisitedBefore", "true");
    }
  }, []);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    // In a real application, you would implement language change logic here
    console.log(`Language changed to ${value}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">KBOB Platform</h1>

      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[180px]">
              <Globe className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="it">Italiano</SelectItem>
            </SelectContent>
          </Select>
          <Link href="/settings/general">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </Link>
          <Link href="/admin-console">
            <Button variant="ghost" size="icon">
              <ShieldAlert className="h-5 w-5" />
              <span className="sr-only">Admin Console</span>
            </Button>
          </Link>
          <Link href="/profile/info">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
              <span className="sr-only">User account</span>
            </Button>
          </Link>
        </div>
      </div>

      <Alert
        className={cn("mb-8", "border-yellow-500 bg-yellow-50 text-yellow-900")}
      >
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Important Information</AlertTitle>
        <AlertDescription>
          The KBOB Platform provides access to construction material data
          sourced from open data published by the Swiss government. This data is
          not created or verified by us, and we are not responsible for its
          accuracy, completeness, or reliability. Use the information for
          reference purposes only and verify critical data from primary sources.
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
              Access our comprehensive database of construction materials.
              Search, filter, and compare environmental impact data to make
              informed decisions for your sustainable building projects.
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
        <p className="mb-4">
          Integrate KBOB data directly into your applications with our powerful
          API. Access material information, environmental impact data, and more
          programmatically. Suitable for large-scale analysis and custom
          software solutions.
        </p>
        <Link href="/api-access">
          <Button>Get Access</Button>
        </Link>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Recent Updates</h2>
        <Card>
          <CardHeader>
            <CardTitle>Platform News</CardTitle>
            <CardDescription>
              Stay informed about the latest changes and improvements to the
              KBOB Platform
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
              The KBOB Platform provides access to construction material data
              sourced from open data published by the Swiss government. We want
              to make you aware of the following important points:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                The data displayed on this platform is not created or verified
                by us.
              </li>
              <li>
                We are not responsible for the accuracy, completeness, or
                reliability of the data.
              </li>
              <li>
                The information should be used for reference purposes only and
                may not be suitable for all use cases.
              </li>
              <li>
                Users are encouraged to verify critical information from primary
                sources.
              </li>
              <li>
                By using this platform, you acknowledge and accept these
                limitations.
              </li>
            </ul>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowModal(false)}>I Understand</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
