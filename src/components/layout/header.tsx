"use client";

import { Bell, Moon, Sun, LogOut, User } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const notifications = [
  { id: "1", title: "New order", message: "Order #1234 placed", read: false },
  { id: "2", title: "Low stock", message: "SKU ABC-001 below threshold", read: true },
];

export function Header() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const customerId = useAuthStore((s) => s.customerId);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const [openNotifications, setOpenNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <header
      className="flex h-14 items-center justify-between border-b bg-background px-4"
      role="banner"
    >
      <div className="flex items-center gap-2" />
      <div className="flex items-center gap-2">
        <Switch
          checked={theme === "dark"}
          onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          aria-label="Toggle dark mode"
        />
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setOpenNotifications(!openNotifications)}
          aria-label="Notifications"
          aria-expanded={openNotifications}
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
            {notifications.filter((n) => !n.read).length}
          </span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full" aria-label="User menu">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="font-normal">
                <p className="text-sm font-medium">Customer</p>
                <p className="text-xs text-muted-foreground">{customerId ?? "—"}</p>
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
