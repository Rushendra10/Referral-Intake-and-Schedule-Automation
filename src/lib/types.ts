/**
 * Shared TypeScript contracts for the referral demo.
 * These are the interfaces Person 1, 2, and 3 all agree on.
 * Person 2 owns: EligibilityResult, EligibilityEvent
 */

// ── Referral list / portal ─────────────────────────────────────────────────

export type ReferralStatus =
  | "Pending Review"
  | "Awaiting Verification"
  | "Ready for Placement"
  | "New Referral";

export interface ReferralSummary {
  id: string;
  patientName: string;
  hospitalName: string;
  mrn: string;
  status: ReferralStatus;
  receivedAt: string;
  pdfName: string;
}

// ── Referral detail (what the review page shows before extraction) ──────────

export interface ReferralDetail extends ReferralSummary {
  pdfUrl: string;
  knownFields: {
    dob: string | null;
    insurance: string | null;
    address: string | null;
    phone: string | null;
    services: string[];
    pcp: string | null;
  };
  packetText: string;
}

// ── Extracted referral — Person 1's output, Person 2 consumes ─────────────

export interface ExtractedReferral {
  referralId: string;
  patientName: string | null;
  mrn: string | null;
  dob: string | null;
  phone: string | null;
  address: string | null;
  zip: string | null;
  hospitalName: string | null;
  insuranceName: string | null;
  insurancePlan: string | null;
  orderedServices: string[];
  pcp: string | null;
  orderingPhysician: string | null;
  warnings: string[];
  fieldConfidence: Record<string, number>; // 0–1 per field
  completeness: number;                    // 0–1 overall
}

// ── Eligibility — owned entirely by Person 2 ──────────────────────────────

export type EligibilityVerdict =
  | "eligible"
  | "blocked_zip"
  | "blocked_insurance"
  | "manual_review";

export type EligibilityEventType =
  | "navigate"
  | "inspect"
  | "match"
  | "nomatch"
  | "decision"
  | "thinking";  // chain-of-thought reasoning step

export interface EligibilityEvent {
  id: string;
  type: EligibilityEventType;
  message: string;
  delayMs: number;          // when this event fires relative to start (0 for real API events)
  targetUrl?: string;       // for "navigate" events — which demo page path
  highlightParam?: string;  // for "inspect" events — what to highlight
  thought?: string;         // for "thinking" events — streaming chain-of-thought text
  streamingUrl?: string;    // real TinyFish live browser preview URL (STREAMING_URL event)
}

export interface EligibilityResult {
  referralId: string;
  verdict: EligibilityVerdict;
  checkedZip: string | null;
  checkedInsurance: string | null;
  reason: string;
  events: EligibilityEvent[];
}

// ── Workflow run (shared runtime — Person 3 persists, Person 2 reads) ──────

export type WorkflowRunStatus = "pending" | "running" | "complete" | "failed";

export interface WorkflowRun {
  id: string;
  referralId: string;
  type: "processing" | "eligibility" | "scheduling";
  status: WorkflowRunStatus;
  startedAt: string;
  completedAt?: string;
}

export interface WorkflowEvent {
  id: string;
  runId: string;
  type: string;
  message: string;
  timestamp: string;
}
