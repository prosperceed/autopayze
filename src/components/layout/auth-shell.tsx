import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-muted/30">
      <div className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
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
          <span className="font-display text-lg font-semibold tracking-tight">
            Autopayze
          </span>
        </Link>
        <ThemeSwitcher />
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="rounded-lg border border-border bg-card p-8">
            <h1 className="font-display text-xl font-semibold text-foreground">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {description}
            </p>
            <div className="mt-6">{children}</div>
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {footer}
          </p>
        </div>
      </div>
    </div>
  );
}
