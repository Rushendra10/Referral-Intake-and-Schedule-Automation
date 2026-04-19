"use client";

import { useEffect, useMemo, useState } from "react";

import { getProcessingRun, startProcessing, subscribeToProcessing } from "@/lib/api/processing";
import type { AgentRun, WorkflowRun, WorkflowEvent } from "@/lib/types/workflows";

type StreamState = {
  run: WorkflowRun | null;
  events: WorkflowEvent[];
  agents: AgentRun[];
  loading: boolean;
  reconnecting: boolean;
  error: string | null;
};

export function useProcessingStream(referralId: string, autoStart: boolean) {
  const [state, setState] = useState<StreamState>({
    run: null,
    events: [],
    agents: [],
    loading: true,
    reconnecting: false,
    error: null,
  });

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let active = true;

    async function bootstrap() {
      try {
        const current = await getProcessingRun(referralId);
        if (!active) return;

        setState({
          run: current.run,
          events: current.events,
          agents: current.agents,
          loading: false,
          reconnecting: false,
          error: null,
        });

        let runSnapshot = current.run;
        if (!runSnapshot && autoStart) {
          const started = await startProcessing(referralId);
          if (!active) return;
          runSnapshot = started.run;
          setState((prev) => ({ ...prev, run: runSnapshot }));
        }

        unsubscribe = subscribeToProcessing(
          referralId,
          (event) => {
            if (!active) return;
            setState((prev) => ({
              ...prev,
              run:
                event.kind === "workflow_completed"
                  ? prev.run
                    ? { ...prev.run, status: "completed", finishedAt: event.timestamp }
                    : prev.run
                  : event.kind === "workflow_failed"
                    ? prev.run
                      ? { ...prev.run, status: "failed", finishedAt: event.timestamp }
                      : prev.run
                    : prev.run,
              events: [...prev.events.filter((existing) => existing.id !== event.id), event],
              agents:
                event.kind === "agent_status_changed"
                  ? prev.agents.some((agent) => agent.name === event.payload.agentName)
                    ? prev.agents.map((agent) =>
                        agent.name === event.payload.agentName
                          ? {
                              ...agent,
                              status: event.payload.status as AgentRun["status"],
                              finishedAt:
                                event.payload.status === "completed" || event.payload.status === "failed"
                                  ? event.timestamp
                                  : agent.finishedAt,
                              startedAt: event.payload.status === "running" ? event.timestamp : agent.startedAt,
                              output: (event.payload.output as Record<string, unknown> | null) ?? agent.output,
                            }
                          : agent,
                      )
                    : [
                        ...prev.agents,
                        {
                          id: crypto.randomUUID(),
                          runId: event.runId,
                          name: String(event.payload.agentName),
                          status: event.payload.status as AgentRun["status"],
                          startedAt: event.payload.status === "running" ? event.timestamp : null,
                          finishedAt:
                            event.payload.status === "completed" || event.payload.status === "failed"
                              ? event.timestamp
                              : null,
                          output: (event.payload.output as Record<string, unknown> | null) ?? null,
                        },
                      ]
                  : prev.agents,
            }));
          },
          async () => {
            if (!active) return;
            setState((prev) => ({ ...prev, reconnecting: true }));
            const snapshot = await getProcessingRun(referralId);
            if (!active) return;
            setState({
              run: snapshot.run,
              events: snapshot.events,
              agents: snapshot.agents,
              loading: false,
              reconnecting: false,
              error: null,
            });
          },
        );
      } catch (error) {
        if (!active) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          reconnecting: false,
          error: error instanceof Error ? error.message : "Unable to load processing run.",
        }));
      }
    }

    void bootstrap();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [autoStart, referralId]);

  return {
    ...state,
    status: useMemo(() => state.run?.status ?? "idle", [state.run]),
  };
}

