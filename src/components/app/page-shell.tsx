import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PageShell — wraps every page in the app.
 *
 * Provides:
 *   1. Top navigation bar with brand logo + breadcrumb back link
 *   2. 5-step pipeline progress indicator (visual breadcrumb)
 *   3. Page header: title + subtitle + action slot
 *   4. Content area
 *
 * currentStep: 1=portal, 2=review, 3=processing, 4=eligibility, 5=result/schedule
 */

const STEPS = [
  { n: 1, label: "Portal" },
  { n: 2, label: "Review" },
  { n: 3, label: "Processing" },
  { n: 4, label: "Eligibility" },
  { n: 5, label: "Result" },
];

interface PageShellProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  currentStep?: number;
  children: React.ReactNode;
}

export function PageShell({
  title,
  subtitle,
  actions,
  backHref,
  backLabel,
  currentStep,
  children,
}: PageShellProps) {
  return (
    <div className="min-h-screen bg-[#0b0d10] text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-white/5 bg-[#0b0d10]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-400">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <circle cx="7" cy="7" r="3" />
                <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">ReferralIQ</span>
          </div>

          <div className="mx-2 h-4 w-px bg-white/10" />

          {/* Back link */}
          {backHref && (
            <Link
              href={backHref}
              className="flex items-center gap-1 text-xs text-zinc-400 transition hover:text-white"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {backLabel ?? "Back"}
            </Link>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Pipeline step indicator */}
          {currentStep && (
            <div className="hidden items-center gap-1 md:flex">
              {STEPS.map((step, idx) => {
                const isActive = step.n === currentStep;
                const isDone = step.n < currentStep;
                const isLast = idx === STEPS.length - 1;

                return (
                  <div key={step.n} className="flex items-center gap-1">
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold transition-colors",
                        isActive
                          ? "bg-cyan-400 text-black"
                          : isDone
                          ? "bg-emerald-400/20 text-emerald-400"
                          : "bg-zinc-800 text-zinc-600"
                      )}
                    >
                      {isDone ? "✓" : step.n}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-medium",
                        isActive
                          ? "text-white"
                          : isDone
                          ? "text-emerald-400"
                          : "text-zinc-600"
                      )}
                    >
                      {step.label}
                    </span>
                    {!isLast && (
                      <div
                        className={cn(
                          "mx-1 h-px w-4",
                          isDone ? "bg-emerald-400/40" : "bg-white/10"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Page content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Page header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>

        {children}
      </div>
    </div>
  );
}
