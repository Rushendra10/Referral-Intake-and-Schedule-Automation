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
