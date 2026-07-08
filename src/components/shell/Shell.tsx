"use client";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";
import { CommandPalette } from "./CommandPalette";
import { OfflineIndicator } from "@/components/shared/OfflineIndicator";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils/cn";

export function Shell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <MobileNav />
      <CommandPalette />

      <div
        className={cn(
          "transition-all duration-300",
          sidebarOpen ? "lg:ml-64" : "lg:ml-16"
        )}
      >
        <TopBar />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </div>

      <OfflineIndicator />
    </div>
  );
}
