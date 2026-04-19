import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn() — the standard shadcn utility.
 * Merges Tailwind classes safely: clsx handles conditionals,
 * twMerge removes duplicate/conflicting Tailwind classes.
 *
 * Usage: cn("px-4", isActive && "bg-cyan-400", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * formatRelativeTimestamp — used by the portal table.
 * Returns "Just now", "5 min ago", "2 hr ago", or a short date string.
 */
export function formatRelativeTimestamp(ts: string): string {
  const date = new Date(ts);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
