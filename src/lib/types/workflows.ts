export type WorkflowKind = "processing";
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
  | "workflow_failed";

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
  stage: ProcessingStage;
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
