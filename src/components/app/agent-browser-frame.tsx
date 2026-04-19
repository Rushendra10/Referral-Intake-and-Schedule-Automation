"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

/**
 * AgentBrowserFrame — a fake "browser chrome" panel.
 *
 * Used on the EligibilityPage to show which page the TinyFish agent
 * is currently "visiting." As the agent progresses, the parent
 * component updates `currentUrl` and `children` to show the new page.
 *
 * The URL bar animates when the URL changes. An optional loading
 * shimmer effect plays during navigation transitions.
 */

interface AgentBrowserFrameProps {
  currentUrl: string;
  isLoading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function AgentBrowserFrame({
  currentUrl,
  isLoading = false,
  children,
  className,
}: AgentBrowserFrameProps) {
  return (
    <div
      className={`overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 ${className ?? ""}`}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-white/5 bg-zinc-900/80 px-4 py-3">
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        </div>

        {/* Nav buttons */}
        <div className="flex items-center gap-1 text-zinc-600">
          <ChevronLeft className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
        </div>

        {/* Address bar */}
        <div className="flex flex-1 items-center gap-2 rounded-md bg-zinc-800/80 px-3 py-1">
          <Globe className="h-3 w-3 shrink-0 text-zinc-500" />
          <AnimatePresence mode="wait">
            <motion.span
              key={currentUrl}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
              className="flex-1 truncate text-xs font-mono text-zinc-400"
            >
              tinyfish.internal{currentUrl}
            </motion.span>
          </AnimatePresence>

          {isLoading && (
            <RefreshCw className="h-3 w-3 shrink-0 animate-spin text-cyan-400" />
          )}
        </div>

        {/* Agent label */}
        <div className="flex items-center gap-1.5 rounded-md bg-cyan-400/10 px-2.5 py-1">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
          </span>
          <span className="text-[10px] font-semibold text-cyan-300">Agent Active</span>
        </div>
      </div>

      {/* Page content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentUrl}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="relative overflow-auto"
          style={{ minHeight: 420 }}
        >
          {isLoading ? (
            <div className="flex h-60 items-center justify-center">
              <div className="space-y-3 w-full px-8">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-3 animate-pulse rounded bg-zinc-800"
                    style={{ width: `${60 + (i % 3) * 15}%` }}
                  />
                ))}
              </div>
            </div>
          ) : (
            children
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
