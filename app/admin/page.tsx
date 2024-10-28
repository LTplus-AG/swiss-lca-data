"use client";

import { useAuth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import React from "react";

export default function AdminConsolePage() {
  const { userId } = useAuth();
  const adminUserId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;

  if (userId !== adminUserId) {
    redirect("/pages/app-admin-console");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Console</h1>
      <div className="grid gap-4">
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">User Management</h2>
          {/* Add user management controls here */}
        </div>
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">System Settings</h2>
          {/* Add system settings controls here */}
        </div>
      </div>
    </div>
  );
}
