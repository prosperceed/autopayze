"use client";

/*
  Three-node diagram matching the heroflow.png reference:
  - Wallet balance  (top-left,    white card)
  - Agent watching  (center-right, purple card)
  - Sent/On schedule(bottom-left,  white card, teal check)

  "Flowing current" effect:
  - A long dashed stroke travels the two connector paths via
    stroke-dashoffset animation (CSS keyframes injected once).
  - A pair of glowing dots ride each segment with staggered delays.
  - The agent card pulses with a faint ring to signal active watching.
*/

import { useEffect } from "react";

const STYLE_ID = "pfv-keyframes";

const keyframes = `
@keyframes pfv-flow {
  to { stroke-dashoffset: -48; }
}
@keyframes pfv-dot {
  0%   { offset-distance: 0%;   opacity: 0;   }
  8%   { opacity: 1; }
  92%  { opacity: 1; }
  100% { offset-distance: 100%; opacity: 0; }
}
@keyframes pfv-pulse {
  0%, 100% { opacity: 0.18; r: 58; }
  50%       { opacity: 0.38; r: 66; }
}
@keyframes pfv-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.45; }
}
`;

/* SVG motionPath helper — two dots riding each segment */
function FlowDot({
  path,
  fill,
  delay,
  dur = "2.2s",
}: {
  path: string;
  fill: string;
  delay: string;
  dur?: string;
}) {
  return (
    <circle r="4" fill={fill} style={{ filter: `drop-shadow(0 0 4px ${fill})` }}>
      <animateMotion dur={dur} begin={delay} repeatCount="indefinite" calcMode="linear">
        <mpath xlinkHref={path} />
      </animateMotion>
    </circle>
  );
}

export function PaymentFlowVisual() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const tag = document.createElement("style");
    tag.id = STYLE_ID;
    tag.textContent = keyframes;
    document.head.appendChild(tag);
  }, []);

  return (
    <svg
      viewBox="0 0 460 400"
      className="h-auto w-full max-w-[420px]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Payment flow: wallet balance watched by agent, payment sent on schedule"
    >
      <defs>
        {/* ── Connector path definitions (reused by animateMotion) ── */}
        {/* Wallet → Agent */}
        <path
          id="pfv-path-wa"
          d="M 148 88 C 200 88, 240 188, 310 200"
        />
        {/* Agent → Sent */}
        <path
          id="pfv-path-as"
          d="M 310 248 C 260 280, 200 300, 148 308"
        />

        {/* ── Drop shadows ── */}
        <filter id="pfv-shadow-card" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="8" floodColor="#b0b8d8" floodOpacity="0.22" />
        </filter>
        <filter id="pfv-shadow-agent" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="6" stdDeviation="14" floodColor="#5b5fef" floodOpacity="0.45" />
        </filter>

        {/* ── Background field gradient ── */}
        <radialGradient id="pfv-bg" cx="55%" cy="48%" r="52%">
          <stop offset="0%" stopColor="#eef0ff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#e4e7f5" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── Background ── */}
      <rect width="460" height="400" rx="20" fill="#edf0f8" />
      <ellipse cx="255" cy="195" rx="210" ry="168" fill="url(#pfv-bg)" />

      {/* ════════════════════════════════════════
          CONNECTOR PATH 1 — Wallet → Agent
          Long dash so the flow feels like current
      ════════════════════════════════════════ */}
      <use
        href="#pfv-path-wa"
        stroke="#8b8ff8"
        strokeOpacity="0.30"
        strokeWidth="2"
        strokeDasharray="6 6"
        strokeLinecap="round"
      />
      {/* Animated current overlay */}
      <use
        href="#pfv-path-wa"
        stroke="#6366f1"
        strokeOpacity="0.75"
        strokeWidth="2"
        strokeDasharray="12 36"
        strokeLinecap="round"
        style={{ animation: "pfv-flow 1.4s linear infinite" }}
      />
      <FlowDot path="#pfv-path-wa" fill="#818cf8" delay="0s" dur="1.8s" />
      <FlowDot path="#pfv-path-wa" fill="#a5b4fc" delay="0.9s" dur="1.8s" />

      {/* ════════════════════════════════════════
          CONNECTOR PATH 2 — Agent → Sent
      ════════════════════════════════════════ */}
      <use
        href="#pfv-path-as"
        stroke="#8b8ff8"
        strokeOpacity="0.30"
        strokeWidth="2"
        strokeDasharray="6 6"
        strokeLinecap="round"
      />
      <use
        href="#pfv-path-as"
        stroke="#6366f1"
        strokeOpacity="0.75"
        strokeWidth="2"
        strokeDasharray="12 36"
        strokeLinecap="round"
        style={{ animation: "pfv-flow 1.4s linear infinite", animationDelay: "0.7s" }}
      />
      <FlowDot path="#pfv-path-as" fill="#0d9488" delay="0.7s" dur="1.8s" />
      <FlowDot path="#pfv-path-as" fill="#2dd4bf" delay="1.6s" dur="1.8s" />

      {/* ════════════════════════════════════════
          NODE 1 — WALLET BALANCE (top-left)
      ════════════════════════════════════════ */}
      <g filter="url(#pfv-shadow-card)">
        {/* card */}
        <rect x="28" y="28" width="148" height="88" rx="14" fill="white" stroke="#e2e5ef" strokeWidth="1" />

        {/* toggle track */}
        <rect x="44" y="50" width="54" height="26" rx="13" fill="#eceef8" stroke="#d8dcea" strokeWidth="1" />
        {/* thumb — active right */}
        <circle cx="86" cy="63" r="10" fill="#5b5fef" style={{ filter: "drop-shadow(0 2px 4px rgba(91,95,239,0.5))" }} />
        {/* inner shine */}
        <circle cx="83" cy="60" r="3.5" fill="white" fillOpacity="0.35" />

        {/* skeleton text lines */}
        <rect x="108" y="52" width="52" height="7" rx="3.5" fill="#d0d3e8" />
        <rect x="108" y="65" width="38" height="6" rx="3" fill="#e0e2ef" />
      </g>
      {/* label */}
      <text x="102" y="130" textAnchor="middle"
        fill="#7b869e" style={{ font: "500 11px Inter, ui-sans-serif, sans-serif" }}>
        Wallet balance
      </text>

      {/* ════════════════════════════════════════
          NODE 2 — AGENT WATCHING (center-right)
          Pulse ring signals "active watching"
      ════════════════════════════════════════ */}
      {/* pulse ring */}
      <circle
        cx="312"
        cy="212"
        fill="#5b5fef"
        fillOpacity="0.10"
        style={{ animation: "pfv-pulse 2.4s ease-in-out infinite" }}
      >
        {/* r is animated via keyframes but SVG attribute sets initial */}
        <animate attributeName="r" values="58;66;58" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="fill-opacity" values="0.10;0.22;0.10" dur="2.4s" repeatCount="indefinite" />
      </circle>

      <g filter="url(#pfv-shadow-agent)">
        <rect x="240" y="168" width="160" height="100" rx="16" fill="#5b5fef" />
        <rect x="240" y="168" width="160" height="100" rx="16" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

        {/* avatar */}
        <circle cx="268" cy="206" r="15" fill="rgba(255,255,255,0.16)" />
        <circle cx="268" cy="200" r="6"  fill="rgba(255,255,255,0.82)" />
        <ellipse cx="268" cy="216" rx="10" ry="5" fill="rgba(255,255,255,0.62)" />

        {/* content lines */}
        <rect x="292" y="192" width="84" height="8" rx="4" fill="rgba(255,255,255,0.72)" />
        <rect x="292" y="206" width="62" height="7" rx="3.5" fill="rgba(255,255,255,0.42)" />
        <rect x="292" y="219" width="74" height="6" rx="3" fill="rgba(255,255,255,0.28)" />
        <rect x="292" y="231" width="50" height="6" rx="3" fill="rgba(255,255,255,0.18)" />

        {/* active dot — blinking */}
        <circle cx="258" cy="248" r="4" fill="#4ade80"
          style={{ animation: "pfv-blink 1.6s ease-in-out infinite" }} />
        <circle cx="258" cy="248" r="7" fill="#4ade80" fillOpacity="0.20" />
        <text x="270" y="252" fill="rgba(255,255,255,0.80)"
          style={{ font: "500 9px Inter, ui-sans-serif, sans-serif" }}>
          watching
        </text>
      </g>
      {/* label */}
      <text x="320" y="284" textAnchor="middle"
        fill="#7b869e" style={{ font: "500 11px Inter, ui-sans-serif, sans-serif" }}>
        Agent watching
      </text>

      {/* ════════════════════════════════════════
          NODE 3 — SENT / ON SCHEDULE (bottom-left)
      ════════════════════════════════════════ */}
      <g filter="url(#pfv-shadow-card)">
        <rect x="28" y="284" width="148" height="80" rx="14" fill="white" stroke="#e2e5ef" strokeWidth="1" />

        {/* teal check circle */}
        <circle cx="56" cy="322" r="14" fill="#e6faf8" />
        <path d="M48 322 L54 328 L66 313"
          stroke="#0d9488" strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* text */}
        <text x="80" y="316" fill="#1a1f36"
          style={{ font: "600 11px Inter, ui-sans-serif, sans-serif" }}>
          Sent
        </text>
        <text x="80" y="332" fill="#5b5fef"
          style={{ font: "500 10px Inter, ui-sans-serif, sans-serif" }}>
          On schedule
        </text>
      </g>
    </svg>
  );
}
