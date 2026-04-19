"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell } from "@/components/app/page-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { SimpleEventRow } from "@/components/ui/agent-event-row";

/**
 * ProcessingPage — simulates the LangGraph PDF extraction pipeline.
 *
 * Key change from the old Vite version:
 *   At completion, routes to /eligibility/[id] (not /result/[id]).
 *   This inserts the TinyFish eligibility step into the demo flow.
 */

const STEPS = [
  "Referral packet received",
  "Eligibility checks in progress",
  "Extraction agents running",
  "Cross-validation complete",
  "Referral ready for placement",
];

const INITIAL_AGENTS = [
  { name: "Insurance Eligibility Agent", status: "running" },
  { name: "ZIP Serviceability Agent", status: "running" },
  { name: "Demographics Extraction Agent", status: "queued" },
  { name: "Clinical Services Agent", status: "queued" },
  { name: "Physician Extraction Agent", status: "queued" },
  { name: "Contact Validation Agent", status: "queued" },
  { name: "Cross-Field Validator", status: "queued" },
] as const;

type Agent = { name: string; status: "running" | "complete" | "queued" };

interface Props {
  params: Promise<{ id: string }>;
}

export default function ProcessingPage({ params }: Props) {
  const [id, setId] = useState<string>("");
  const router = useRouter();
  const [progress, setProgress] = useState(1);
  const [agents, setAgents] = useState<Agent[]>(
    INITIAL_AGENTS.map((a) => ({ ...a }))
  );
  const [logs, setLogs] = useState<string[]>([
    "Referral packet loaded.",
    "Spawning Insurance Eligibility Agent.",
    "Spawning ZIP Serviceability Agent.",
  ]);

  // Resolve params
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  // Run the scripted agent timeline
  useEffect(() => {
    if (!id) return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(
      setTimeout(() => {
        setLogs((p) => [...p, "Insurance eligibility pre-check passed."]);
        setAgents((p) =>
          p.map((a) =>
            a.name === "Insurance Eligibility Agent"
              ? { ...a, status: "complete" }
              : a
          )
        );
      }, 1500)
    );

    timers.push(
      setTimeout(() => {
        setLogs((p) => [...p, "ZIP is within service area — proceeding to extraction."]);
        setAgents((p) =>
          p.map((a) =>
            a.name === "ZIP Serviceability Agent"
              ? { ...a, status: "complete" }
              : ["Demographics Extraction Agent", "Clinical Services Agent", "Contact Validation Agent"].includes(a.name)
              ? { ...a, status: "running" }
              : a
          )
        );
        setProgress(2);
      }, 2800)
    );

    timers.push(
      setTimeout(() => {
        setLogs((p) => [
          ...p,
          "Patient demographics extracted.",
          "Ordered services identified from discharge summary.",
          "Physician candidate found on page 2.",
        ]);
        setAgents((p) =>
          p.map((a) =>
            ["Demographics Extraction Agent", "Clinical Services Agent"].includes(a.name)
              ? { ...a, status: "complete" }
              : a.name === "Physician Extraction Agent"
              ? { ...a, status: "running" }
              : a
          )
        );
        setProgress(3);
      }, 4400)
    );

    timers.push(
      setTimeout(() => {
        setLogs((p) => [
          ...p,
          "Physician name normalized and verified.",
          "Contact info validated.",
          "Cross-field consistency check passed.",
          "Extraction package complete.",
        ]);
        setAgents((p) => p.map((a) => ({ ...a, status: "complete" })));
        setProgress(4);
      }, 6200)
    );

    timers.push(
      setTimeout(() => {
        setProgress(5);
      }, 7500)
    );

    // Navigate to ELIGIBILITY (not result) — this is the key flow change
    timers.push(
      setTimeout(() => {
        router.push(`/eligibility/${id}`);
      }, 8800)
    );

    return () => timers.forEach(clearTimeout);
  }, [id, router]);

  return (
    <PageShell
      title="Agentic Processing"
      subtitle="LangGraph agents are OCR-ing and extracting the referral packet. Eligibility check starts automatically after."
      backHref={id ? `/referral/${id}` : "/portal"}
      backLabel="Referral Review"
      currentStep={3}
    >
      <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        {/* LEFT: PDF thumbnail */}
        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
          <div className="mb-3 text-sm font-semibold text-zinc-300">Packet Thumbnail</div>
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-zinc-900 text-zinc-600">
            <div className="space-y-2 px-6 w-full">
              {progress >= 1 && (
                <div className="h-2 w-3/4 animate-pulse rounded bg-zinc-700" />
              )}
              {progress >= 2 && (
                <>
                  <div className="h-2 w-full rounded bg-zinc-700" />
                  <div className="h-2 w-2/3 rounded bg-zinc-700" />
                </>
              )}
              {progress >= 3 && (
                <>
                  <div className="h-2 w-full rounded bg-zinc-700" />
                  <div className="h-2 w-5/6 rounded bg-zinc-700" />
                  <div className="h-2 w-3/4 rounded bg-zinc-700" />
                </>
              )}
              {progress >= 4 && (
                <>
                  <div className="mt-3 h-2 w-full rounded bg-zinc-700" />
                  <div className="h-2 w-2/3 rounded bg-zinc-700" />
                </>
              )}
            </div>
            <div className="text-xs text-zinc-600">
              {progress < 5 ? "Scanning…" : "Scan complete"}
            </div>
          </div>
        </div>

        {/* RIGHT: Progress + agents + logs */}
        <div className="flex flex-col gap-5">
          {/* Workflow steps */}
          <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
            <div className="mb-4 text-sm font-semibold text-zinc-300">Workflow Progress</div>
            <div className="grid gap-2 md:grid-cols-5">
              {STEPS.map((step, idx) => (
                <div
                  key={step}
                  className={`rounded-2xl border p-3 text-xs font-medium text-center transition-colors ${
                    idx < progress
                      ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                      : "border-white/10 bg-zinc-900 text-zinc-600"
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
          </div>

          {/* Active agents */}
          <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
            <div className="mb-4 text-sm font-semibold text-zinc-300">Active Agents</div>
            <div className="grid gap-3 md:grid-cols-2">
              {agents.map((agent) => (
                <motion.div
                  key={agent.name}
                  layout
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-zinc-900/70 px-4 py-3"
                >
                  <div className="text-sm font-medium">{agent.name}</div>
                  <StatusBadge variant={agent.status} pulse={agent.status === "running"} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Event log */}
          <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
            <div className="mb-4 text-sm font-semibold text-zinc-300">Agent Event Stream</div>
            <div className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {logs.map((log, idx) => (
                  <SimpleEventRow key={idx} message={log} index={idx} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
