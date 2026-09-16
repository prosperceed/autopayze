export function PaymentFlowVisual() {
  return (
    <svg
      viewBox="0 0 480 420"
      className="h-auto w-full max-w-md"
      role="img"
      aria-label="Diagram: a wallet balance is watched by the Autopayze agent, which schedules and sends a payment to a recipient"
    >
      <defs>
        <linearGradient id="flowLine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--color-primary))" stopOpacity="0.7" />
          <stop offset="100%" stopColor="rgb(var(--color-success))" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      {/* connecting path */}
      <path
        d="M120 70 C 120 150, 360 90, 360 190 C 360 260, 120 250, 120 340"
        fill="none"
        stroke="url(#flowLine)"
        strokeWidth="2"
        strokeDasharray="1 10"
        strokeLinecap="round"
      />

      {/* wallet node */}
      <g transform="translate(60 30)">
        <rect
          x="0"
          y="0"
          width="120"
          height="80"
          rx="14"
          className="fill-card stroke-border"
          strokeWidth="1"
        />
        <rect x="16" y="24" width="88" height="32" rx="8" className="fill-muted" />
        <circle cx="88" cy="40" r="8" className="fill-primary" />
        <text
          x="16"
          y="70"
          className="fill-muted-foreground"
          style={{ font: "500 10px var(--font-body)" }}
        >
          Wallet balance
        </text>
      </g>

      {/* agent node */}
      <g transform="translate(280 150)">
        <rect
          x="0"
          y="0"
          width="140"
          height="90"
          rx="16"
          className="fill-primary"
        />
        <circle cx="28" cy="30" r="10" className="fill-primary-foreground" fillOpacity="0.9" />
        <rect x="48" y="24" width="72" height="8" rx="4" className="fill-primary-foreground" fillOpacity="0.6" />
        <rect x="48" y="38" width="52" height="8" rx="4" className="fill-primary-foreground" fillOpacity="0.4" />
        <text
          x="20"
          y="72"
          className="fill-primary-foreground"
          style={{ font: "600 11px var(--font-display)" }}
        >
          Agent watching
        </text>
      </g>

      {/* recipient node */}
      <g transform="translate(70 300)">
        <rect
          x="0"
          y="0"
          width="120"
          height="80"
          rx="14"
          className="fill-card stroke-border"
          strokeWidth="1"
        />
        <circle cx="24" cy="30" r="12" className="fill-success" fillOpacity="0.2" />
        <path
          d="M18 30 L23 35 L32 24"
          className="stroke-success"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x="48"
          y="26"
          className="fill-foreground"
          style={{ font: "600 11px var(--font-body)" }}
        >
          Sent
        </text>
        <text
          x="48"
          y="42"
          className="fill-muted-foreground"
          style={{ font: "500 10px var(--font-body)" }}
        >
          On schedule
        </text>
      </g>
    </svg>
  );
}
