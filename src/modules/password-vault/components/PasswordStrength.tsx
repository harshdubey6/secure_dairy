"use client";

import { cn } from "@/lib/utils/cn";
import type { PasswordStrength as Strength } from "../types";

const strengthConfig: Record<Strength, { label: string; color: string; width: string }> = {
  "very-weak": { label: "Very Weak", color: "bg-red", width: "w-1/5" },
  weak: { label: "Weak", color: "bg-orange-500", width: "w-2/5" },
  medium: { label: "Medium", color: "bg-yellow-500", width: "w-3/5" },
  strong: { label: "Strong", color: "bg-green", width: "w-4/5" },
  "very-strong": { label: "Very Strong", color: "bg-green", width: "w-full" },
};

type Props = {
  strength: Strength;
  showLabel?: boolean;
};

export function PasswordStrength({ strength, showLabel = true }: Props) {
  const config = strengthConfig[strength] || strengthConfig["very-weak"];

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-border-light overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-300", config.color, config.width)}
        />
      </div>
      {showLabel && (
        <span className="font-sans text-xs text-text-secondary min-w-[5rem] text-right">
          {config.label}
        </span>
      )}
    </div>
  );
}
