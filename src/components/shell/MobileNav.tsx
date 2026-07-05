"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useUIStore } from "@/stores/ui-store";
import { Book, Calendar, Search, Star, Archive, Tags, BarChart3, Settings, X } from "lucide-react";

const mobileNavItems = [
  { href: "/journal", label: "Journal", icon: Book },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/search", label: "Search", icon: Search },
  { href: "/favorites", label: "Favorites", icon: Star },
  { href: "/archive", label: "Archive", icon: Archive },
  { href: "/tags", label: "Tags", icon: Tags },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const { mobileNavOpen, setMobileNavOpen } = useUIStore();

  if (!mobileNavOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
        onClick={() => setMobileNavOpen(false)}
      />
      <div className="fixed left-0 top-0 h-full w-72 bg-bg-surface border-r border-border-light p-4 animate-in slide-in-from-left">
        <div className="flex items-center justify-between mb-6">
          <span className="font-serif text-lg font-semibold text-text-primary">
            Journal
          </span>
          <button
            onClick={() => setMobileNavOpen(false)}
            className="p-2 rounded-md hover:bg-border-light text-text-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-1">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-sans transition-colors",
                  isActive
                    ? "bg-border-light text-text-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-border-light"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
