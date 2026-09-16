import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Admin settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform-level configuration. Only visible to admins.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Applies to the admin area for your account only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSwitcher />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin roles</CardTitle>
          <CardDescription>
            Manage who has admin access. See the README for how roles are provisioned in Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Role management tooling isn&apos;t wired up in this phase — roles are currently
            set directly in the <code className="rounded bg-muted px-1 py-0.5">profiles</code> table.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
