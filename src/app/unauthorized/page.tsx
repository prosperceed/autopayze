import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <ShieldAlert className="h-6 w-6 text-destructive" />
      </div>
      <h1 className="font-display text-xl font-semibold text-foreground">
        You don&apos;t have access to this page
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This area is restricted to admins. If you think this is a mistake, contact whoever manages your Autopayze account.
      </p>
      <Link href="/dashboard" className={buttonVariants({ size: "sm" })}>
        Back to dashboard
      </Link>
    </div>
  );
}
