"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  BarChart3,
  Settings,
  Home,
  Menu,
  X,
  FileType2,
  Images,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Gear", href: "/admin/gear", icon: Package },
  { name: "Rentals", href: "/admin/rentals", icon: FileText },
  { name: "Blog", href: "/admin/blog", icon: FileType2 },
  { name: "Gallery", href: "/admin/gallery", icon: Images },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <>
      <div className="p-4 md:p-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-gray-900"
          onClick={closeMobileMenu}
        >
          <Home className="h-5 w-5" />
          <span className="hidden sm:block">UW Outers Club</span>
        </Link>
        <p className="text-sm text-gray-500 mt-1 hidden sm:block">Admin Dashboard</p>
      </div>

      <nav className="px-2 md:px-4 pb-4">
        <ul className="space-y-1 md:space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 md:py-2 text-sm font-medium rounded-lg transition-colors w-full",
                    isActive ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100",
                  )}
                >
                  <item.icon className="h-5 w-5 md:h-4 md:w-4 flex-shrink-0" />
                  <span className="sm:block">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleMobileMenu}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="h-5 w-5 text-gray-600" />
        ) : (
          <Menu className="h-5 w-5 text-gray-600" />
        )}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:block w-64 bg-white shadow-lg">
        <SidebarContent />
      </div>

      {/* Mobile sidebar */}
      <div
        className={cn(
          "md:hidden fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent />
      </div>
    </>
  );
}
