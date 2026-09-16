import Link from "next/link";
import {
  LayoutDashboard,
  Wallet,
  Repeat,
  Gift,
  Activity,
  Bot,
  Settings,
} from "lucide-react";
import { NavSidebar, type NavItem } from "./nav-sidebar";

export const appNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/payments", label: "Payments", icon: Repeat },
  { href: "/schedules", label: "Schedules", icon: Repeat },
  { href: "/airdrops", label: "Airdrops", icon: Gift },
  { href: "/agent", label: "AI agent", icon: Bot },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card/50 md:flex md:flex-col">
      <div className="flex h-16 items-center px-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 12L10 18L20 6"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="font-display text-base font-semibold tracking-tight">
            Autopayze
          </span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <NavSidebar items={appNavItems} />
      </div>
    </aside>
  );
}
