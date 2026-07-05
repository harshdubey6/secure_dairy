"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EXPORT_FORMATS } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import { Download } from "lucide-react";

export default function ExportPage() {
  const [format, setFormat] = useState<string>("markdown");
  const [isLoading, setIsLoading] = useState(false);

  async function handleExport() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/export?format=${format}`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `journal-export.${format === "markdown" ? "md" : format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export complete");
    } catch {
      toast.error("Export failed");
    }
    setIsLoading(false);
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <h1 className="font-serif text-3xl text-text-primary mb-8">Export</h1>

      <div className="space-y-6">
        <p className="font-sans text-sm text-text-secondary">
          Export your journal entries in your preferred format.
        </p>

        <div className="flex items-center gap-3">
          {EXPORT_FORMATS.map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={cn(
                "px-4 py-2 rounded-md border font-sans text-sm transition-colors",
                format === f
                  ? "bg-accent/10 border-accent text-accent"
                  : "bg-bg-surface border-border-light text-text-secondary hover:border-border"
              )}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        <Button
          onClick={handleExport}
          disabled={isLoading}
          className="bg-accent hover:bg-accent-hover text-white font-sans"
        >
          <Download className="w-4 h-4 mr-2" />
          {isLoading ? "Exporting..." : `Export as ${format.toUpperCase()}`}
        </Button>
      </div>
    </div>
  );
}
