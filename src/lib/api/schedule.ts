import { apiFetch } from "@/lib/api/client";
import type { SchedulingStatusResponse, WorkflowEvent, WorkflowRun } from "@/lib/types/workflows";

export function startScheduling(id: string) {
  return apiFetch<{ run: WorkflowRun }>(`/api/referrals/${id}/schedule`, { method: "POST" });
}

export function getSchedulingRun(id: string) {
  return apiFetch<SchedulingStatusResponse>(`/api/referrals/${id}/schedule`);
}

export function subscribeToScheduling(
  id: string,
  onEvent: (event: WorkflowEvent) => void,
  onError?: () => void,
) {
  const es = new EventSource(`/api/referrals/${id}/schedule/stream`);
  es.onmessage = (msg) => onEvent(JSON.parse(msg.data) as WorkflowEvent);
  es.onerror = () => onError?.();
  return () => es.close();
}
