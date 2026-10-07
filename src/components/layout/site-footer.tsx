import Link from "next/link";

const columns = [
  {
    title: "Product",
    links: [
      { href: "#features", label: "Features" },
     
      { href: "/wallet", label: "Wallet" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "#", label: "About" },
      { href: "#", label: "Security" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "#", label: "Terms" },
      { href: "#", label: "Privacy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="flex items-center justify-center gap-2.5 border-b border-border/50 bg-muted/30 py-3">
        <svg
          width="18"
          height="18"
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden="true"
          className="shrink-0 text-[#7B61FF]"
        >
          <path
            d="M27.42 8.57a.75.75 0 0 1-.22 1.04l-2.3 1.53H26a.75.75 0 0 1 0 1.5H22.5l-8.9 5.92H26a.75.75 0 0 1 0 1.5H11.2l-2.4 1.59a.75.75 0 1 1-.83-1.25l1.04-.69H6a.75.75 0 0 1 0-1.5h4.42l8.9-5.92H6a.75.75 0 0 1 0-1.5h14.73l1.66-1.1a.75.75 0 0 1 1.03.22v-.04Z"
            fill="currentColor"
          />
        </svg>
        <span className="text-xs font-medium tracking-wide text-muted-foreground">
          Built on{" "}
          <span className="font-semibold text-foreground">Stellar Network</span>
        </span>
      </div>
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <span className="font-display text-lg font-semibold tracking-tight">
            Autopayze
          </span>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Automated crypto payments for people who don&apos;t want to babysit their wallet.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-medium text-foreground">{col.title}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Autopayze. All rights reserved.
      </div>
    </footer>
  );
}
