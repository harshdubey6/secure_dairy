"use client";

import { useTheme } from "next-themes";
import { useUIStore } from "@/stores/ui-store";
import { Menu, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const themeIcons: Record<string, React.ReactNode> = {
  paper: <span className="text-sm">📖</span>,
  light: <Sun className="w-4 h-4" />,
  dark: <Moon className="w-4 h-4" />,
  sepia: <span className="text-sm">📜</span>,
};

export function TopBar() {
  const { theme, setTheme } = useTheme();
  const { toggleSidebar } = useUIStore();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="h-16 border-b border-border-light bg-bg-surface flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="lg:hidden text-text-secondary"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="text-text-secondary hover:text-text-primary"
              />
            }
          >
            {theme ? themeIcons[theme] || <Sun className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-bg-surface border-border-light"
          >
            {["paper", "light", "dark", "sepia"].map((t) => (
              <DropdownMenuItem
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  "font-sans text-sm cursor-pointer",
                  theme === t
                    ? "text-accent bg-border-light"
                    : "text-text-secondary"
                )}
              >
                {themeIcons[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full"
              />
            }
          >
            <Avatar className="h-8 w-8 border border-border-light">
              <AvatarFallback className="bg-border-light text-text-secondary font-sans text-xs">
                U
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-bg-surface border-border-light w-48"
          >
            <DropdownMenuItem
              onClick={() => router.push("/settings/profile")}
              className="font-sans text-sm text-text-secondary cursor-pointer"
            >
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/settings")}
              className="font-sans text-sm text-text-secondary cursor-pointer"
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleLogout}
              className="font-sans text-sm text-red cursor-pointer"
            >
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
