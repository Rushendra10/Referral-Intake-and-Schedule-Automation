import { EventEmitter } from "node:events";

import type { WorkflowEvent } from "@/lib/types/workflows";

declare global {
  // eslint-disable-next-line no-var
  var __processingEmitterMap: Map<string, EventEmitter> | undefined;
}

function getEmitterMap() {
  if (!global.__processingEmitterMap) {
    global.__processingEmitterMap = new Map<string, EventEmitter>();
  }

  return global.__processingEmitterMap;
}

function getEmitter(referralId: string) {
  const map = getEmitterMap();

  if (!map.has(referralId)) {
    map.set(referralId, new EventEmitter());
  }

  return map.get(referralId)!;
}

export function publishProcessingEvent(referralId: string, event: WorkflowEvent) {
  getEmitter(referralId).emit("event", event);
}

export function subscribeToProcessingEvents(
  referralId: string,
  onEvent: (event: WorkflowEvent) => void,
) {
  const emitter = getEmitter(referralId);
  emitter.on("event", onEvent);

  return () => {
    emitter.off("event", onEvent);
  };
}

