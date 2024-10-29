"use client";

import { useState } from "react";
import { Zap, Check } from "lucide-react";
import { DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ApiAccessDialog() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <DialogContent className="sm:max-w-[425px] border-0 shadow-lg">
      <DialogTitle className="text-4xl font-bold text-center mb-6">
        API Access
      </DialogTitle>
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            You will receive
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <ul className="space-y-4">
            {[
              "Easy access to API",
              "Updates on new endpoints",
              "Priority Support",
            ].map((item, index) => (
              <li key={index} className="flex items-center space-x-3">
                <Check className="h-6 w-6 text-red-500 flex-shrink-0" />
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="flex flex-col items-center pt-6">
          <Button
            size="lg"
            className="w-full bg-red-500 hover:bg-red-600 text-white transition-all duration-300 ease-in-out"
            onClick={() => {
              const subject = encodeURIComponent("API Access Inquiry");
              const body = encodeURIComponent(
                "Hello,\n\nI would like more information about your API plans.\n\nThank you!"
              );
              window.location.href = `mailto:info@lt.plus?subject=${subject}&body=${body}`;
            }}
          >
            Contact us
            <Zap className="ml-2 h-5 w-5 transition-all duration-300 ease-in-out group-hover:rotate-12" />
          </Button>
          <p className="mt-4 text-sm text-gray-600">
            Or email us directly at{" "}
            <a
              href="mailto:info@lt.plus"
              className="text-red-500 hover:underline"
            >
              info@lt.plus
            </a>
          </p>
        </CardFooter>
      </Card>
    </DialogContent>
  );
}
