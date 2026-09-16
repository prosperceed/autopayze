"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { NavSidebar } from "./nav-sidebar";
import { adminNavItems } from "./admin-sidebar";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

function useBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean); // ["admin", "users"]
  const crumbs = segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));
  return crumbs;
}

export function AdminHeader({ userEmail }: { userEmail?: string | null }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const crumbs = useBreadcrumb();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-border px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-muted md:hidden"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-sm sm:flex">
            {crumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-muted-foreground">/</span>}
                <Link
                  href={crumb.href}
                  className={
                    i === crumbs.length - 1
                      ? "font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }
                >
                  {crumb.label}
                </Link>
              </span>
            ))}
          </nav>

          <Badge tone="info" className="sm:hidden">
            Admin
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          {userEmail && (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-sm text-muted-foreground">{userEmail}</span>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Log out"
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-base font-semibold">
                Autopayze <Badge tone="info">Admin</Badge>
              </span>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div onClick={() => setOpen(false)}>
              <NavSidebar items={adminNavItems} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
