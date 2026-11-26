import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Repeat,
  Gift,
  Wallet,
  Bot,
  Activity,
  Settings,
} from "lucide-react";
import { NavSidebar, type NavItem } from "./nav-sidebar";
import { Badge } from "@/components/ui/badge";
import AutoPayzeLogo from "@/components/ui/AutoPayzeLogo";

export const adminNavItems: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: Repeat },
  { href: "/admin/schedules", label: "Schedules", icon: Repeat },
  { href: "/admin/airdrops", label: "Airdrops", icon: Gift },
  { href: "/admin/wallets", label: "Wallets", icon: Wallet },
  { href: "/admin/agent", label: "AI agent", icon: Bot },
  { href: "/admin/activity", label: "Activity", icon: Activity },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border/80 bg-card md:flex md:flex-col">
      <div className="flex h-20 items-center gap-3 px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="flex h-8 w-auto items-center">
            <AutoPayzeLogo className="h-full w-auto" />
          </span>
        </Link>
        <Badge tone="info">Admin</Badge>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <NavSidebar items={adminNavItems} />
      </div>
      <div className="border-t border-border p-3">
        <Link
          href="/dashboard"
          className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          ← Back to app
        </Link>
      </div>
    </aside>
  );
}
