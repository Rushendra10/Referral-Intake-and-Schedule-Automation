import type { EligibilityEvent, EligibilityResult, EligibilityVerdict } from "@/lib/types";
import { getExtractedReferral } from "@/lib/data/extracted-referrals";

/**
 * TinyFish Eligibility Engine
 * ──────────────────────────
 * In production: TinyFish spins up a real headless browser, navigates to the
 * agency's internal operational pages, reads their content, and emits structured
 * observations as a streaming event log.
 *
 * In this demo: fully deterministic simulation. The same event structure, delays,
 * and decision logic that real TinyFish would produce — but backed by hardcoded
 * fixtures so the demo is reliable and repeatable.
 *
 * "thinking" events simulate the LLM chain-of-thought reasoning that the TinyFish
 * agent would emit while deciding what to do next. In a real system, these would
 * be streamed tokens from the underlying LLM.
 *
 * Owned by Person 2 (see final_plan.txt § "Lane B: TinyFish eligibility intelligence")
 */

// ── Agency operational rules ────────────────────────────────────────────────
// Must match what /demo/coverage-zips and /demo/accepted-insurance render.

export const COVERED_ZIPS = new Set([
  "75201", "75202", "75203", "75204", "75205",
  "75206", "75207", "75208", "75209", "75210",
  "75214", "75215", "75219", "75220", "75225",
  "75230", "75231", "75235", "75240", "75244",
  "76101", "76102", "76103", "76104", "76107",
  "76110", "76116", "76120", "76132", "76137",
]);

export const ACCEPTED_INSURANCE = new Set([
  "Aetna Medicare",
  "Aetna Medicare Advantage Gold",
  "UnitedHealthcare",
  "UnitedHealthcare Medicare Advantage",
  "Medicare Part A",
  "Medicare Part B",
  "Cigna Medicare Advantage",
]);

export const MANUAL_REVIEW_INSURANCE = new Set([
  "UnitedHealthcare Community Plan",
  "UnitedHealthcare Dual Complete",
  "Cigna Connect",
]);

// ── Event script builder ─────────────────────────────────────────────────────
// Returns a timeline of EligibilityEvent objects.
// "thinking" events carry a `thought` string that the UI streams character-by-character.

function buildEvents(
  zip: string | null,
  insurance: string | null,
  verdict: EligibilityVerdict
): EligibilityEvent[] {
  const events: EligibilityEvent[] = [];
  let t = 0;

  function push(
    type: EligibilityEvent["type"],
    message: string,
    extras: Partial<EligibilityEvent> = {}
  ) {
    events.push({ id: `evt-${events.length}`, type, message, delayMs: t, ...extras });
  }

  function think(thought: string, durationMs = 900) {
    push("thinking", "Reasoning…", { thought });
    t += durationMs;
  }

  // ── Step 1: parse structured payload ──────────────────────────────────────
  think(
    `I have a new referral to evaluate. The extraction pipeline gave me:\n` +
    `  ZIP: ${zip ?? "(not found)"}\n` +
    `  Insurance: ${insurance ?? "(not found)"}\n\n` +
    `I need to verify two things against TinyFish's operational rules:\n` +
    `  1. Is this ZIP in our service area?\n` +
    `  2. Is this insurance plan accepted?`
  );
  push("inspect", `Reading extracted referral — ZIP: ${zip ?? "unknown"}, Insurance: ${insurance ?? "unknown"}`);
  t += 500;

  // ── Step 2: reason about ZIP lookup ───────────────────────────────────────
  think(
    `My first action: navigate to the TinyFish coverage map page.\n` +
    `I'll search the ZIP table for ${zip ?? "the patient's ZIP"}.\n` +
    `The page has a filterable table of service-area ZIP codes.`
  );
  push("navigate", "Opening TinyFish coverage map → /demo/coverage-zips", {
    targetUrl: `/demo/coverage-zips${zip ? `?highlight=${zip}` : ""}`,
  });
  t += 800;

  think(`Page loaded. Scanning table rows for ZIP ${zip ?? "unknown"}…`, 700);
  push("inspect", `Scanning ZIP table for ${zip ?? "unknown"}…`, {
    highlightParam: zip ?? undefined,
  });
  t += 1000;

  // ── ZIP verdict branch ────────────────────────────────────────────────────
  if (verdict === "blocked_zip") {
    think(
      `I scanned all ${COVERED_ZIPS.size} ZIP entries in the coverage table.\n` +
      `ZIP ${zip} does not appear in any row. This means the patient's address\n` +
      `is outside TinyFish's current service territory.\n\n` +
      `I can stop here — there is no point checking insurance if we cannot serve the address.`,
      1100
    );
    push("nomatch", `ZIP ${zip} is NOT in TinyFish service area — referral will be blocked`);
    t += 500;
    push("decision", "Decision: blocked_zip — patient address is outside service coverage");
    return events;
  }

  think(
    `Found ZIP ${zip} in the coverage table — marked "In Coverage".\n` +
    `The patient's address is within our service area. ✓\n\n` +
    `Next: I need to verify their insurance plan is accepted.`,
    800
  );
  push("match", `ZIP ${zip} ✓ — confirmed within TinyFish service area`);
  t += 500;

  // ── Step 3: reason about insurance lookup ─────────────────────────────────
  think(
    `Navigating to the accepted insurance page.\n` +
    `I'll search for "${insurance ?? "the patient's plan"}" in the payer table.\n` +
    `The table has three possible statuses: Accepted, Manual Review, Not Accepted.`
  );
  push("navigate", "Opening accepted insurance list → /demo/accepted-insurance", {
    targetUrl: `/demo/accepted-insurance${insurance ? `?highlight=${encodeURIComponent(insurance)}` : ""}`,
  });
  t += 800;

  think(`Page loaded. Searching payer table for "${insurance ?? "unknown"}"…`, 700);
  push("inspect", `Checking plan: "${insurance ?? "unknown"}"…`, {
    highlightParam: insurance ?? undefined,
  });
  t += 1000;

  // ── Insurance verdict branch ──────────────────────────────────────────────
  if (verdict === "blocked_insurance") {
    think(
      `I searched all payer rows for "${insurance}".\n` +
      `The plan is not listed in our accepted payer contracts.\n\n` +
      `This could mean the contract expired or was never negotiated.\n` +
      `I cannot accept this referral without a valid payer agreement.`,
      1100
    );
    push("nomatch", `"${insurance}" is NOT accepted by TinyFish — referral will be blocked`);
    t += 500;
    push("decision", "Decision: blocked_insurance — payer not in accepted plan list");
    return events;
  }

  if (verdict === "manual_review") {
    think(
      `Found "${insurance}" in the payer table.\n` +
      `Status: "Manual Review" — this plan is accepted but requires prior authorization\n` +
      `before TinyFish can confirm placement.\n\n` +
      `A care coordinator must review the prior auth requirements before scheduling.`,
      1100
    );
    push("match", `"${insurance}" found — plan requires manual authorization review`);
    t += 500;
    push("decision", "Decision: manual_review — plan accepted but prior auth needed");
    return events;
  }

  // ── Eligible path ─────────────────────────────────────────────────────────
  think(
    `Found "${insurance}" in the accepted payer table.\n` +
    `Status: "Accepted" — no prior authorization required.\n\n` +
    `Both checks passed:\n` +
    `  ✓ ZIP ${zip} is in coverage area\n` +
    `  ✓ ${insurance} is a fully accepted plan\n\n` +
    `This referral is eligible for TinyFish Home Health placement.`,
    1100
  );
  push("match", `"${insurance}" ✓ — plan fully accepted by TinyFish`);
  t += 500;
  push("decision", "Decision: eligible — ZIP and insurance both verified ✓");
  return events;
}

// ── Main engine function ─────────────────────────────────────────────────────

export function runEligibilityCheck(referralId: string): EligibilityResult {
  const referral = getExtractedReferral(referralId);
  const zip = referral.zip;
  const insurance = referral.insuranceName;

  let verdict: EligibilityVerdict;
  let reason: string;

  if (!zip || !COVERED_ZIPS.has(zip)) {
    verdict = "blocked_zip";
    reason = `ZIP code ${zip ?? "(missing)"} is outside TinyFish's service area.`;
  } else if (!insurance) {
    verdict = "manual_review";
    reason = "Insurance plan could not be identified — manual review required.";
  } else if (MANUAL_REVIEW_INSURANCE.has(insurance)) {
    verdict = "manual_review";
    reason = `${insurance} requires manual authorization before acceptance.`;
  } else if (!ACCEPTED_INSURANCE.has(insurance)) {
    verdict = "blocked_insurance";
    reason = `${insurance} is not in TinyFish's accepted payer list.`;
  } else {
    verdict = "eligible";
    reason = `ZIP ${zip} is in coverage area and ${insurance} is an accepted plan.`;
  }

  return {
    referralId,
    verdict,
    checkedZip: zip,
    checkedInsurance: insurance,
    reason,
    events: buildEvents(zip, insurance, verdict),
  };
}

// ── Per-verdict UI metadata ──────────────────────────────────────────────────

export const VERDICT_META: Record<
  EligibilityVerdict,
  { label: string; description: string; color: "eligible" | "blocked" | "manual" }
> = {
  eligible: {
    label: "Eligible",
    description: "ZIP and insurance verified. Patient can proceed to scheduling.",
    color: "eligible",
  },
  blocked_zip: {
    label: "Blocked — ZIP Not Covered",
    description:
      "Patient's address is outside TinyFish's current service area. Referral cannot proceed.",
    color: "blocked",
  },
  blocked_insurance: {
    label: "Blocked — Insurance Not Accepted",
    description:
      "Patient's insurance plan is not in TinyFish's accepted payer list. Referral cannot proceed.",
    color: "blocked",
  },
  manual_review: {
    label: "Manual Review Required",
    description:
      "Insurance plan requires prior authorization. A coordinator must review before scheduling.",
    color: "manual",
  },
};
