"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Code, Copy, CheckCircle2, Key, ExternalLink } from "lucide-react";

const API_ENDPOINTS = [
  {
    name: "List Materials",
    method: "GET",
    endpoint: "/api/v1/materials",
    description: "Retrieve a list of all materials",
    params: [],
  },
  {
    name: "Get Material Details",
    method: "GET",
    endpoint: "/api/v1/materials/{id}",
    description: "Get detailed information about a specific material",
    params: [{ name: "id", type: "string", description: "Material ID" }],
  },
  {
    name: "Search Materials",
    method: "GET",
    endpoint: "/api/v1/materials/search",
    description: "Search for materials based on criteria",
    params: [
      { name: "query", type: "string", description: "Search query" },
      { name: "category", type: "string", description: "Material category" },
    ],
  },
];

const API_PLANS = [
  { name: "Basic", requests: "1,000", price: "€50" },
  { name: "Pro", requests: "10,000", price: "€200" },
  { name: "Enterprise", requests: "Unlimited", price: "Custom" },
];

export default function ApiAccessPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(API_ENDPOINTS[0]);
  const [params, setParams] = useState<Record<string, string>>({});
  const [response, setResponse] = useState("");
  const [copied, setCopied] = useState(false);
  const [showApiPlanModal, setShowApiPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");

  const handleEndpointChange = (value: string) => {
    const endpoint = API_ENDPOINTS.find((e) => e.name === value);
    if (endpoint) {
      setSelectedEndpoint(endpoint);
      setParams({});
    }
  };

  const handleParamChange = (name: string, value: string) => {
    setParams((prev) => ({ ...prev, [name]: value }));
  };

  const handleCopyCode = () => {
    const code = generateCode();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateCode = () => {
    const url = selectedEndpoint.endpoint.replace(
      /{(\w+)}/g,
      (_, p) => params[p] || `{${p}}`
    );
    const queryParams = selectedEndpoint.params
      .filter((p) => p.name !== "id" && params[p.name])
      .map((p) => `${p.name}=${encodeURIComponent(params[p.name])}`)
      .join("&");
    const fullUrl = `https://api.kbob-platform.com${url}${
      queryParams ? `?${queryParams}` : ""
    }`;

    return `fetch('${fullUrl}', {
  method: '${selectedEndpoint.method}',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`;
  };

  const handleTryApi = async () => {
    // In a real application, you would make an actual API call here
    // For this example, we'll simulate a response
    setResponse(
      JSON.stringify(
        { message: "API call successful", data: { ...params } },
        null,
        2
      )
    );
  };

  const handleGetApiAccess = () => {
    // In a real application, you would implement the logic to process the API plan request
    console.log(`Requested API plan: ${selectedPlan}`);
    setShowApiPlanModal(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">API Access</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Get API Access</CardTitle>
          <CardDescription>
            Choose a plan to access our API and integrate KBOB data into your
            applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Our API provides programmatic access to the KBOB database, allowing
            you to integrate sustainable building material data directly into
            your applications.
          </p>
          <Button onClick={() => setShowApiPlanModal(true)}>
            <Key className="mr-2 h-4 w-4" />
            View API Plans
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Documentation & Playground</CardTitle>
          <CardDescription>Explore and test our API endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="playground" className="space-y-4">
            <TabsList>
              <TabsTrigger value="playground">Playground</TabsTrigger>
              <TabsTrigger value="documentation">Documentation</TabsTrigger>
            </TabsList>
            <TabsContent value="playground" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="endpoint">Select Endpoint</Label>
                <Select
                  onValueChange={handleEndpointChange}
                  defaultValue={selectedEndpoint.name}
                >
                  <SelectTrigger id="endpoint">
                    <SelectValue placeholder="Select an endpoint" />
                  </SelectTrigger>
                  <SelectContent>
                    {API_ENDPOINTS.map((endpoint) => (
                      <SelectItem key={endpoint.name} value={endpoint.name}>
                        {endpoint.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEndpoint.params.map((param) => (
                <div key={param.name} className="space-y-2">
                  <Label htmlFor={param.name}>{param.name}</Label>
                  <Input
                    id={param.name}
                    placeholder={`Enter ${param.name}`}
                    value={params[param.name] || ""}
                    onChange={(e) =>
                      handleParamChange(param.name, e.target.value)
                    }
                  />
                </div>
              ))}

              <div className="relative">
                <pre className="bg-secondary p-4 rounded-md overflow-x-auto">
                  <code className="text-sm">{generateCode()}</code>
                </pre>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={handleCopyCode}
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <Button onClick={handleTryApi}>Try it out</Button>

              {response && (
                <pre className="bg-secondary p-4 rounded-md overflow-x-auto">
                  <code className="text-sm">{response}</code>
                </pre>
              )}
            </TabsContent>
            <TabsContent value="documentation">
              <Accordion type="single" collapsible className="w-full">
                {API_ENDPOINTS.map((endpoint, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger>
                      <div className="flex items-center space-x-2">
                        <Code className="h-4 w-4" />
                        <span>{endpoint.name}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <p>
                          <strong>Method:</strong> {endpoint.method}
                        </p>
                        <p>
                          <strong>Endpoint:</strong> {endpoint.endpoint}
                        </p>
                        <p>
                          <strong>Description:</strong> {endpoint.description}
                        </p>
                        {endpoint.params.length > 0 && (
                          <div>
                            <strong>Parameters:</strong>
                            <ul className="list-disc pl-5">
                              {endpoint.params.map((param) => (
                                <li key={param.name}>
                                  <code>{param.name}</code> ({param.type}):{" "}
                                  {param.description}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showApiPlanModal} onOpenChange={setShowApiPlanModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose an API Plan</DialogTitle>
            <DialogDescription>
              Select a plan that suits your needs. Each plan offers different
              levels of access and request limits.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
              {API_PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className="flex items-center space-x-2 mb-2"
                >
                  <RadioGroupItem value={plan.name} id={plan.name} />
                  <Label htmlFor={plan.name}>
                    <span className="font-semibold">{plan.name}</span> -{" "}
                    {plan.requests} requests/month - {plan.price}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button onClick={handleGetApiAccess} disabled={!selectedPlan}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Request Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
