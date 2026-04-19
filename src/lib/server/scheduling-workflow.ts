/**
 * TinyFish Scheduling Workflow
 *
 * Same resilience strategy as eligibility:
 * - TinyFish is used when API key is set AND base URL is public
 * - Falls back to direct store lookup on any failure (including localhost)
 */

import { publishSchedulingEvent } from "@/lib/server/scheduling-streams";
import {
  appendSchedulingEvent,
  getEligibilityStatus,
  getExtractedReferral,
  getNurses,
  getSchedulingStatus,
  saveSchedulingResult,
  upsertSchedulingAgentRun,
  upsertSchedulingRun,
} from "@/lib/server/store";
import type {
  AgentRun,
  NurseRecord,
  SchedulingDecision,
  SchedulingResult,
  SchedulingStage,
  WorkflowEvent,
  WorkflowRun,
} from "@/lib/types/workflows";

// ── Pure helpers (exported for TDD) ─────────────────────────────────────────

export function selectBestNurse(
  requiredServices: string[],
  nurses: NurseRecord[],
): NurseRecord | null {
  if (!nurses.length || !requiredServices.length) return null;
  const available = nurses.filter((n) => n.availableSlots.length > 0);
  if (!available.length) return null;

  const scored = available.map((nurse) => ({
    nurse,
    score: requiredServices.filter((svc) =>
      nurse.specializations.some((s) => s.toLowerCase() === svc.toLowerCase()),
    ).length,
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.nurse ?? null;
}

export function determineSchedulingDecision({
  assignedNurse,
  proposedSlot,
}: {
  assignedNurse: string | null;
  proposedSlot: string | null;
}): SchedulingDecision {
  return assignedNurse && proposedSlot ? "initialized" : "blocked";
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

async function pause(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function isLocalhost(url: string) {
  return url.includes("localhost") || url.includes("127.0.0.1");
}

async function emitEvent(
  run: WorkflowRun,
  stage: SchedulingStage,
  kind: WorkflowEvent["kind"],
  message: string,
  payload: Record<string, unknown> = {},
) {
  const event: WorkflowEvent = {
    id: createId("sched-evt"),
    runId: run.id,
    referralId: run.referralId,
    timestamp: new Date().toISOString(),
    kind,
    stage,
    message,
    payload,
  };
  await appendSchedulingEvent(run.referralId, event);
  publishSchedulingEvent(run.referralId, event);
}

async function upsertAgent(
  run: WorkflowRun,
  agentName: string,
  status: AgentRun["status"],
  output: Record<string, unknown> | null = null,
) {
  const existing = await getSchedulingStatus(run.referralId);
  const prev = existing.agents.find((a) => a.name === agentName) ?? {
    id: createId("sched-agent"),
    runId: run.id,
    name: agentName,
    status: "queued" as const,
    startedAt: null,
    finishedAt: null,
    output: null,
  };
  await upsertSchedulingAgentRun(run.referralId, {
    ...prev,
    status,
    startedAt: status === "running" ? new Date().toISOString() : prev.startedAt,
    finishedAt:
      status === "completed" || status === "failed"
        ? new Date().toISOString()
        : null,
    output,
  });
}

// ── TinyFish call (never throws) ──────────────────────────────────────────────

async function tryTinyFish(url: string, goal: string): Promise<string | null> {
  const apiKey = process.env.TINYFISH_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  if (isLocalhost(baseUrl)) return null;

  try {
    const res = await fetch("https://agent.tinyfish.ai/v1/automation/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ url, goal }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      console.warn(`[TinyFish scheduling] ${res.status} — using store fallback`);
      return null;
    }

    const data = (await res.json()) as { output?: string; result?: string };
    return data.output ?? data.result ?? null;
  } catch (err) {
    console.warn("[TinyFish scheduling] failed, using store fallback:", err);
    return null;
  }
}

// ── Main workflow ─────────────────────────────────────────────────────────────

export async function startSchedulingWorkflow(referralId: string) {
  const existing = await getSchedulingStatus(referralId);
  if (
    existing.run?.status === "running" ||
    existing.run?.status === "completed"
  ) {
    return existing.run;
  }

  const extracted = await getExtractedReferral(referralId);
  if (!extracted) {
    throw new Error("No extracted referral found. Run document processing first.");
  }

  const eligibility = await getEligibilityStatus(referralId);
  if (eligibility.result && eligibility.result.decision !== "eligible") {
    throw new Error(
      `Patient is not eligible (${eligibility.result.decision}). Cannot schedule.`,
    );
  }

  const run: WorkflowRun = {
    id: createId("sched-run"),
    referralId,
    kind: "scheduling",
    status: "running",
    startedAt: new Date().toISOString(),
    finishedAt: null,
  };

  await upsertSchedulingRun(referralId, run);
  await emitEvent(run, "load_patient_record", "workflow_started", "Scheduling workflow started.");

  void runGraph(run, extracted).catch(async (error) => {
    const failedRun: WorkflowRun = {
      ...run,
      status: "failed",
      finishedAt: new Date().toISOString(),
    };
    await upsertSchedulingRun(referralId, failedRun);
    await emitEvent(
      failedRun,
      "publish_scheduling_result",
      "workflow_failed",
      error instanceof Error ? error.message : "Scheduling workflow failed.",
      { error: String(error) },
    );
  });

  return run;
}

async function runGraph(
  run: WorkflowRun,
  extracted: NonNullable<Awaited<ReturnType<typeof getExtractedReferral>>>,
) {
  const referralId = run.referralId;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  // Stage 1 — Load patient record
  await upsertAgent(run, "Patient Record Agent", "running");
  await emitEvent(
    run,
    "load_patient_record",
    "trace",
    `Ordered services: ${extracted.orderedServices.join(", ")}.`,
    { orderedServices: extracted.orderedServices },
  );
  await pause(300);
  await upsertAgent(run, "Patient Record Agent", "completed", {
    orderedServices: extracted.orderedServices,
  });

  // Stage 2 — Determine capabilities
  await upsertAgent(run, "Capability Analyst Agent", "running");
  await emitEvent(
    run,
    "determine_required_capabilities",
    "trace",
    `Required capabilities: ${extracted.orderedServices.join(", ")}.`,
  );
  await pause(250);
  await upsertAgent(run, "Capability Analyst Agent", "completed", {
    required: extracted.orderedServices,
  });

  // Stage 3 — Nurse specializations
  await upsertAgent(run, "Nurse Lookup Agent", "running");
  await emitEvent(
    run,
    "inspect_nurse_specializations",
    "nurse_lookup_started",
    "Looking up nurse specializations.",
  );

  let nurses: NurseRecord[] = await getNurses();
  let specSource = "store";

  const specOut = await tryTinyFish(
    `${baseUrl}/demo/nurse-specializations`,
    `Look at the nurse specializations table. For services [${extracted.orderedServices.join(", ")}], which nurses cover at least one? Return JSON array: [{"id":"...","name":"...","specializations":["..."]}]`,
  );

  if (specOut) {
    try {
      const match = specOut.match(/\[[\s\S]*?\]/);
      if (match) {
        const parsed = JSON.parse(match[0]) as Array<{
          id: string; name: string; specializations: string[];
        }>;
        if (parsed.length > 0) {
          // Merge with store data to get availableSlots
          nurses = parsed.map((p) => {
            const storeNurse = nurses.find((n) => n.id === p.id || n.name === p.name);
            return {
              id: p.id ?? storeNurse?.id ?? createId("nurse"),
              name: p.name,
              specializations: p.specializations ?? storeNurse?.specializations ?? [],
              availableSlots: storeNurse?.availableSlots ?? [],
            };
          });
          specSource = "tinyfish";
        }
      }
    } catch {
      // keep store nurses
    }
  }

  await pause(300);
  await upsertAgent(run, "Nurse Lookup Agent", "completed", {
    count: nurses.length,
    source: specSource,
  });
  await emitEvent(
    run,
    "inspect_nurse_specializations",
    "trace",
    `Found ${nurses.length} nurses. [${specSource}]`,
    { count: nurses.length, source: specSource },
  );

  // Stage 4 — Nurse schedules
  await upsertAgent(run, "Schedule Inspector Agent", "running");
  await emitEvent(
    run,
    "inspect_nurse_schedules",
    "trace",
    "Inspecting nurse availability.",
  );

  const schedOut = await tryTinyFish(
    `${baseUrl}/demo/nurse-schedules`,
    `Look at the nurse schedules table. Extract available slots for these nurses: [${nurses.map((n) => n.name).join(", ")}]. Return JSON array: [{"id":"...","name":"...","availableSlots":["..."]}]`,
  );

  if (schedOut) {
    try {
      const match = schedOut.match(/\[[\s\S]*?\]/);
      if (match) {
        const parsed = JSON.parse(match[0]) as Array<{
          id: string; name: string; availableSlots: string[];
        }>;
        nurses = nurses.map((n) => {
          const found = parsed.find((p) => p.name === n.name || p.id === n.id);
          return { ...n, availableSlots: found?.availableSlots ?? n.availableSlots };
        });
      }
    } catch {
      // keep existing slots
    }
  }

  await pause(300);
  await upsertAgent(run, "Schedule Inspector Agent", "completed", {
    withSlots: nurses.filter((n) => n.availableSlots.length > 0).length,
  });

  // Stage 5 — Select best nurse
  await upsertAgent(run, "Nurse Matching Agent", "running");
  const best = selectBestNurse(extracted.orderedServices, nurses);
  const slot = best?.availableSlots[0] ?? null;
  await pause(300);
  await upsertAgent(run, "Nurse Matching Agent", "completed", {
    nurse: best?.name ?? null,
    slot,
  });

  const nurseRationale = best
    ? `${best.name} covers: ${best.specializations.join(", ")}. Required: ${extracted.orderedServices.join(", ")}.`
    : `No nurse available for services: ${extracted.orderedServices.join(", ")}.`;

  await emitEvent(
    run,
    "select_nurse_and_slot",
    best ? "nurse_selected" : "trace",
    best ? `${best.name} selected — slot ${slot}.` : "No matching nurse found.",
    { nurse: best?.name ?? null, slot, rationale: nurseRationale },
  );

  // Stage 6 — Outreach
  await upsertAgent(run, "Outreach Agent", "running");
  await emitEvent(
    run,
    "simulate_patient_outreach",
    "outreach_initiated",
    best
      ? `Outreach initiated for ${extracted.patientName ?? "patient"} at ${slot}.`
      : "No nurse available — outreach skipped.",
    { patient: extracted.patientName, slot },
  );
  await pause(400);
  await upsertAgent(run, "Outreach Agent", "completed", {
    status: best ? "initiated" : "pending",
  });

  // Stage 7 — Publish result
  const decision = determineSchedulingDecision({
    assignedNurse: best?.name ?? null,
    proposedSlot: slot,
  });
  const reasoning = best
    ? `${nurseRationale} Slot ${slot} confirmed. Scheduling initialized.`
    : `No nurse available. ${nurseRationale} Scheduling blocked.`;

  const result: SchedulingResult = {
    referralId,
    runId: run.id,
    decision,
    assignedNurse: best?.name ?? null,
    nurseRationale: best ? nurseRationale : null,
    proposedSlot: slot,
    outreachStatus: best ? "initiated" : null,
    reasoning,
    scheduledAt: new Date().toISOString(),
  };

  await saveSchedulingResult(referralId, result);

  const completedRun: WorkflowRun = {
    ...run,
    status: "completed",
    finishedAt: new Date().toISOString(),
  };
  await upsertSchedulingRun(referralId, completedRun);

  await emitEvent(
    completedRun,
    "publish_scheduling_result",
    "scheduling_decision",
    `Decision: ${decision}`,
    { decision, reasoning, result },
  );
  await emitEvent(
    completedRun,
    "publish_scheduling_result",
    "workflow_completed",
    "Scheduling workflow completed.",
    { decision },
  );
}
