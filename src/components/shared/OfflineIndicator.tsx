"use client";

import { useOnlineStatus } from "@/hooks/use-online-status";
import { cn } from "@/lib/utils/cn";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 sm:right-4 sm:left-auto z-50 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-sans transition-all duration-300",
        isOnline
          ? "bg-olive/10 text-olive border border-olive/20"
          : "bg-red/10 text-red border border-red/20"
      )}
    >
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          isOnline ? "bg-olive" : "bg-red"
        )}
      />
      {isOnline ? "Online" : "Offline"}
    </div>
  );
}
