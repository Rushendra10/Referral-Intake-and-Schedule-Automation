import type { EligibilityEvent, EligibilityResult, EligibilityVerdict } from "@/lib/types";
import { getExtractedReferral } from "@/lib/data/extracted-referrals";

/**
 * TinyFish Eligibility Engine
 * ──────────────────────────
 * Simulates a TinyFish browser-automation agent performing:
 *   1. Open the agency's ZIP coverage page
 *   2. Inspect the ZIP code table
 *   3. Open the agency's accepted insurance page
 *   4. Inspect the insurance table
 *   5. Combine findings and emit a verdict
 *
 * This runs entirely client-side for the demo.
 * In production this would be a TinyFish workflow running in the backend.
 *
 * Owned by Person 2 (see final_plan.txt § "Lane B: TinyFish eligibility intelligence")
 */

// ── Agency operational rules ───────────────────────────────────────────────
// These are the "rules pages" that TinyFish reads.
// /demo/coverage-zips and /demo/accepted-insurance render these same sets.

export const COVERED_ZIPS = new Set([
  "75201", "75202", "75203", "75204", "75205",
  "75206", "75207", "75208", "75209", "75210",
  "75214", "75215", "75219", "75220", "75225",
  "75230", "75231", "75235", "75240", "75244",
  // Fort Worth area
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

// Plans that need manual review (accepted but require prior auth)
export const MANUAL_REVIEW_INSURANCE = new Set([
  "UnitedHealthcare Community Plan",
  "UnitedHealthcare Dual Complete",
  "Cigna Connect",
]);

// ── Event script builder ───────────────────────────────────────────────────

function buildEvents(
  zip: string | null,
  insurance: string | null,
  verdict: EligibilityVerdict
): EligibilityEvent[] {
  const events: EligibilityEvent[] = [];
  let t = 0;

  const push = (
    type: EligibilityEvent["type"],
    message: string,
    extras: Partial<EligibilityEvent> = {}
  ) => {
    events.push({ id: `evt-${events.length}`, type, message, delayMs: t, ...extras });
  };

  // Step 1: read structured referral
  push("inspect", `Reading extracted referral — ZIP: ${zip ?? "unknown"}, Insurance: ${insurance ?? "unknown"}`);
  t += 700;

  // Step 2: navigate to ZIP coverage page
  push("navigate", "Opening TinyFish coverage map → /demo/coverage-zips", {
    targetUrl: `/demo/coverage-zips${zip ? `?highlight=${zip}` : ""}`,
  });
  t += 1000;

  // Step 3: inspect the ZIP table
  push("inspect", `Scanning ZIP table for ${zip ?? "unknown"}…`, {
    highlightParam: zip ?? undefined,
  });
  t += 1200;

  if (verdict === "blocked_zip") {
    push("nomatch", `ZIP ${zip} is NOT in TinyFish service area — referral will be blocked`);
    t += 600;
    push("decision", "Decision: blocked_zip — patient address is outside service coverage");
    return events;
  }

  push("match", `ZIP ${zip} ✓ — confirmed within TinyFish service area`);
  t += 600;

  // Step 4: navigate to insurance page
  push("navigate", "Opening accepted insurance list → /demo/accepted-insurance", {
    targetUrl: `/demo/accepted-insurance${insurance ? `?highlight=${encodeURIComponent(insurance)}` : ""}`,
  });
  t += 1000;

  // Step 5: inspect insurance table
  push("inspect", `Checking plan: "${insurance ?? "unknown"}"…`, {
    highlightParam: insurance ?? undefined,
  });
  t += 1200;

  if (verdict === "blocked_insurance") {
    push("nomatch", `"${insurance}" is NOT accepted by TinyFish — referral will be blocked`);
    t += 600;
    push("decision", "Decision: blocked_insurance — payer not in accepted plan list");
    return events;
  }

  if (verdict === "manual_review") {
    push("match", `"${insurance}" found — plan requires manual authorization review`);
    t += 600;
    push("decision", "Decision: manual_review — plan accepted but prior auth needed");
    return events;
  }

  // eligible
  push("match", `"${insurance}" ✓ — plan fully accepted by TinyFish`);
  t += 600;
  push("decision", "Decision: eligible — ZIP and insurance both verified ✓");
  return events;
}

// ── Main engine function ───────────────────────────────────────────────────

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

// ── Per-verdict UI metadata (used by VerdictBanner) ───────────────────────

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
