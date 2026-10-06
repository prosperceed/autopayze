"use client";

/**
 * AgentDashboardMock
 *
 * A pixel-perfect static mockup of the Autopayze AI agent chat interface.
 * Rendered entirely in JSX — no external images, no AI-style blobs.
 * Used in the "How it works" section of the landing page.
 */

export function AgentDashboardMock() {
  return (
    <div className="relative w-full select-none" aria-hidden="true">
      {/* Ambient glow behind the card */}
      <div className="pointer-events-none absolute -inset-6 rounded-3xl bg-primary/10 blur-3xl" />

      {/* Main browser-frame card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10">

        {/* Browser chrome bar */}
        <div className="flex items-center gap-1.5 border-b border-border bg-muted/60 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          <div className="ml-3 flex-1 rounded-md bg-muted px-3 py-1 text-center">
            <span className="text-[10px] text-muted-foreground">autopayze.app/agent</span>
          </div>
        </div>

        {/* App shell — sidebar + chat area */}
        <div className="flex h-[390px]">

          {/* Mini sidebar */}
          <div className="flex w-[52px] flex-col items-center gap-4 border-r border-border bg-muted/40 py-4">
            {/* Logo mark */}
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20">
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
                <path d="M10 3 L14 10 C15.5 12.5 16 13.5 16 14 C16 14.5 15.5 14.8 14 14.8 L12 14.8 C11.5 14.8 11.2 14.5 10.7 13.7 L9.2 11 Z" fill="url(#dm-rg)" />
                <path d="M10 3 C9.3 3 8.8 3.5 8.3 4.5 L5.2 10.5 C4.5 11.8 4.3 12.5 4.8 13 C5.3 13.4 6 13.3 7 13 L10 10.5 Z" fill="url(#dm-lg)" />
                <path d="M4.5 13 C4.5 13 8 10.8 12 8.5 L13.5 10 L15.5 6 L11 7.3 L12 8.5 C8.5 10.5 5.2 12.8 4.5 13 Z" fill="url(#dm-ag)" />
                <defs>
                  <linearGradient id="dm-lg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00D2FF" />
                    <stop offset="100%" stopColor="#0066FF" />
                  </linearGradient>
                  <linearGradient id="dm-rg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8033FF" />
                    <stop offset="100%" stopColor="#C077FF" />
                  </linearGradient>
                  <linearGradient id="dm-ag" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3B46F6" />
                    <stop offset="100%" stopColor="#00F0FF" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Nav dots */}
            {[
              { active: false, label: "Dashboard" },
              { active: false, label: "Wallet" },
              { active: true,  label: "Agent" },
              { active: false, label: "Schedules" },
              { active: false, label: "Activity" },
            ].map(({ active, label }) => (
              <div
                key={label}
                className={`h-7 w-7 rounded-lg ${
                  active
                    ? "bg-primary/20 ring-1 ring-primary/40"
                    : "bg-transparent hover:bg-muted"
                } flex items-center justify-center`}
              >
                <div
                  className={`h-1.5 w-1.5 rounded-full ${
                    active ? "bg-primary" : "bg-muted-foreground/40"
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Chat panel */}
          <div className="flex flex-1 flex-col">

            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                  <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="rgb(var(--color-primary))" strokeWidth="1.5" />
                    <path d="M5 9 Q8 5 11 9" stroke="rgb(var(--color-primary))" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                    <circle cx="6" cy="7" r="1" fill="rgb(var(--color-primary))" />
                    <circle cx="10" cy="7" r="1" fill="rgb(var(--color-primary))" />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-foreground">Autopayze Agent</span>
                <span className="flex items-center gap-1 rounded-full bg-success/10 px-1.5 py-0.5 text-[9px] font-medium text-success">
                  <span className="h-1 w-1 rounded-full bg-success" />
                  Active
                </span>
              </div>
              <div className="flex gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex flex-1 flex-col gap-3 overflow-hidden px-4 py-4">

              {/* User message */}
              <div className="flex justify-end">
                <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-[11px] leading-relaxed text-primary-foreground">
                  Send 50 USDC to Alice every Friday at 9am
                </div>
              </div>

              {/* Agent response */}
              <div className="flex gap-2">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-border bg-muted/60 px-3 py-2">
                  <p className="text-[11px] leading-relaxed text-foreground">
                    Got it. I'll schedule <span className="font-semibold text-primary">50 USDC → Alice</span> every Friday at 09:00 UTC.
                  </p>
                  {/* Intent card */}
                  <div className="mt-2 rounded-lg border border-border bg-card p-2.5">
                    <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Payment intent</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      {[
                        ["Recipient", "Alice (G3AB…F7K)"],
                        ["Amount",    "50 USDC"],
                        ["Frequency", "Weekly · Fri 09:00"],
                        ["Network",   "Stellar Testnet"],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <p className="text-[8px] text-muted-foreground">{k}</p>
                          <p className="text-[10px] font-medium text-foreground">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Approval prompt */}
              <div className="flex gap-2">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-border bg-muted/60 px-3 py-2">
                  <p className="text-[11px] leading-relaxed text-foreground">
                    Nothing executes until you approve. Confirm to activate?
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button className="rounded-lg bg-primary px-3 py-1 text-[10px] font-semibold text-primary-foreground">
                      Confirm
                    </button>
                    <button className="rounded-lg border border-border px-3 py-1 text-[10px] font-medium text-muted-foreground">
                      Edit
                    </button>
                  </div>
                </div>
              </div>

              {/* User confirms */}
              <div className="flex justify-end">
                <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-[11px] leading-relaxed text-primary-foreground">
                  Confirm
                </div>
              </div>

              {/* Success */}
              <div className="flex gap-2">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15">
                  <div className="h-1.5 w-1.5 rounded-full bg-success" />
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-success/20 bg-success/5 px-3 py-2">
                  <p className="text-[11px] leading-relaxed text-foreground">
                    ✓ Schedule activated. First transfer runs this Friday.
                  </p>
                </div>
              </div>
            </div>

            {/* Input bar */}
            <div className="border-t border-border px-4 py-3">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2">
                <span className="flex-1 text-[11px] text-muted-foreground/60">
                  Ask the agent anything…
                </span>
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary">
                  <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
                    <path d="M2 6 L10 6 M7 3 L10 6 L7 9" stroke="rgb(var(--color-primary-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Floating schedule confirmed badge */}
      <div className="absolute -bottom-3 -right-3 flex items-center gap-2 rounded-xl border border-success/30 bg-card px-3 py-2 shadow-lg">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-success">
          <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
            <path d="M2 6 L5 9 L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <p className="text-[10px] font-semibold text-foreground">Schedule Active</p>
          <p className="text-[9px] text-muted-foreground">Next: Fri · 09:00 UTC</p>
        </div>
      </div>
    </div>
  );
}
