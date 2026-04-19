"use client";

import { useSchedulingStream } from "@/lib/sse/use-scheduling-stream";
import type { SchedulingDecision } from "@/lib/types/workflows";

const stages = [
  { key: "load_patient_record", label: "Patient record loaded" },
  { key: "determine_required_capabilities", label: "Capabilities determined" },
  { key: "inspect_nurse_specializations", label: "Nurse specializations checked" },
  { key: "inspect_nurse_schedules", label: "Schedules inspected" },
  { key: "select_nurse_and_slot", label: "Nurse & slot selected" },
  { key: "simulate_patient_outreach", label: "Patient outreach initiated" },
  { key: "publish_scheduling_result", label: "Scheduling finalized" },
];

const decisionConfig: Record<SchedulingDecision, { label: string; color: string; bg: string }> = {
  initialized: { label: "Scheduling Initialized", color: "text-emerald-300", bg: "border-emerald-400/20 bg-emerald-400/10" },
  blocked: { label: "Scheduling Blocked", color: "text-rose-300", bg: "border-rose-400/20 bg-rose-400/10" },
  manual_review: { label: "Manual Review Required", color: "text-amber-300", bg: "border-amber-400/20 bg-amber-400/10" },
};

export function SchedulingClient({ referralId }: { referralId: string }) {
  const { run, events, agents, result, loading, error, status } = useSchedulingStream(referralId, true);

  const currentStageIndex = (() => {
    if (!events.length) return 0;
    const last = events.at(-1)?.stage;
    const i = stages.findIndex(s => s.key === last);
    return i === -1 ? 0 : i + 1;
  })();

  const decision = result?.decision;
  const cfg = decision ? decisionConfig[decision] : null;

  return (
    <div className="space-y-6">
      {/* Workflow progress */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
        <div className="mb-4 text-sm font-medium">Scheduling Workflow Progress</div>
        <div className="grid gap-3 md:grid-cols-4">
          {stages.map((stage, i) => (
            <div key={stage.key} className={`rounded-2xl border p-4 text-xs ${i < currentStageIndex ? "border-violet-400/50 bg-violet-400/10 text-violet-200" : "border-white/10 bg-zinc-900 text-zinc-500"}`}>
              {stage.label}
            </div>
          ))}
        </div>
      </div>

      {/* Agents */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
        <div className="mb-4 text-sm font-medium">TinyFish Scheduling Agents</div>
        <div className="grid gap-4 md:grid-cols-2">
          {agents.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4 text-sm text-zinc-500">
              {loading ? "Starting scheduling agents..." : "Agents will appear once the run starts."}
            </div>
          ) : agents.map(a => (
            <div key={a.id} className="rounded-2xl border border-white/10 bg-zinc-900/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">{a.name}</div>
                <span className={`rounded-full px-3 py-1 text-xs ${a.status === "completed" ? "bg-emerald-400/15 text-emerald-300" : a.status === "running" ? "bg-violet-400/15 text-violet-300" : a.status === "failed" ? "bg-rose-400/15 text-rose-300" : "bg-zinc-800 text-zinc-400"}`}>
                  {a.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Event stream */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
        <div className="mb-4 text-sm font-medium">TinyFish Event Stream</div>
        {error && <div className="mb-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</div>}
        <div className="space-y-2">
          {events.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-500">
              {loading ? "Loading scheduling run..." : "No events yet."}
            </div>
          ) : events.map(ev => (
            <div key={ev.id} className="rounded-xl border border-white/5 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-300">
              <div className="font-medium text-white">{ev.message}</div>
              <div className="mt-1 text-xs uppercase tracking-wide text-zinc-500">{ev.stage}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduling result */}
      {result && cfg && (
        <div className={`rounded-3xl border p-6 ${cfg.bg}`}>
          <div className="mb-2 text-xs uppercase tracking-wide text-zinc-400">Scheduling Decision</div>
          <div className={`text-2xl font-bold ${cfg.color}`}>{cfg.label}</div>
          <p className="mt-3 text-sm text-zinc-300">{result.reasoning}</p>

          {result.decision === "initialized" && (
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
                <div className="text-xs text-zinc-500">Assigned Nurse</div>
                <div className="mt-1 font-semibold text-white">{result.assignedNurse}</div>
                <div className="mt-1 text-xs text-zinc-400">{result.nurseRationale}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
                <div className="text-xs text-zinc-500">Proposed Visit Slot</div>
                <div className="mt-1 font-semibold text-emerald-300">{result.proposedSlot}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
                <div className="text-xs text-zinc-500">Patient Outreach</div>
                <div className={`mt-1 font-semibold ${result.outreachStatus === "initiated" ? "text-emerald-300" : "text-zinc-400"}`}>
                  {result.outreachStatus === "initiated" ? "✓ Initiated" : result.outreachStatus ?? "Pending"}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {run?.status === "failed" && (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-5 text-rose-200">
          Scheduling workflow failed. Check event stream for details.
        </div>
      )}
    </div>
  );
}
