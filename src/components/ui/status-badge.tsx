import { cn } from "@/lib/utils";
import type { EligibilityVerdict } from "@/lib/types";

/**
 * StatusBadge — semantic pill for eligibility/agent statuses.
 *
 * Variant map:
 *   eligible       → emerald
 *   blocked_zip    → rose
 *   blocked_insurance → rose
 *   manual_review  → amber
 *   running        → cyan (pulsing)
 *   complete       → emerald
 *   queued         → zinc
 *   pending        → zinc
 */

type StatusBadgeVariant =
  | EligibilityVerdict
  | "running"
  | "complete"
  | "queued"
  | "pending"
  | "new";

const variantStyles: Record<StatusBadgeVariant, string> = {
  eligible:
    "bg-emerald-400/15 text-emerald-300 border border-emerald-400/25",
  blocked_zip:
    "bg-rose-500/15 text-rose-300 border border-rose-500/25",
  blocked_insurance:
    "bg-rose-500/15 text-rose-300 border border-rose-500/25",
  manual_review:
    "bg-amber-400/15 text-amber-300 border border-amber-400/25",
  running:
    "bg-cyan-400/15 text-cyan-300 border border-cyan-400/25",
  complete:
    "bg-emerald-400/15 text-emerald-300 border border-emerald-400/25",
  queued:
    "bg-zinc-800 text-zinc-400 border border-white/10",
  pending:
    "bg-zinc-800 text-zinc-400 border border-white/10",
  new:
    "bg-cyan-400/20 text-cyan-200 border border-cyan-400/40",
};

const variantLabels: Record<StatusBadgeVariant, string> = {
  eligible: "Eligible",
  blocked_zip: "Blocked — ZIP",
  blocked_insurance: "Blocked — Insurance",
  manual_review: "Manual Review",
  running: "Running",
  complete: "Complete",
  queued: "Queued",
  pending: "Pending",
  new: "New",
};

interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  label?: string;
  className?: string;
  pulse?: boolean;
}

export function StatusBadge({ variant, label, className, pulse }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {label ?? variantLabels[variant]}
    </span>
  );
}
