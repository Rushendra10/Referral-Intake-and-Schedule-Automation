import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { EligibilityVerdict } from "@/lib/types";

/**
 * VerdictBanner — full-width colored banner shown at the end of eligibility.
 *
 * Colors:
 *   eligible       → emerald gradient
 *   blocked_*      → rose gradient
 *   manual_review  → amber gradient
 *
 * Optionally shows a CTA button (e.g. "Proceed to Scheduling" or "View Result").
 */

const verdictConfig: Record<
  EligibilityVerdict,
  {
    icon: React.ReactNode;
    gradient: string;
    border: string;
    textColor: string;
    iconColor: string;
    title: string;
  }
> = {
  eligible: {
    icon: <CheckCircle2 className="h-6 w-6" />,
    gradient: "from-emerald-950/80 to-emerald-900/40",
    border: "border-emerald-400/25",
    textColor: "text-emerald-100",
    iconColor: "text-emerald-400",
    title: "Eligible for SunCare Home Health",
  },
  blocked_zip: {
    icon: <XCircle className="h-6 w-6" />,
    gradient: "from-rose-950/80 to-rose-900/40",
    border: "border-rose-400/25",
    textColor: "text-rose-100",
    iconColor: "text-rose-400",
    title: "Not Eligible — ZIP Code Outside Coverage",
  },
  blocked_insurance: {
    icon: <XCircle className="h-6 w-6" />,
    gradient: "from-rose-950/80 to-rose-900/40",
    border: "border-rose-400/25",
    textColor: "text-rose-100",
    iconColor: "text-rose-400",
    title: "Not Eligible — Insurance Not Accepted",
  },
  manual_review: {
    icon: <AlertTriangle className="h-6 w-6" />,
    gradient: "from-amber-950/80 to-amber-900/40",
    border: "border-amber-400/25",
    textColor: "text-amber-100",
    iconColor: "text-amber-400",
    title: "Manual Review Required",
  },
};

interface VerdictBannerProps {
  verdict: EligibilityVerdict;
  reason: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
}

export function VerdictBanner({
  verdict,
  reason,
  ctaLabel,
  ctaHref,
  className,
}: VerdictBannerProps) {
  const config = verdictConfig[verdict];

  return (
    <div
      className={cn(
        "rounded-3xl border bg-gradient-to-br p-6",
        config.gradient,
        config.border,
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn("mt-0.5 shrink-0", config.iconColor)}>{config.icon}</div>

        {/* Content */}
        <div className="flex-1">
          <div className={cn("text-base font-semibold", config.textColor)}>
            {config.title}
          </div>
          <p className={cn("mt-1 text-sm leading-relaxed opacity-80", config.textColor)}>
            {reason}
          </p>
        </div>

        {/* CTA */}
        {ctaLabel && ctaHref && (
          <Link
            href={ctaHref}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90",
              verdict === "eligible" || verdict === "manual_review"
                ? "bg-white text-black"
                : "hidden"
            )}
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
