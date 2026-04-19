import { apiFetch } from "@/lib/api/client";
import type { EligibilityStatusResponse, WorkflowEvent, WorkflowRun } from "@/lib/types/workflows";

export function startEligibilityCheck(id: string) {
  return apiFetch<{ run: WorkflowRun }>(`/api/referrals/${id}/check-eligibility`, { method: "POST" });
}

export function getEligibilityRun(id: string) {
  return apiFetch<EligibilityStatusResponse>(`/api/referrals/${id}/eligibility`);
}

export function subscribeToEligibility(
  id: string,
  onEvent: (event: WorkflowEvent) => void,
  onError?: () => void,
) {
  const es = new EventSource(`/api/referrals/${id}/eligibility/stream`);
  es.onmessage = (msg) => onEvent(JSON.parse(msg.data) as WorkflowEvent);
  es.onerror = () => onError?.();
  return () => es.close();
}
