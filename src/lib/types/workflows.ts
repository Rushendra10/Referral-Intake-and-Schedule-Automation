export type WorkflowKind = "processing" | "eligibility" | "scheduling";
export type WorkflowStatus = "idle" | "running" | "completed" | "failed";

export type ProcessingStage =
  | "load_document"
  | "ocr_document"
  | "extract_candidate_fields"
  | "normalize_fields"
  | "validate_mrn"
  | "validate_demographics"
  | "validate_contact_info"
  | "validate_services_and_physician"
  | "reconcile_conflicts"
  | "publish_extracted_referral";

export type EligibilityStage =
  | "load_patient_record"
  | "check_zip_coverage"
  | "check_insurance_acceptance"
  | "combine_findings"
  | "publish_eligibility_result";

export type SchedulingStage =
  | "load_patient_record"
  | "determine_required_capabilities"
  | "inspect_nurse_specializations"
  | "inspect_nurse_schedules"
  | "select_nurse_and_slot"
  | "simulate_patient_outreach"
  | "publish_scheduling_result";

export type AnyStage = ProcessingStage | EligibilityStage | SchedulingStage;

export type WorkflowEventKind =
  | "workflow_started"
  | "trace"
  | "document_loaded"
  | "ocr_started"
  | "ocr_completed"
  | "field_extracted"
  | "field_normalized"
  | "validation_warning"
  | "agent_status_changed"
  | "workflow_completed"
  | "workflow_failed"
  | "zip_check_started"
  | "zip_check_result"
  | "insurance_check_started"
  | "insurance_check_result"
  | "eligibility_decision"
  | "nurse_lookup_started"
  | "nurse_selected"
  | "slot_selected"
  | "outreach_initiated"
  | "scheduling_decision";

export type AgentStatus = "queued" | "running" | "completed" | "failed";

export type WorkflowRun = {
  id: string;
  referralId: string;
  kind: WorkflowKind;
  status: WorkflowStatus;
  startedAt: string;
  finishedAt: string | null;
};

export type WorkflowEvent = {
  id: string;
  runId: string;
  referralId: string;
  timestamp: string;
  kind: WorkflowEventKind;
  stage: AnyStage;
  message: string;
  payload: Record<string, unknown>;
};

export type AgentRun = {
  id: string;
  runId: string;
  name: string;
  status: AgentStatus;
  startedAt: string | null;
  finishedAt: string | null;
  output: Record<string, unknown> | null;
};

export type ExtractedReferral = {
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
  fieldConfidence: Record<string, number>;
  completeness: number;
};

export type ProcessingStatusResponse = {
  run: WorkflowRun | null;
  events: WorkflowEvent[];
  agents: AgentRun[];
};

export type EligibilityDecision =
  | "eligible"
  | "blocked_zip"
  | "blocked_insurance"
  | "manual_review";

export type EligibilityResult = {
  referralId: string;
  runId: string;
  decision: EligibilityDecision;
  zipChecked: string | null;
  zipCovered: boolean;
  insuranceChecked: string | null;
  insuranceAccepted: boolean;
  reasoning: string;
  checkedAt: string;
};

export type EligibilityStatusResponse = {
  run: WorkflowRun | null;
  events: WorkflowEvent[];
  agents: AgentRun[];
  result: EligibilityResult | null;
};

export type SchedulingDecision = "initialized" | "blocked" | "manual_review";

export type SchedulingResult = {
  referralId: string;
  runId: string;
  decision: SchedulingDecision;
  assignedNurse: string | null;
  nurseRationale: string | null;
  proposedSlot: string | null;
  outreachStatus: "initiated" | "pending" | "failed" | null;
  reasoning: string;
  scheduledAt: string;
};

export type SchedulingStatusResponse = {
  run: WorkflowRun | null;
  events: WorkflowEvent[];
  agents: AgentRun[];
  result: SchedulingResult | null;
};

export type NurseRecord = {
  id: string;
  name: string;
  specializations: string[];
  availableSlots: string[];
};
