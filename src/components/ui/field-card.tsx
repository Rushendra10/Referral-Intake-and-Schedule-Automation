import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";

/**
 * FieldCard — displays a single extracted referral field with:
 *   - label (uppercase, muted)
 *   - value (white) or "Missing / incomplete" (amber) if null
 *   - an optional confidence bar (0–1) shown as a colored progress bar
 *   - a "source" tag: extracted | pre-filled | missing
 *
 * Used on the ReferralDetailPage and ResultPage to display extracted data.
 */

interface FieldCardProps {
  label: string;
  value: string | null | undefined;
  confidence?: number; // 0–1
  className?: string;
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return "text-emerald-400";
  if (confidence >= 0.7) return "text-cyan-400";
  if (confidence >= 0.4) return "text-amber-400";
  return "text-rose-400";
}

function getProgressColor(confidence: number): string {
  if (confidence >= 0.9) return "[&_.indicator]:bg-emerald-400";
  if (confidence >= 0.7) return "[&_.indicator]:bg-cyan-400";
  if (confidence >= 0.4) return "[&_.indicator]:bg-amber-400";
  return "[&_.indicator]:bg-rose-400";
}

export function FieldCard({ label, value, confidence, className }: FieldCardProps) {
  const isMissing = value === null || value === undefined || value === "";

  return (
    <div
      className={cn(
        "rounded-2xl border bg-zinc-900/70 p-4 transition-colors",
        isMissing
          ? "border-amber-400/20 bg-amber-400/5"
          : "border-white/10",
        className
      )}
    >
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </div>

      <div
        className={cn(
          "text-sm font-medium",
          isMissing ? "flex items-center gap-1.5 text-amber-300" : "text-white"
        )}
      >
        {isMissing ? (
          <>
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Missing / incomplete
          </>
        ) : (
          value
        )}
      </div>

      {/* Confidence bar — only shown when confidence prop is provided */}
      {typeof confidence === "number" && (
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-600">Confidence</span>
            <span className={cn("text-[10px] font-medium", getConfidenceColor(confidence))}>
              {Math.round(confidence * 100)}%
            </span>
          </div>
          <Progress
            value={confidence * 100}
            className={cn("h-1", getProgressColor(confidence))}
          />
        </div>
      )}
    </div>
  );
}
