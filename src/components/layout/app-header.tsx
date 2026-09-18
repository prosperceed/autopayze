"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, LogOut } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { NavSidebar } from "./nav-sidebar";
import { appNavItems } from "./app-sidebar";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function AppHeader({
  title,
  userEmail,
}: {
  title?: string;
  userEmail?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
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
          <Link
            href="/dashboard"
            className="flex items-center gap-2 md:hidden"
            aria-label="Autopayze dashboard"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
          {title && (
            <h1 className="hidden text-sm font-semibold text-foreground sm:text-base md:block">
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          {userEmail && (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-sm text-muted-foreground">
                {userEmail}
              </span>
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

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <Link
                href="/dashboard"
                className="font-display text-base font-semibold"
                onClick={() => setOpen(false)}
              >
                Autopayze
              </Link>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto" onClick={() => setOpen(false)}>
              <NavSidebar items={appNavItems} />
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
