import { apiFetch } from "@/lib/api/client";
import type { ProcessingStatusResponse, WorkflowEvent, WorkflowRun } from "@/lib/types/workflows";

export function startProcessing(id: string) {
  return apiFetch<{ run: WorkflowRun }>(`/api/referrals/${id}/process`, {
    method: "POST",
  });
}

export function getProcessingRun(id: string) {
  return apiFetch<ProcessingStatusResponse>(`/api/referrals/${id}/process`);
}

export function getProcessingResult<T>(id: string) {
  return apiFetch<T>(`/api/referrals/${id}/result`);
}

export function subscribeToProcessing(
  id: string,
  onEvent: (event: WorkflowEvent) => void,
  onError?: () => void,
) {
  const eventSource = new EventSource(`/api/referrals/${id}/process/stream`);
  eventSource.onmessage = (message) => {
    onEvent(JSON.parse(message.data) as WorkflowEvent);
  };
  eventSource.onerror = () => {
    onError?.();
  };

  return () => {
    eventSource.close();
  };
}

