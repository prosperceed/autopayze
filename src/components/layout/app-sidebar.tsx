"use client";

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
import AutoPayzeLogo from "../ui/AutoPayzeLogo";

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
		<aside className="hidden w-64 shrink-0 border-r border-border/80 bg-card md:flex md:flex-col">
			<div className="flex h-20 items-center px-6">
				<Link href="/dashboard" className="flex items-center gap-2">
					<span className="flex h-9 w-auto items-center justify-center">
						<AutoPayzeLogo className="hidden h-full w-auto lg:block" />
					</span>
				</Link>
			</div>
			<div className="flex-1 overflow-y-auto px-3 py-2">
				<NavSidebar items={appNavItems} />
			</div>
		</aside>
	);
}
