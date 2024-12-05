"use client";

import Link from "next/link";
import { useState } from "react";
import { Globe, Linkedin, Mail, Github, Cross } from "lucide-react";

export function FooterComponent() {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <footer className="bg-background text-muted-foreground py-4 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-between items-center">
          <div className="w-full sm:w-auto mb-4 sm:mb-0">
            <Link href="/" className="flex-shrink-0">
              <span className="text-2xl font-bold text-primary flex items-center">
                <span className="bg-red-500 p-0.5 rounded-sm flex items-center justify-center">
                  <Cross className="h-4 w-4 text-white transform rotate-12" />
                </span>
              </span>
            </Link>
          </div>
          <nav className="w-full sm:w-auto mb-4 sm:mb-0">
            <ul className="flex flex-wrap space-x-4 justify-center sm:justify-start">
              <li>
                <Link href="/" className="hover:text-primary text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/materials" className="hover:text-primary text-sm">
                  Materials
                </Link>
              </li>
              <li>
                <Link
                  href="/bim-integration"
                  className="hover:text-primary text-sm"
                >
                  BIM Integration
                </Link>
              </li>
              <li>
                <Link
                  href="/data-explorer"
                  className="hover:text-primary text-sm"
                >
                  Data Explorer
                </Link>
              </li>
              <li>
                <Link href="/api-access" className="hover:text-primary text-sm">
                  API Access
                </Link>
              </li>
            </ul>
          </nav>
          <div className="w-full sm:w-auto flex justify-center sm:justify-end space-x-4">
            <Link
              href="https://www.lt.plus"
              className="text-muted-foreground hover:text-primary"
              target="_blank"
            >
              <Globe className="w-5 h-5" />
              <span className="sr-only">Website</span>
            </Link>
            <Link
              href="https://www.linkedin.com/company/ltplusag"
              className="text-muted-foreground hover:text-primary"
              target="_blank"
            >
              <Linkedin className="w-5 h-5" />
              <span className="sr-only">LinkedIn</span>
            </Link>
            <Link
              href="mailto:info@lt.plus"
              className="text-muted-foreground hover:text-primary"
            >
              <Mail className="w-5 h-5" />
              <span className="sr-only">Email</span>
            </Link>
            <Link
              href="https://github.com/louistrue/swisslcadata"
              className="text-muted-foreground hover:text-primary"
              target="_blank"
              aria-label="GitHub Repository"
            >
              <Github className="w-5 h-5" />
              <span className="sr-only">GitHub</span>
            </Link>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t text-center text-xs text-muted-foreground">
          {new Date().getFullYear()} LCA data. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
