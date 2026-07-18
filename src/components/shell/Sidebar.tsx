"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useUIStore } from "@/stores/ui-store";
import { motion } from "framer-motion";
import {
  Book,
  Calendar,
  Star,
  Archive,
  Trash2,
  Tags,
  BarChart3,
  Settings,
  ChevronLeft,
  User,
  CheckSquare,
  Shield,
  LayoutDashboard,
  Clock,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal", label: "Journal", icon: Book },
  { href: "/journal/history", label: "History", icon: Clock },
  { href: "/calendar", label: "Calendar", icon: Calendar },

  { href: "/todos", label: "Tasks", icon: CheckSquare },
  { href: "/vault", label: "Vault", icon: Shield },
  { href: "/favorites", label: "Favorites", icon: Star },
  { href: "/archive", label: "Archive", icon: Archive },
  { href: "/tags", label: "Tags", icon: Tags },
  { href: "/stats", label: "Statistics", icon: BarChart3 },
  { href: "/trash", label: "Trash", icon: Trash2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-dvh bg-bg-surface border-r border-border-light transition-all duration-300 flex flex-col",
        sidebarOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex items-center justify-between px-4 h-16 border-b border-border-light">
        {sidebarOpen && (
          <Link
            href="/journal"
            className="font-serif text-lg font-semibold text-text-primary"
          >
            Journal
          </Link>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-border-light text-text-secondary hover:text-text-primary transition-colors"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <ChevronLeft
            className={cn(
              "w-4 h-4 transition-transform",
              !sidebarOpen && "rotate-180"
            )}
          />
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item, i) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2, ease: "easeOut" }}
            >
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-sans transition-all duration-200",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  isActive
                    ? "bg-border-light text-text-primary border-l-2 border-accent"
                    : "text-text-secondary hover:text-text-primary hover:bg-border-light"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && <motion.span layout>{item.label}</motion.span>}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-border-light space-y-1">
        {sidebarOpen ? (
          <>
            <Link
              href="/settings/profile"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-sans text-text-secondary hover:text-text-primary hover:bg-border-light transition-colors"
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-sans text-text-secondary hover:text-text-primary hover:bg-border-light transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/settings/profile"
              className="flex items-center justify-center py-2 text-text-secondary hover:text-text-primary transition-colors"
              title="Profile"
            >
              <User className="w-5 h-5" />
            </Link>
            <Link
              href="/settings"
              className="flex items-center justify-center py-2 text-text-secondary hover:text-text-primary transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}
