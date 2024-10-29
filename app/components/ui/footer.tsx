"use client";

import Link from "next/link";
import { Globe, Linkedin, Mail } from "lucide-react";

export function FooterComponent() {
  return (
    <footer className="bg-white text-gray-600 py-4 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-between items-center">
          <div className="w-full sm:w-auto mb-4 sm:mb-0">
            <Link
              href="/"
              className="text-lg font-bold text-gray-900 hover:text-gray-700"
            >
              LCA data
            </Link>
          </div>
          <nav className="w-full sm:w-auto mb-4 sm:mb-0">
            <ul className="flex flex-wrap space-x-4 justify-center sm:justify-start">
              <li>
                <Link href="/" className="hover:text-gray-900 text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/materials" className="hover:text-gray-900 text-sm">
                  Materials
                </Link>
              </li>
              <li>
                <Link
                  href="/bim-integration"
                  className="hover:text-gray-900 text-sm"
                >
                  BIM Integration
                </Link>
              </li>
              <li>
                <Link
                  href="/data-explorer"
                  className="hover:text-gray-900 text-sm"
                >
                  Data Explorer
                </Link>
              </li>
              <li>
                <Link
                  href="/api-access"
                  className="hover:text-gray-900 text-sm"
                >
                  API Access
                </Link>
              </li>
            </ul>
          </nav>
          <div className="w-full sm:w-auto flex justify-center sm:justify-end space-x-4">
            <Link
              href="https://www.lt.plus"
              className="text-gray-400 hover:text-gray-600"
            >
              <Globe className="w-5 h-5" />
              <span className="sr-only">Website</span>
            </Link>
            <Link
              href="https://www.linkedin.com/company/ltplusag"
              className="text-gray-400 hover:text-gray-600"
            >
              <Linkedin className="w-5 h-5" />
              <span className="sr-only">LinkedIn</span>
            </Link>
            <Link
              href="mailto:info@lt.plus"
              className="text-gray-400 hover:text-gray-600"
            >
              <Mail className="w-5 h-5" />
              <span className="sr-only">Email</span>
            </Link>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} LCA data. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
