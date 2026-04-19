"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell } from "@/components/app/page-shell";
import { AgentBrowserFrame } from "@/components/app/agent-browser-frame";
import { AgentEventRow } from "@/components/ui/agent-event-row";
import { VerdictBanner } from "@/components/ui/verdict-banner";
import { Button } from "@/components/ui/button";
import { getReferralById } from "@/lib/data/referrals";
import type { EligibilityEvent, EligibilityVerdict } from "@/lib/types";
import CoverageZipsClient from "@/app/demo/coverage-zips/client";
import AcceptedInsuranceClient from "@/app/demo/accepted-insurance/client";

/**
 * EligibilityPage — Person 2's main deliverable.
 *
 * Consumes GET /api/eligibility/[id]/stream (Server-Sent Events).
 * That route handler calls the real TinyFish API when credentials are
 * configured, or falls back to the deterministic simulated engine.
 *
 * Layout: 2-column
 *   Left:  AgentBrowserFrame — shows the SunCare demo pages as TinyFish visits them
 *   Right: Live event stream — events appear as they arrive from the SSE
 *
 * After all events fire (DONE signal received):
 *   - VerdictBanner appears with verdict + reason
 *   - CTA buttons route to /result/[id] and /schedule/[id]
 */

interface Props {
  params: Promise<{ id: string }>;
}

export default function EligibilityPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const referral = getReferralById(id);

  // ── Event stream state ───────────────────────────────────────────────────
  const [visibleEvents, setVisibleEvents] = useState<EligibilityEvent[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [verdict, setVerdict] = useState<EligibilityVerdict | null>(null);
  const [reason, setReason] = useState("");

  // ── Browser frame state ──────────────────────────────────────────────────
  const [currentUrl, setCurrentUrl] = useState("/demo/coverage-zips");
  const [currentHighlight, setCurrentHighlight] = useState<string | undefined>();
  const [browserPage, setBrowserPage] = useState<"zip" | "insurance">("zip");
  const [isLoading, setIsLoading] = useState(false);
  const [livePreviewUrl, setLivePreviewUrl] = useState<string | null>(null);

  const streamRef = useRef<HTMLDivElement>(null);

  // ── EventSource: consume /api/eligibility/[id]/stream ─────────────────────
  useEffect(() => {
    const es = new EventSource(`/api/eligibility/${id}/stream`);

    es.onmessage = (e: MessageEvent) => {
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(e.data as string) as Record<string, unknown>;
      } catch {
        return;
      }

      // ── DONE signal — verdict has been determined ──────────────────────
      if (data.type === "DONE") {
        setVerdict(data.verdict as EligibilityVerdict);
        setReason(data.reason as string);
        setTimeout(() => setIsDone(true), 400);
        es.close();
        return;
      }

      // ── Regular EligibilityEvent ───────────────────────────────────────
      const event = data as unknown as EligibilityEvent;
      setVisibleEvents((prev) => [...prev, event]);

      if (event.type === "navigate") {
        if (event.streamingUrl) {
          // Real TinyFish live preview URL — show in address bar
          setLivePreviewUrl(event.streamingUrl);
          setCurrentUrl(event.streamingUrl);
          setIsLoading(false);
        } else if (event.targetUrl) {
          setIsLoading(true);
          setTimeout(() => {
            setIsLoading(false);
            setCurrentUrl(event.targetUrl!);
            setCurrentHighlight(event.highlightParam);
            if (event.targetUrl!.includes("accepted-insurance")) {
              setBrowserPage("insurance");
            } else {
              setBrowserPage("zip");
              setLivePreviewUrl(null); // reset live preview when going back to static
            }
          }, 400);
        }
      }

      if (event.type === "inspect" && event.highlightParam) {
        setCurrentHighlight(event.highlightParam);
      }
    };

    es.onerror = () => {
      // Connection closed by server (normal after DONE) or real error
      es.close();
    };

    return () => es.close();
  }, [id]);

  // ── Auto-scroll event stream ───────────────────────────────────────────
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [visibleEvents]);

  const patientName = referral?.patientName ?? "Patient";

  return (
    <PageShell
      title="Eligibility Check"
      subtitle={`Verifying ZIP coverage and insurance acceptance for ${patientName} via TinyFish browser automation.`}
      backHref={`/processing/${id}`}
      backLabel="Processing"
      currentStep={4}
    >
      {/* Patient header */}
      <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-900/60 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-semibold text-cyan-400">
            {patientName.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-semibold">{patientName}</div>
            <div className="text-xs text-zinc-500">Referral {id}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isDone ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
              </span>
              Agent Running
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
              ✓ Check Complete
            </span>
          )}
        </div>
      </div>

      {/* TinyFish explanation callout */}
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-violet-400/15 bg-violet-950/30 px-5 py-4">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-400/15 text-violet-400 mt-0.5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <circle cx="7" cy="7" r="3" />
            <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-violet-300">How this works</div>
          <p className="mt-1 text-xs leading-relaxed text-violet-200/60">
            <strong className="text-violet-200/80">TinyFish</strong> is a browser-automation API. It opens a real headless browser, navigates to{" "}
            <strong className="text-violet-200/80">SunCare Home Health&apos;s</strong> internal portal pages (shown in the frame on the left),
            reads the ZIP coverage and insurance tables, and returns structured JSON. ReferralIQ uses that result to compute{" "}
            <strong className="text-violet-200/80">eligible / blocked / manual_review</strong>.{" "}
            {livePreviewUrl
              ? "The address bar shows the real TinyFish live session URL."
              : "The frame shows the SunCare pages TinyFish is visiting."}
          </p>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* LEFT: Agent Browser */}
        <div className="flex flex-col gap-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            TinyFish — Agent Browser Live View
          </div>
          <AgentBrowserFrame
            currentUrl={currentUrl}
            isLoading={isLoading}
            className="flex-1"
          >
            {/* Always show our static demo page with highlights — clearer than embedding TinyFish iframe */}
            {browserPage === "zip" ? (
              <CoverageZipsClient highlight={currentHighlight} />
            ) : (
              <AcceptedInsuranceClient highlight={currentHighlight} />
            )}
          </AgentBrowserFrame>
        </div>

        {/* RIGHT: Event stream + verdict */}
        <div className="flex flex-col gap-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            TinyFish Agent — Event Stream
          </div>

          {/* Event log */}
          <div
            ref={streamRef}
            className="flex max-h-[640px] flex-col gap-2 overflow-y-auto rounded-3xl border border-white/10 bg-zinc-950 p-4 scroll-smooth"
          >
            {visibleEvents.length === 0 ? (
              <div className="flex h-20 items-center justify-center text-xs text-zinc-600">
                Waiting for TinyFish agent to start…
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {visibleEvents.map((event, idx) => (
                  <AgentEventRow
                    key={event.id ?? idx}
                    type={event.type}
                    message={event.message}
                    thought={event.thought}
                    index={idx}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Verdict banner + CTAs */}
          <AnimatePresence>
            {isDone && verdict && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <VerdictBanner verdict={verdict} reason={reason} />

                <div className="mt-4 flex gap-3">
                  <Button
                    onClick={() => router.push(`/result/${id}`)}
                    className="flex-1"
                  >
                    View Extracted Result
                  </Button>
                  {(verdict === "eligible" || verdict === "manual_review") && (
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/schedule/${id}`)}
                    >
                      Schedule
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageShell>
  );
}
