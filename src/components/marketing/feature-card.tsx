"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  gradient: string;
  overlayGradient: string;
  dotColor: string;
  number: string;
  label: string;
  className?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  gradient,
  overlayGradient,
  dotColor,
  number,
  label,
  className,
}: FeatureCardProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl aspect-square",
          "bg-gradient-to-br",
          gradient,
          "transition-all duration-500 ease-out",
          "hover:-translate-y-1.5",
          "shadow-lg hover:shadow-2xl",
        )}
      >
        {/* Noise grain */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          }}
          aria-hidden="true"
        />

        {/* Top specular highlight — simulates a light source from top-left */}
        <div
          className="pointer-events-none absolute -top-12 -left-12 h-40 w-40 rounded-full bg-white/25 blur-2xl"
          aria-hidden="true"
        />

        {/* Ambient glow behind the icon */}
        <div
          className="pointer-events-none absolute left-1/2 top-[44%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 blur-3xl transition-transform duration-500 group-hover:scale-110"
          aria-hidden="true"
        />

        {/* ── 3D Icon orb ───────────────────────────────────────────────── */}
        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out group-hover:-translate-y-6">
          {/* Outer ring — frosted glass plate */}
          <div
            className={cn(
              "relative flex h-28 w-28 items-center justify-center rounded-[2rem]",
              "bg-white/20 backdrop-blur-md",
              "shadow-[0_8px_32px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.08)]",
              "transition-all duration-500 group-hover:scale-105 group-hover:bg-white/25",
              "group-hover:shadow-[0_16px_48px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1px_0_rgba(0,0,0,0.1)]",
            )}
          >
            {/* Inner specular shine strip at top of outer ring */}
            <div
              className="pointer-events-none absolute inset-x-3 top-2 h-6 rounded-xl bg-white/30 blur-sm"
              aria-hidden="true"
            />

            {/* Inner icon tile */}
            <div
              className={cn(
                "relative flex h-16 w-16 items-center justify-center rounded-2xl",
                "bg-white/35 backdrop-blur-lg",
                "shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(0,0,0,0.1)]",
              )}
            >
              {/* Shine on inner tile */}
              <div
                className="pointer-events-none absolute inset-x-2 top-1.5 h-4 rounded-lg bg-white/40 blur-[3px]"
                aria-hidden="true"
              />
              {/* Icon */}
              <div className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]">
                {icon}
              </div>
            </div>

            {/* Bottom shadow cast under the outer ring */}
            <div
              className="pointer-events-none absolute -bottom-3 left-1/2 h-4 w-20 -translate-x-1/2 rounded-full bg-black/20 blur-md"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* ── Gradient overlay for text area — fades in on hover ────────── */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-3/5",
            "bg-gradient-to-t opacity-0 transition-opacity duration-500 group-hover:opacity-100",
            overlayGradient,
          )}
          aria-hidden="true"
        />

        {/* ── Bottom content ─────────────────────────────────────────────── */}
        <div className="absolute inset-x-0 bottom-0 px-5 pb-5">
          <p
            className={cn(
              "mb-3 text-sm leading-relaxed text-white",
              "translate-y-3 opacity-0",
              "transition-all duration-500 ease-out",
              "group-hover:translate-y-0 group-hover:opacity-100",
              "[text-shadow:0_1px_3px_rgba(0,0,0,0.3)]",
            )}
          >
            {description}
          </p>

          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 shrink-0 rounded-full shadow-sm", dotColor)} aria-hidden="true" />
            <h3 className="font-display text-sm font-semibold text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.25)]">
              {title}
            </h3>
          </div>
        </div>
      </div>

      {/* Below-card label row */}
      <div className="flex items-center gap-3 px-1">
        <span className="text-xs font-semibold tabular-nums text-muted-foreground/50">
          {number}
        </span>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
