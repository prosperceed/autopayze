"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FeatureCardProps {
<<<<<<< HEAD
	icon: ReactNode;
	title: string;
	description: string;
	gradient: string;
	overlayGradient: string;
	className?: string;
}

export function FeatureCard({
	icon,
	title,
	description,
	gradient,
	overlayGradient,
	className,
}: FeatureCardProps) {
	return (
		<div className={cn("flex flex-col gap-3 sm:gap-4", className)}>
			<div
				className={cn(
					"group relative overflow-hidden rounded-2xl aspect-square",
					"bg-gradient-to-br",
					gradient,
					"transition-all duration-500 ease-out",
					"hover:-translate-y-1.5 shadow-lg hover:shadow-2xl",
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

				{/* Top-left specular highlight */}
				<div
					className="pointer-events-none absolute -top-12 -left-12 h-40 w-40 rounded-full bg-white/25 blur-2xl"
					aria-hidden="true"
				/>

				{/* Ambient glow behind the icon */}
				<div
					className="pointer-events-none absolute left-1/2 top-[40%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 blur-3xl transition-transform duration-500 group-hover:scale-110"
					aria-hidden="true"
				/>

				<div
					className={cn(
						"absolute inset-0 flex items-center justify-center",
						"translate-y-0",
						"transition-transform duration-500 ease-out",
						"md:group-hover:-translate-y-7",
					)}
				>
					<div
						className={cn(
							"relative flex items-center justify-center rounded-[1.75rem]",
							"h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28",
							"bg-white/20 backdrop-blur-md",
							"shadow-[0_8px_32px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.08)]",
							"transition-all duration-500",
							"md:group-hover:scale-105 md:group-hover:bg-white/25",
							"md:group-hover:shadow-[0_16px_48px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1px_0_rgba(0,0,0,0.1)]",
						)}
					>
						<div
							className="pointer-events-none absolute inset-x-3 top-2 h-5 rounded-xl bg-white/30 blur-sm"
							aria-hidden="true"
						/>

						<div
							className={cn(
								"relative flex items-center justify-center rounded-2xl",
								"h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16",
								"bg-white/35 backdrop-blur-lg",
								"shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(0,0,0,0.1)]",
							)}
						>
							<div
								className="pointer-events-none absolute inset-x-2 top-1.5 h-4 rounded-lg bg-white/40 blur-[3px]"
								aria-hidden="true"
							/>
							<div className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]">
								{icon}
							</div>
						</div>

						<div
							className="pointer-events-none absolute -bottom-3 left-1/2 h-4 w-16 -translate-x-1/2 rounded-full bg-black/20 blur-md"
							aria-hidden="true"
						/>
					</div>
				</div>

				{/* ── Gradient overlay ─────────────────────────────────────────────
            Always on for mobile (opacity-100), hover-only on md+.
        ─────────────────────────────────────────────────────────────────── */}
				<div
					className={cn(
						"pointer-events-none absolute inset-x-0 bottom-0 h-2/3",
						"bg-gradient-to-t",
						overlayGradient,
						"opacity-100 md:opacity-0 md:transition-opacity md:duration-500 md:group-hover:opacity-100",
					)}
					aria-hidden="true"
				/>

				{/* ── Bottom content ───────────────────────────────────────────────
            Description: always visible on mobile, fade-in on md+ hover.
            Title: always visible.
        ─────────────────────────────────────────────────────────────────── */}
				<div className="absolute inset-x-0 bottom-0 px-3.5 pb-4 sm:px-5 sm:pb-5">
					<p
						className={cn(
							"mb-2 leading-snug text-white/90",
							"text-[10px] sm:text-xs md:text-sm md:leading-relaxed",
							"[text-shadow:0_1px_3px_rgba(0,0,0,0.4)]",
							// Mobile: always visible, no transform
							"translate-y-0 opacity-100",
							// Desktop: hidden at rest, animates in on hover
							"md:translate-y-3 md:opacity-0",
							"md:transition-all md:duration-500 md:ease-out",
							"md:group-hover:translate-y-0 md:group-hover:opacity-100",
						)}
					>
						{description}
					</p>

					<div className="flex items-center gap-1.5 sm:gap-2">
						<h3
							className={cn(
								"font-display font-semibold text-white",
								"text-xs sm:text-sm",
								"[text-shadow:0_1px_4px_rgba(0,0,0,0.3)]",
							)}
						>
							{title}
						</h3>
						<div className="h-px flex-1 bg-white/30" aria-hidden="true" />
					</div>
				</div>
			</div>
		</div>
	);
=======
  icon: ReactNode;
  title: string;
  description: string;
  gradient: string;
  overlayGradient: string;
  className?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  gradient,
  overlayGradient,
  className,
}: FeatureCardProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:gap-4", className)}>
      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl aspect-square",
          "bg-gradient-to-br",
          gradient,
          "transition-all duration-500 ease-out",
          "hover:-translate-y-1.5 shadow-lg hover:shadow-2xl",
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

        {/* Top-left specular highlight */}
        <div
          className="pointer-events-none absolute -top-12 -left-12 h-40 w-40 rounded-full bg-white/25 blur-2xl"
          aria-hidden="true"
        />

        {/* Ambient glow behind the icon */}
        <div
          className="pointer-events-none absolute left-1/2 top-[40%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 blur-3xl transition-transform duration-500 group-hover:scale-110"
          aria-hidden="true"
        />

        {/* ── 3D Icon orb ──────────────────────────────────────────────────
            On mobile (no hover): sits at 38% height, slightly smaller.
            On desktop hover: lifts upward.
        ─────────────────────────────────────────────────────────────────── */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "translate-y-0",
            "transition-transform duration-500 ease-out",
            "md:group-hover:-translate-y-7",
          )}
        >
          <div
            className={cn(
              "relative flex items-center justify-center rounded-[1.75rem]",
              "h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28",
              "bg-white/20 backdrop-blur-md",
              "shadow-[0_8px_32px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.08)]",
              "transition-all duration-500",
              "md:group-hover:scale-105 md:group-hover:bg-white/25",
              "md:group-hover:shadow-[0_16px_48px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1px_0_rgba(0,0,0,0.1)]",
            )}
          >
            <div
              className="pointer-events-none absolute inset-x-3 top-2 h-5 rounded-xl bg-white/30 blur-sm"
              aria-hidden="true"
            />

            <div
              className={cn(
                "relative flex items-center justify-center rounded-2xl",
                "h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16",
                "bg-white/35 backdrop-blur-lg",
                "shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(0,0,0,0.1)]",
              )}
            >
              <div
                className="pointer-events-none absolute inset-x-2 top-1.5 h-4 rounded-lg bg-white/40 blur-[3px]"
                aria-hidden="true"
              />
              <div className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]">
                {icon}
              </div>
            </div>

            <div
              className="pointer-events-none absolute -bottom-3 left-1/2 h-4 w-16 -translate-x-1/2 rounded-full bg-black/20 blur-md"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* ── Gradient overlay ─────────────────────────────────────────────
            Always on for mobile (opacity-100), hover-only on md+.
        ─────────────────────────────────────────────────────────────────── */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-2/3",
            "bg-gradient-to-t",
            overlayGradient,
            "opacity-100 md:opacity-0 md:transition-opacity md:duration-500 md:group-hover:opacity-100",
          )}
          aria-hidden="true"
        />

        {/* ── Bottom content ───────────────────────────────────────────────
            Description: always visible on mobile, fade-in on md+ hover.
            Title: always visible.
        ─────────────────────────────────────────────────────────────────── */}
        <div className="absolute inset-x-0 bottom-0 px-3.5 pb-4 sm:px-5 sm:pb-5">
          <p
            className={cn(
              "mb-2 leading-snug text-white/90",
              "text-[10px] sm:text-xs md:text-sm md:leading-relaxed",
              "[text-shadow:0_1px_3px_rgba(0,0,0,0.4)]",
              // Mobile: always visible, no transform
              "translate-y-0 opacity-100",
              // Desktop: hidden at rest, animates in on hover
              "md:translate-y-3 md:opacity-0",
              "md:transition-all md:duration-500 md:ease-out",
              "md:group-hover:translate-y-0 md:group-hover:opacity-100",
            )}
          >
            {description}
          </p>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <h3
              className={cn(
                "font-display font-semibold text-white",
                "text-xs sm:text-sm",
                "[text-shadow:0_1px_4px_rgba(0,0,0,0.3)]",
              )}
            >
              {title}
            </h3>
          </div>
        </div>
      </div>

    </div>
  );
>>>>>>> be075ac77e25a096f2375aada189a283996dc944
}
