"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useEligibilityStream } from "@/lib/sse/use-eligibility-stream";
import type { EligibilityDecision } from "@/lib/types/workflows";

const stages = [
  { key: "load_patient_record", label: "Patient record loaded" },
  { key: "check_zip_coverage", label: "ZIP coverage checked" },
  { key: "check_insurance_acceptance", label: "Insurance verified" },
  { key: "combine_findings", label: "Findings combined" },
  { key: "publish_eligibility_result", label: "Eligibility decided" },
];

const decisionConfig: Record<EligibilityDecision, { label: string; color: string; bg: string }> = {
  eligible: { label: "Eligible", color: "text-emerald-300", bg: "border-emerald-400/20 bg-emerald-400/10" },
  blocked_zip: { label: "Blocked — ZIP not covered", color: "text-rose-300", bg: "border-rose-400/20 bg-rose-400/10" },
  blocked_insurance: { label: "Blocked — Insurance not accepted", color: "text-rose-300", bg: "border-rose-400/20 bg-rose-400/10" },
  manual_review: { label: "Manual Review Required", color: "text-amber-300", bg: "border-amber-400/20 bg-amber-400/10" },
};

export function EligibilityClient({ referralId }: { referralId: string }) {
  const router = useRouter();
  const { run, events, agents, result, loading, error, status } = useEligibilityStream(referralId, true);
  const [redirectReady, setRedirectReady] = useState(false);

  useEffect(() => {
    if (status === "completed" && result?.decision === "eligible") {
      const t = setTimeout(() => {
        setRedirectReady(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.replace(`/schedule/${referralId}` as any);
      }, 2200);
      return () => clearTimeout(t);
    }
  }, [referralId, router, status, result]);

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
        <div className="mb-4 text-sm font-medium">Eligibility Workflow Progress</div>
        <div className="grid gap-3 md:grid-cols-3">
          {stages.map((stage, i) => (
            <div key={stage.key} className={`rounded-2xl border p-4 text-xs ${i < currentStageIndex ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-200" : "border-white/10 bg-zinc-900 text-zinc-500"}`}>
              {stage.label}
            </div>
          ))}
        </div>
      </div>

      {/* Agents */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
        <div className="mb-4 text-sm font-medium">TinyFish Agents</div>
        <div className="grid gap-4 md:grid-cols-2">
          {agents.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4 text-sm text-zinc-500">
              {loading ? "Starting eligibility agents..." : "Agents will appear once the run starts."}
            </div>
          ) : agents.map(a => (
            <div key={a.id} className="rounded-2xl border border-white/10 bg-zinc-900/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">{a.name}</div>
                <span className={`rounded-full px-3 py-1 text-xs ${a.status === "completed" ? "bg-emerald-400/15 text-emerald-300" : a.status === "running" ? "bg-cyan-400/15 text-cyan-300" : a.status === "failed" ? "bg-rose-400/15 text-rose-300" : "bg-zinc-800 text-zinc-400"}`}>
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
              {loading ? "Loading eligibility run..." : "No events yet."}
            </div>
          ) : events.map(ev => (
            <div key={ev.id} className="rounded-xl border border-white/5 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-300">
              <div className="font-medium text-white">{ev.message}</div>
              <div className="mt-1 text-xs uppercase tracking-wide text-zinc-500">{ev.stage}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Decision result */}
      {result && cfg && (
        <div className={`rounded-3xl border p-6 ${cfg.bg}`}>
          <div className="mb-2 text-xs uppercase tracking-wide text-zinc-400">Eligibility Decision</div>
          <div className={`text-2xl font-bold ${cfg.color}`}>{cfg.label}</div>
          <p className="mt-3 text-sm text-zinc-300">{result.reasoning}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-3">
              <div className="text-xs text-zinc-500">ZIP Checked</div>
              <div className="mt-1 text-sm font-medium">{result.zipChecked ?? "—"}</div>
              <div className={`mt-1 text-xs ${result.zipCovered ? "text-emerald-400" : "text-rose-400"}`}>{result.zipCovered ? "✓ Covered" : "✗ Not covered"}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-3">
              <div className="text-xs text-zinc-500">Insurance Checked</div>
              <div className="mt-1 text-sm font-medium">{result.insuranceChecked ?? "—"}</div>
              <div className={`mt-1 text-xs ${result.insuranceAccepted ? "text-emerald-400" : "text-rose-400"}`}>{result.insuranceAccepted ? "✓ Accepted" : "✗ Not accepted"}</div>
            </div>
          </div>
          {result.decision === "eligible" && !redirectReady && (
            <div className="mt-4 text-xs text-emerald-300">Redirecting to scheduling...</div>
          )}
        </div>
      )}

      {run?.status === "failed" && (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-5 text-rose-200">
          Eligibility workflow failed. Check the event stream for details.
        </div>
      )}
    </div>
  );
}
