"use client";

import { SignUp } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
      <Card className="w-full max-w-md bg-white">
        <CardContent className="p-0">
          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none w-full",
                formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
