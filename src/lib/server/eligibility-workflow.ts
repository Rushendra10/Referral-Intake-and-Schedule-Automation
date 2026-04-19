/**
 * TinyFish Eligibility Workflow
 *
 * Strategy:
 * - When TINYFISH_API_KEY is set AND base URL is publicly reachable, TinyFish
 *   browses the demo pages and reasons about coverage/insurance.
 * - When TinyFish fails for any reason (localhost, quota, network), the workflow
 *   falls back to direct store lookups and continues without throwing.
 */

import { publishEligibilityEvent } from "@/lib/server/eligibility-streams";
import {
  appendEligibilityEvent,
  getAcceptedInsurancePlans,
  getCoveredZips,
  getEligibilityStatus,
  getExtractedReferral,
  saveEligibilityResult,
  upsertEligibilityAgentRun,
  upsertEligibilityRun,
} from "@/lib/server/store";
import type {
  AgentRun,
  EligibilityDecision,
  EligibilityResult,
  EligibilityStage,
  WorkflowEvent,
  WorkflowRun,
} from "@/lib/types/workflows";

// ── Pure helpers (exported for TDD) ─────────────────────────────────────────

export function checkZipCoverage(
  patientZip: string | null,
  coveredZips: string[],
): boolean {
  if (!patientZip) return false;
  return coveredZips.some((z) => z.trim() === patientZip.trim());
}

export function checkInsuranceAcceptance(
  insurancePlan: string | null,
  acceptedPlans: string[],
): boolean {
  if (!insurancePlan) return false;
  const normalized = insurancePlan.toLowerCase().trim();
  return acceptedPlans.some((p) => p.toLowerCase().trim() === normalized);
}

export function determineEligibilityDecision({
  zipCovered,
  insuranceAccepted,
}: {
  zipCovered: boolean;
  insuranceAccepted: boolean;
}): EligibilityDecision {
  if (zipCovered && insuranceAccepted) return "eligible";
  if (!zipCovered && !insuranceAccepted) return "manual_review";
  if (!zipCovered) return "blocked_zip";
  return "blocked_insurance";
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

async function pause(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function isLocalhost(url: string) {
  return (
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes("::1")
  );
}

async function emitEvent(
  run: WorkflowRun,
  stage: EligibilityStage,
  kind: WorkflowEvent["kind"],
  message: string,
  payload: Record<string, unknown> = {},
) {
  const event: WorkflowEvent = {
    id: createId("elig-evt"),
    runId: run.id,
    referralId: run.referralId,
    timestamp: new Date().toISOString(),
    kind,
    stage,
    message,
    payload,
  };
  await appendEligibilityEvent(run.referralId, event);
  publishEligibilityEvent(run.referralId, event);
}

async function upsertAgent(
  run: WorkflowRun,
  agentName: string,
  status: AgentRun["status"],
  output: Record<string, unknown> | null = null,
) {
  const existing = await getEligibilityStatus(run.referralId);
  const prev = existing.agents.find((a) => a.name === agentName) ?? {
    id: createId("elig-agent"),
    runId: run.id,
    name: agentName,
    status: "queued" as const,
    startedAt: null,
    finishedAt: null,
    output: null,
  };
  await upsertEligibilityAgentRun(run.referralId, {
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

// ── TinyFish call (never throws — always returns null on failure) ─────────────

interface TinyFishResult {
  output: string;
  usedTinyFish: boolean;
}

async function tryTinyFish(url: string, goal: string): Promise<TinyFishResult | null> {
  const apiKey = process.env.TINYFISH_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  if (isLocalhost(baseUrl)) {
    // TinyFish (cloud) cannot reach localhost — skip silently
    return null;
  }

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
      console.warn(`[TinyFish] ${res.status} — falling back to store`);
      return null;
    }

    const data = (await res.json()) as { output?: string; result?: string };
    const output = data.output ?? data.result ?? JSON.stringify(data);
    return { output, usedTinyFish: true };
  } catch (err) {
    console.warn("[TinyFish] fetch failed, using store fallback:", err);
    return null;
  }
}

// ── Main workflow ─────────────────────────────────────────────────────────────

export async function startEligibilityWorkflow(referralId: string) {
  const existing = await getEligibilityStatus(referralId);
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

  const run: WorkflowRun = {
    id: createId("elig-run"),
    referralId,
    kind: "eligibility",
    status: "running",
    startedAt: new Date().toISOString(),
    finishedAt: null,
  };

  await upsertEligibilityRun(referralId, run);
  await emitEvent(run, "load_patient_record", "workflow_started", "Eligibility workflow started.");

  // Run async — never blocks the HTTP response
  void runGraph(run, extracted).catch(async (error) => {
    const failedRun: WorkflowRun = {
      ...run,
      status: "failed",
      finishedAt: new Date().toISOString(),
    };
    await upsertEligibilityRun(referralId, failedRun);
    await emitEvent(
      failedRun,
      "publish_eligibility_result",
      "workflow_failed",
      error instanceof Error ? error.message : "Eligibility workflow failed.",
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
    `Loading patient record. ZIP: ${extracted.zip ?? "unknown"}, Insurance: ${extracted.insurancePlan ?? "unknown"}.`,
    { zip: extracted.zip, insurancePlan: extracted.insurancePlan },
  );
  await pause(350);
  await upsertAgent(run, "Patient Record Agent", "completed", {
    zip: extracted.zip,
    insurancePlan: extracted.insurancePlan,
  });

  // Stage 2 — ZIP coverage
  await upsertAgent(run, "ZIP Coverage Agent", "running");
  await emitEvent(
    run,
    "check_zip_coverage",
    "zip_check_started",
    `Checking ZIP ${extracted.zip ?? "unknown"} against service area.`,
  );

  let zipCovered = false;
  let zipSource = "store";

  const zipResult = await tryTinyFish(
    `${baseUrl}/demo/coverage-zips`,
    `Look at the "ZIP Code" column in the table. Is the ZIP code "${extracted.zip}" listed? Return JSON: {"covered": true/false, "reasoning": "..."}`,
  );

  if (zipResult) {
    zipSource = "tinyfish";
    const out = zipResult.output.toLowerCase();
    zipCovered =
      out.includes('"covered":true') ||
      out.includes('"covered": true') ||
      (out.includes("is listed") && !out.includes("not listed")) ||
      (out.includes("covered") && !out.includes("not covered") && !out.includes('"covered":false') && !out.includes('"covered": false'));
  } else {
    // Fallback — direct store lookup
    const zips = await getCoveredZips();
    zipCovered = checkZipCoverage(extracted.zip, zips);
  }

  await pause(300);
  await upsertAgent(run, "ZIP Coverage Agent", "completed", { covered: zipCovered, source: zipSource });
  await emitEvent(
    run,
    "check_zip_coverage",
    "zip_check_result",
    zipCovered
      ? `✓ ZIP ${extracted.zip} is within the service area. [${zipSource}]`
      : `✗ ZIP ${extracted.zip} is NOT within the service area. [${zipSource}]`,
    { zip: extracted.zip, covered: zipCovered, source: zipSource },
  );

  // Stage 3 — Insurance acceptance
  await upsertAgent(run, "Insurance Verification Agent", "running");
  await emitEvent(
    run,
    "check_insurance_acceptance",
    "insurance_check_started",
    `Checking insurance plan "${extracted.insurancePlan ?? "unknown"}".`,
  );

  let insuranceAccepted = false;
  let insSource = "store";

  const insResult = await tryTinyFish(
    `${baseUrl}/demo/accepted-insurance`,
    `Look at the "Insurance Plan" column in the table. Is "${extracted.insurancePlan}" listed? Return JSON: {"accepted": true/false, "reasoning": "..."}`,
  );

  if (insResult) {
    insSource = "tinyfish";
    const out = insResult.output.toLowerCase();
    insuranceAccepted =
      out.includes('"accepted":true') ||
      out.includes('"accepted": true') ||
      (out.includes("is listed") && !out.includes("not listed")) ||
      (out.includes("accepted") && !out.includes("not accepted") && !out.includes('"accepted":false') && !out.includes('"accepted": false'));
  } else {
    const plans = await getAcceptedInsurancePlans();
    insuranceAccepted = checkInsuranceAcceptance(extracted.insurancePlan, plans);
  }

  await pause(300);
  await upsertAgent(run, "Insurance Verification Agent", "completed", {
    accepted: insuranceAccepted,
    source: insSource,
  });
  await emitEvent(
    run,
    "check_insurance_acceptance",
    "insurance_check_result",
    insuranceAccepted
      ? `✓ Insurance "${extracted.insurancePlan}" is accepted. [${insSource}]`
      : `✗ Insurance "${extracted.insurancePlan}" is NOT accepted. [${insSource}]`,
    { plan: extracted.insurancePlan, accepted: insuranceAccepted, source: insSource },
  );

  // Stage 4 — Combine findings
  await upsertAgent(run, "Eligibility Decision Agent", "running");
  await emitEvent(
    run,
    "combine_findings",
    "trace",
    "Combining ZIP and insurance findings.",
    { zipCovered, insuranceAccepted },
  );
  await pause(200);

  const decision = determineEligibilityDecision({ zipCovered, insuranceAccepted });
  const reasoning = buildReasoning(decision, extracted.zip, extracted.insurancePlan, zipCovered, insuranceAccepted);

  // Stage 5 — Publish result
  const result: EligibilityResult = {
    referralId,
    runId: run.id,
    decision,
    zipChecked: extracted.zip,
    zipCovered,
    insuranceChecked: extracted.insurancePlan,
    insuranceAccepted,
    reasoning,
    checkedAt: new Date().toISOString(),
  };

  await saveEligibilityResult(referralId, result);
  await upsertAgent(run, "Eligibility Decision Agent", "completed", { decision });

  const completedRun: WorkflowRun = {
    ...run,
    status: "completed",
    finishedAt: new Date().toISOString(),
  };
  await upsertEligibilityRun(referralId, completedRun);

  await emitEvent(
    completedRun,
    "publish_eligibility_result",
    "eligibility_decision",
    `Decision: ${decision}`,
    { decision, reasoning, result },
  );
  await emitEvent(
    completedRun,
    "publish_eligibility_result",
    "workflow_completed",
    "Eligibility workflow completed.",
    { decision },
  );
}

function buildReasoning(
  decision: EligibilityDecision,
  zip: string | null,
  plan: string | null,
  zipCovered: boolean,
  insuranceAccepted: boolean,
): string {
  const parts = [
    zipCovered
      ? `ZIP ${zip ?? "unknown"} is within the service area.`
      : `ZIP ${zip ?? "unknown"} is outside the service area.`,
    insuranceAccepted
      ? `Insurance plan "${plan ?? "unknown"}" is accepted.`
      : `Insurance plan "${plan ?? "unknown"}" is not accepted.`,
  ];
  if (decision === "eligible") parts.push("Patient is eligible for home health services.");
  else if (decision === "blocked_zip") parts.push("Scheduling blocked: patient is outside service area.");
  else if (decision === "blocked_insurance") parts.push("Scheduling blocked: insurance plan not accepted.");
  else parts.push("Both checks failed. Referral requires manual review.");
  return parts.join(" ");
}
