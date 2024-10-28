"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  Search,
  FileSpreadsheet,
  BarChart2,
  Code,
  Globe,
  User,
  ShieldAlert,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation"; // Note: using next/navigation, not next/router

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Materials", href: "/materials", icon: Search },
  { name: "BIM Integration", href: "/bim-integration", icon: FileSpreadsheet },
  { name: "Data Explorer", href: "/data-explorer", icon: BarChart2 },
  { name: "API Access", href: "/api-access", icon: Code },
];

export function Navbar() {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin"; // Check if the user is an admin
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState("en");
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false); // Define isOpen state
  const router = useRouter();

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setShowPasswordPrompt(false);
      router.push("/admin-console"); // This uses the App Router navigation
    } else {
      alert("Incorrect password");
    }
  };

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev); // Toggle the dropdown state
  };

  return (
    <nav className="bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <span className="text-2xl font-bold text-primary">
                SwissLCAdata
              </span>
            </Link>
          </div>

          {/* Center - Navigation Items */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-accent flex items-center gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            ))}
          </div>

          {/* Right side - Language & User */}
          <div className="flex items-center space-x-4">
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[180px]">
                <Globe className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="de" disabled>
                  Deutsch (Coming soon)
                </SelectItem>
                <SelectItem value="fr" disabled>
                  Français (Coming soon)
                </SelectItem>
                <SelectItem value="it" disabled>
                  Italiano (Coming soon)
                </SelectItem>
              </SelectContent>
            </Select>

            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9",
                  },
                }}
              />
            </SignedIn>

            <SignedOut>
              <Link href="/sign-in">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            </SignedOut>

            {isAdmin && (
              <>
                <Button onClick={() => setShowPasswordPrompt(true)}>
                  Admin Console
                </Button>
                {showPasswordPrompt && (
                  <form onSubmit={handlePasswordSubmit}>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter admin password"
                    />
                    <button type="submit">Submit</button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <div className="flex items-center">
                  <item.icon className="h-5 w-5 mr-2" />
                  {item.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
