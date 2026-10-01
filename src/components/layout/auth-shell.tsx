import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import AutoPayzeLogo from "../ui/AutoPayzeLogo";

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
					<span className="flex h-20 w-auto items-center justify-center">
						<AutoPayzeLogo className="h-7 w-auto" />
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
