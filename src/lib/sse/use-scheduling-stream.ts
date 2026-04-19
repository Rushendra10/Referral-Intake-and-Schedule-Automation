"use client";

import { useEffect, useMemo, useState } from "react";
import { getSchedulingRun, startScheduling, subscribeToScheduling } from "@/lib/api/schedule";
import type { AgentRun, SchedulingResult, WorkflowEvent, WorkflowRun } from "@/lib/types/workflows";

type State = {
  run: WorkflowRun | null;
  events: WorkflowEvent[];
  agents: AgentRun[];
  result: SchedulingResult | null;
  loading: boolean;
  error: string | null;
};

export function useSchedulingStream(referralId: string, autoStart: boolean) {
  const [state, setState] = useState<State>({
    run: null, events: [], agents: [], result: null, loading: true, error: null,
  });

  useEffect(() => {
    let active = true;
    let unsub: (() => void) | null = null;

    async function bootstrap() {
      try {
        const current = await getSchedulingRun(referralId);
        if (!active) return;
        setState({ run: current.run, events: current.events, agents: current.agents, result: current.result, loading: false, error: null });

        if (!current.run && autoStart) {
          const started = await startScheduling(referralId);
          if (!active) return;
          setState(p => ({ ...p, run: started.run }));
        }

        unsub = subscribeToScheduling(
          referralId,
          (event) => {
            if (!active) return;
            setState(p => ({
              ...p,
              run: event.kind === "workflow_completed"
                ? p.run ? { ...p.run, status: "completed", finishedAt: event.timestamp } : p.run
                : event.kind === "workflow_failed"
                  ? p.run ? { ...p.run, status: "failed", finishedAt: event.timestamp } : p.run
                  : p.run,
              events: [...p.events.filter(e => e.id !== event.id), event],
              agents: event.kind === "agent_status_changed"
                ? p.agents.some(a => a.name === event.payload.agentName)
                  ? p.agents.map(a => a.name === event.payload.agentName
                    ? { ...a, status: event.payload.status as AgentRun["status"], finishedAt: event.payload.status === "completed" || event.payload.status === "failed" ? event.timestamp : a.finishedAt, startedAt: event.payload.status === "running" ? event.timestamp : a.startedAt }
                    : a)
                  : [...p.agents, { id: crypto.randomUUID(), runId: event.runId, name: String(event.payload.agentName), status: event.payload.status as AgentRun["status"], startedAt: null, finishedAt: null, output: null }]
                : p.agents,
              result: event.kind === "scheduling_decision" && event.payload.result
                ? event.payload.result as SchedulingResult
                : p.result,
            }));
          },
          async () => {
            if (!active) return;
            const snapshot = await getSchedulingRun(referralId);
            if (!active) return;
            setState({ run: snapshot.run, events: snapshot.events, agents: snapshot.agents, result: snapshot.result, loading: false, error: null });
          },
        );
      } catch (err) {
        if (!active) return;
        setState(p => ({ ...p, loading: false, error: err instanceof Error ? err.message : "Failed to load scheduling run." }));
      }
    }

    void bootstrap();
    return () => { active = false; unsub?.(); };
  }, [referralId, autoStart]);

  return { ...state, status: useMemo(() => state.run?.status ?? "idle", [state.run]) };
}
