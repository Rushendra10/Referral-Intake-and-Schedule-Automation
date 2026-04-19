"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Globe, Search, CheckCircle, XCircle, BrainCircuit, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import type { EligibilityEventType } from "@/lib/types";

/**
 * AgentEventRow — animated log row for eligibility (and processing) streams.
 *
 * Event types and their visual identities:
 *   thinking    → brain (purple/violet) — streaming chain-of-thought text
 *   navigate    → globe (cyan)
 *   inspect     → search (zinc)
 *   match       → check circle (emerald)
 *   nomatch     → x circle (rose)
 *   decision    → zap (amber)
 */

const typeConfig: Record<
  EligibilityEventType,
  { icon: React.ReactNode; className: string; bg: string }
> = {
  thinking: {
    icon: <BrainCircuit className="h-3.5 w-3.5" />,
    className: "text-violet-400",
    bg: "bg-violet-400/10",
  },
  navigate: {
    icon: <Globe className="h-3.5 w-3.5" />,
    className: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
  inspect: {
    icon: <Search className="h-3.5 w-3.5" />,
    className: "text-zinc-400",
    bg: "bg-zinc-700/50",
  },
  match: {
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    className: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  nomatch: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    className: "text-rose-400",
    bg: "bg-rose-400/10",
  },
  decision: {
    icon: <Zap className="h-3.5 w-3.5" />,
    className: "text-amber-400",
    bg: "bg-amber-400/10",
  },
};

// ── ThinkingRow ────────────────────────────────────────────────────────────
// Renders a chain-of-thought block with streaming character-by-character text.
// The thought text builds up over ~2s before the next real event fires.

interface ThinkingRowProps {
  thought: string;
  index: number;
  className?: string;
}

export function ThinkingRow({ thought, index, className }: ThinkingRowProps) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Stream characters at ~20ms/char with slight variance
    const chars = thought.split("");
    let i = 0;
    const interval = setInterval(() => {
      if (i >= chars.length) {
        clearInterval(interval);
        setDone(true);
        return;
      }
      // Stream 2-3 chars at a time for speed
      const chunk = chars.slice(i, i + 3).join("");
      setDisplayed((prev) => prev + chunk);
      i += 3;
    }, 18);
    return () => clearInterval(interval);
  }, [thought]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-xl border border-violet-400/15 bg-violet-950/30 px-4 py-3",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-violet-400/15 text-violet-400">
          <BrainCircuit className="h-3.5 w-3.5" />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-400">
          Agent Reasoning
        </span>
        {!done && (
          <span className="ml-auto flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="inline-block h-1 w-1 rounded-full bg-violet-400"
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </span>
        )}
      </div>

      {/* Streamed thought text */}
      <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-violet-200/70">
        {displayed}
        {!done && (
          <motion.span
            className="inline-block w-[6px] h-[11px] bg-violet-400 ml-0.5 align-middle"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
        )}
      </pre>
    </motion.div>
  );
}

// ── AgentEventRow ──────────────────────────────────────────────────────────

interface AgentEventRowProps {
  type: EligibilityEventType;
  message: string;
  thought?: string;
  index: number;
  className?: string;
}

export function AgentEventRow({ type, message, thought, index, className }: AgentEventRowProps) {
  // Thinking events get the special streaming treatment
  if (type === "thinking" && thought) {
    return <ThinkingRow thought={thought} index={index} className={className} />;
  }

  const config = typeConfig[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex items-start gap-3 rounded-xl border border-white/5 bg-zinc-900/60 px-4 py-3",
        className
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md",
          config.bg,
          config.className
        )}
      >
        {config.icon}
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-200 leading-relaxed">{message}</p>
      </div>

      {/* Step index */}
      <div className="shrink-0 text-[10px] text-zinc-600 font-mono mt-1">
        {String(index + 1).padStart(2, "0")}
      </div>
    </motion.div>
  );
}

// ── SimpleEventRow ─────────────────────────────────────────────────────────
// Text-only variant used on the processing page

export function SimpleEventRow({
  message,
  index,
  className,
}: {
  message: string;
  index: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "rounded-xl border border-white/5 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-300",
        className
      )}
    >
      <span className="mr-2 font-mono text-[10px] text-zinc-600">
        {String(index + 1).padStart(2, "0")}
      </span>
      {message}
    </motion.div>
  );
}
