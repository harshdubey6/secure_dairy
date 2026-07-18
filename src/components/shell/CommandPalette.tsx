"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/stores/ui-store";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Book,
  Calendar,
  Search,
  Star,
  Archive,
  Trash2,
  Tags,
  BarChart3,
  Settings,
  Clock,
} from "lucide-react";

const commands = [
  { href: "/journal", label: "Today's Journal", icon: Book },
  { href: "/journal/history", label: "Journal History", icon: Clock },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/search", label: "Search", icon: Search },
  { href: "/favorites", label: "Favorites", icon: Star },
  { href: "/archive", label: "Archive", icon: Archive },
  { href: "/trash", label: "Trash", icon: Trash2 },
  { href: "/tags", label: "Tags", icon: Tags },
  { href: "/stats", label: "Statistics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  function handleSelect(href: string) {
    setCommandPaletteOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog
      open={commandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
    >
      <CommandInput
        placeholder="Search commands..."
        className="font-sans"
      />
      <CommandList>
        <CommandEmpty className="font-sans text-sm text-text-secondary py-6 text-center">
          No results found.
        </CommandEmpty>
        <CommandGroup heading="Navigation">
          {commands.map((cmd) => {
            const Icon = cmd.icon;
            return (
              <CommandItem
                key={cmd.href}
                onSelect={() => handleSelect(cmd.href)}
                className="font-sans cursor-pointer"
              >
                <Icon className="w-4 h-4 mr-2" />
                {cmd.label}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
