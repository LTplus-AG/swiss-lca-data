"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import React from "react";

export default function AdminLink() {
  const { sessionClaims } = useAuth();
  const isAdmin = sessionClaims?.metadata?.role === "admin";

  if (!isAdmin) return null;

  return (
    <Link
      href="/admin-console"
      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100"
    >
      Admin Console
    </Link>
  );
}
