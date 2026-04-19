import { END, START, StateGraph, StateSchema } from "@langchain/langgraph";
import { z } from "zod";

import { publishProcessingEvent } from "@/lib/server/processing-streams";
import {
  appendProcessingEvent,
  getProcessingStatus,
  getReferral,
  getReferralPacketText,
  saveExtractedReferral,
  upsertAgentRun,
  upsertProcessingRun,
} from "@/lib/server/store";
import type {
  AgentRun,
  ExtractedReferral,
  ProcessingStage,
  WorkflowEvent,
  WorkflowEventKind,
  WorkflowRun,
} from "@/lib/types/workflows";

type CandidateFields = Record<string, string[]>;
type NormalizedFields = Record<string, string | string[] | null>;

type ProcessingStateType = {
  referralId: string;
  documentUrl: string;
  documentMetadata: Record<string, string>;
  rawText: string;
  ocrPages: string[];
  candidateFields: CandidateFields;
  normalizedFields: NormalizedFields;
  validationFindings: string[];
  warnings: string[];
  extractedReferral: ExtractedReferral | null;
  workflowStatus: "running" | "completed" | "failed";
};

const ProcessingState = new StateSchema({
  referralId: z.string(),
  documentUrl: z.string(),
  documentMetadata: z.record(z.string(), z.string()).default({}),
  rawText: z.string().default(""),
  ocrPages: z.array(z.string()).default([]),
  candidateFields: z.record(z.string(), z.array(z.string())).default({}),
  normalizedFields: z.record(z.string(), z.any()).default({}),
  validationFindings: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  extractedReferral: z.any().nullable().default(null),
  workflowStatus: z.enum(["running", "completed", "failed"]).default("running"),
});

const stageAgents: Record<ProcessingStage, string> = {
  load_document: "Document Intake Agent",
  ocr_document: "OCR Agent",
  extract_candidate_fields: "Field Extraction Agent",
  normalize_fields: "Normalization Agent",
  validate_mrn: "MRN Validator",
  validate_demographics: "Demographics Validator",
  validate_contact_info: "Contact Validator",
  validate_services_and_physician: "Clinical Validator",
  reconcile_conflicts: "Reconciliation Agent",
  publish_extracted_referral: "Publishing Agent",
};

const stageTraces: Record<ProcessingStage, string> = {
  load_document: "Resolving the referral record, packet metadata, and document source for this run.",
  ocr_document: "Reading the packet and turning the referral PDF into OCR text blocks that downstream nodes can inspect.",
  extract_candidate_fields: "Scanning OCR text for demographic, insurance, physician, and service candidates.",
  normalize_fields: "Cleaning dates, phones, ZIP codes, payer names, and service labels into a stable schema.",
  validate_mrn: "Checking whether the MRN looks structurally valid for intake.",
  validate_demographics: "Confirming patient identity fields are present and internally consistent.",
  validate_contact_info: "Checking whether address and phone details are complete enough for downstream operations.",
  validate_services_and_physician: "Verifying ordered services and physician fields before final reconciliation.",
  reconcile_conflicts: "Choosing final field values and assembling the structured extracted referral payload.",
  publish_extracted_referral: "Persisting the extracted referral and marking the processing workflow complete.",
};

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

async function pause(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function extractValue(packet: string, label: string) {
  const regex = new RegExp(`${label}:\\s*(.+)`, "i");
  return packet.match(regex)?.[1]?.trim() ?? null;
}

function isoDateFromUsDate(dateValue: string | null) {
  if (!dateValue) return null;
  const match = dateValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return dateValue;
  const [, month, day, year] = match;
  return `${year}-${month}-${day}`;
}

function normalizePhone(value: string | null) {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 10) return value.trim();
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function normalizeServices(services: string[]) {
  const dictionary: Record<string, string> = {
    "physical therapy": "PT",
    "occupational therapy": "OT",
    "speech therapy": "ST",
    "skilled nursing": "Skilled Nursing",
  };
  return services.map((service) => dictionary[service.toLowerCase()] ?? service.trim());
}

function splitInsurance(insurance: string | null) {
  if (!insurance) {
    return { insuranceName: null, insurancePlan: null };
  }

  const plan = insurance.trim();
  const payerMatch = plan.match(/^(Aetna|Humana|Blue Cross Blue Shield|UnitedHealthcare)/i);
  return {
    insuranceName: payerMatch?.[1] ?? plan.split(" ").slice(0, 2).join(" "),
    insurancePlan: plan,
  };
}

function getZip(address: string | null) {
  if (!address) return null;
  return address.match(/\b(\d{5})\b/)?.[1] ?? null;
}

async function emitEvent(
  run: WorkflowRun,
  stage: ProcessingStage,
  kind: WorkflowEventKind,
  message: string,
  payload: Record<string, unknown> = {},
) {
  const event: WorkflowEvent = {
    id: createId("evt"),
    runId: run.id,
    referralId: run.referralId,
    timestamp: new Date().toISOString(),
    kind,
    stage,
    message,
    payload,
  };

  await appendProcessingEvent(run.referralId, event);
  publishProcessingEvent(run.referralId, event);
}

async function updateAgent(
  run: WorkflowRun,
  stage: ProcessingStage,
  status: AgentRun["status"],
  output: Record<string, unknown> | null = null,
) {
  const snapshot = await getProcessingStatus(run.referralId);
  const existing =
    snapshot.agents.find((agent) => agent.name === stageAgents[stage]) ??
    ({
      id: createId("agent"),
      runId: run.id,
      name: stageAgents[stage],
      status: "queued",
      startedAt: null,
      finishedAt: null,
      output: null,
    } satisfies AgentRun);

  const next: AgentRun = {
    ...existing,
    status,
    startedAt: status === "running" ? new Date().toISOString() : existing.startedAt,
    finishedAt: status === "completed" || status === "failed" ? new Date().toISOString() : null,
    output,
  };

  await upsertAgentRun(run.referralId, next);
  await emitEvent(run, stage, "agent_status_changed", `${stageAgents[stage]} ${status}.`, {
    agentName: next.name,
    status,
    output,
  });
}

async function withStage(
  run: WorkflowRun,
  stage: ProcessingStage,
  state: ProcessingStateType,
  work: () => Promise<Partial<ProcessingStateType>>,
) {
  await emitEvent(run, stage, "trace", stageTraces[stage], {
    agentName: stageAgents[stage],
    stage,
  });
  await updateAgent(run, stage, "running");
  await pause(350);

  try {
    const result = await work();
    await pause(180);
    await updateAgent(run, stage, "completed", result as Record<string, unknown>);
    return result;
  } catch (error) {
    await updateAgent(run, stage, "failed", {
      error: error instanceof Error ? error.message : "Unknown stage failure",
    });
    throw error;
  }
}

function buildGraph(run: WorkflowRun) {
  return new StateGraph(ProcessingState)
    .addNode("load_document", async (state: ProcessingStateType) =>
      withStage(run, "load_document", state, async () => {
        const referral = await getReferral(state.referralId);
        if (!referral) throw new Error("Referral not found.");
        await emitEvent(run, "load_document", "document_loaded", "Referral packet loaded.", {
          pdfUrl: referral.pdfUrl,
          pdfName: referral.pdfName,
        });
        return {
          documentUrl: referral.pdfUrl,
          documentMetadata: { pdfName: referral.pdfName },
        };
      }),
    )
    .addNode("ocr_document", async (state: ProcessingStateType) =>
      withStage(run, "ocr_document", state, async () => {
        await emitEvent(run, "ocr_document", "ocr_started", "OCR started on packet.");
        const packetText = await getReferralPacketText(state.referralId);
        if (!packetText) throw new Error("Packet text unavailable.");

        const pages = packetText
          .split("\n")
          .reduce<string[]>((acc, line, index) => {
            const bucket = Math.floor(index / 7);
            acc[bucket] = acc[bucket] ? `${acc[bucket]}\n${line}` : line;
            return acc;
          }, [])
          .filter(Boolean);

        await emitEvent(run, "ocr_document", "ocr_completed", "OCR text extracted from packet.", {
          pageCount: pages.length,
        });

        return {
          rawText: packetText,
          ocrPages: pages,
        };
      }),
    )
    .addNode("extract_candidate_fields", async (state: ProcessingStateType) =>
      withStage(run, "extract_candidate_fields", state, async () => {
        const packet = state.rawText;
        const candidates: CandidateFields = {
          patientName: [extractValue(packet, "Patient Name")].filter(Boolean) as string[],
          mrn: [extractValue(packet, "MRN")].filter(Boolean) as string[],
          dob: [extractValue(packet, "DOB")].filter(Boolean) as string[],
          phone: [extractValue(packet, "Phone"), extractValue(packet, "Emergency Contact Phone")].filter(Boolean) as string[],
          address: [extractValue(packet, "Address")].filter(Boolean) as string[],
          hospitalName: [extractValue(packet, "Discharging Hospital")].filter(Boolean) as string[],
          insurance: [extractValue(packet, "Insurance")].filter(Boolean) as string[],
          pcp: [extractValue(packet, "Primary Care Physician")].filter(Boolean) as string[],
          orderingPhysician: [extractValue(packet, "Ordering Physician")].filter(Boolean) as string[],
          orderedServices: (extractValue(packet, "Ordered Services") ?? "")
            .split(";")
            .map((value) => value.trim())
            .filter(Boolean),
        };

        for (const [field, values] of Object.entries(candidates)) {
          if (values.length > 0) {
            await emitEvent(run, "extract_candidate_fields", "field_extracted", `${field} extracted from packet.`, {
              field,
              values,
            });
            await pause(220);
          }
        }

        return {
          candidateFields: candidates,
        };
      }),
    )
    .addNode("normalize_fields", async (state: ProcessingStateType) =>
      withStage(run, "normalize_fields", state, async () => {
        const insurance = state.candidateFields.insurance?.[0] ?? null;
        const address = state.candidateFields.address?.[0] ?? null;

        const normalized: NormalizedFields = {
          patientName: state.candidateFields.patientName?.[0] ?? null,
          mrn: state.candidateFields.mrn?.[0] ?? null,
          dob: isoDateFromUsDate(state.candidateFields.dob?.[0] ?? null),
          phone: normalizePhone(state.candidateFields.phone?.[0] ?? null),
          address,
          zip: getZip(address),
          hospitalName: state.candidateFields.hospitalName?.[0] ?? null,
          ...splitInsurance(insurance),
          orderedServices: normalizeServices(state.candidateFields.orderedServices ?? []),
          pcp: state.candidateFields.pcp?.[0] ?? null,
          orderingPhysician: state.candidateFields.orderingPhysician?.[0] ?? null,
        };

        for (const [field, value] of Object.entries(normalized)) {
          await emitEvent(run, "normalize_fields", "field_normalized", `${field} normalized.`, { field, value });
          await pause(180);
        }

        return {
          normalizedFields: normalized,
        };
      }),
    )
    .addNode("validate_mrn", async (state: ProcessingStateType) =>
      withStage(run, "validate_mrn", state, async () => {
        const warnings = [...state.warnings];
        const mrn = state.normalizedFields.mrn as string | null;
        if (!mrn || !/^MRN-\d{6}$/.test(mrn)) {
          warnings.push("MRN missing or does not match expected intake format.");
          await emitEvent(run, "validate_mrn", "validation_warning", warnings.at(-1)!, { warning: warnings.at(-1) });
        }
        return { warnings, validationFindings: warnings };
      }),
    )
    .addNode("validate_demographics", async (state: ProcessingStateType) =>
      withStage(run, "validate_demographics", state, async () => {
        const warnings = [...state.warnings];
        if (!(state.normalizedFields.patientName as string | null)) warnings.push("Patient name missing from packet.");
        if (!(state.normalizedFields.dob as string | null)) warnings.push("DOB missing from packet.");
        for (const warning of warnings.slice(state.warnings.length)) {
          await emitEvent(run, "validate_demographics", "validation_warning", warning, { warning });
        }
        return { warnings, validationFindings: warnings };
      }),
    )
    .addNode("validate_contact_info", async (state: ProcessingStateType) =>
      withStage(run, "validate_contact_info", state, async () => {
        const warnings = [...state.warnings];
        if (!(state.normalizedFields.phone as string | null)) warnings.push("Phone number missing or incomplete.");
        if (!(state.normalizedFields.address as string | null)) warnings.push("Address missing or incomplete.");
        for (const warning of warnings.slice(state.warnings.length)) {
          await emitEvent(run, "validate_contact_info", "validation_warning", warning, { warning });
        }
        return { warnings, validationFindings: warnings };
      }),
    )
    .addNode("validate_services_and_physician", async (state: ProcessingStateType) =>
      withStage(run, "validate_services_and_physician", state, async () => {
        const warnings = [...state.warnings];
        const services = state.normalizedFields.orderedServices as string[];
        if (!services || services.length === 0) warnings.push("Ordered services missing from packet.");
        if (!(state.normalizedFields.orderingPhysician as string | null)) warnings.push("Ordering physician missing from packet.");
        for (const warning of warnings.slice(state.warnings.length)) {
          await emitEvent(run, "validate_services_and_physician", "validation_warning", warning, { warning });
        }
        return { warnings, validationFindings: warnings };
      }),
    )
    .addNode("reconcile_conflicts", async (state: ProcessingStateType) =>
      withStage(run, "reconcile_conflicts", state, async () => {
        const normalized = state.normalizedFields;
        const presentFields = [
          normalized.patientName,
          normalized.mrn,
          normalized.dob,
          normalized.phone,
          normalized.address,
          normalized.zip,
          normalized.hospitalName,
          normalized.insuranceName,
          normalized.insurancePlan,
          ...(normalized.orderedServices as string[]),
          normalized.orderingPhysician,
        ].filter(Boolean);

        const fieldConfidence: Record<string, number> = Object.fromEntries(
          Object.entries(normalized).map(([field, value]) => {
            if (Array.isArray(value)) return [field, value.length > 0 ? 0.95 : 0.25];
            return [field, value ? 0.94 : 0.2];
          }),
        );

        const result: ExtractedReferral = {
          referralId: state.referralId,
          patientName: (normalized.patientName as string | null) ?? null,
          mrn: (normalized.mrn as string | null) ?? null,
          dob: (normalized.dob as string | null) ?? null,
          phone: (normalized.phone as string | null) ?? null,
          address: (normalized.address as string | null) ?? null,
          zip: (normalized.zip as string | null) ?? null,
          hospitalName: (normalized.hospitalName as string | null) ?? null,
          insuranceName: (normalized.insuranceName as string | null) ?? null,
          insurancePlan: (normalized.insurancePlan as string | null) ?? null,
          orderedServices: (normalized.orderedServices as string[]) ?? [],
          pcp: (normalized.pcp as string | null) ?? null,
          orderingPhysician: (normalized.orderingPhysician as string | null) ?? null,
          warnings: state.warnings,
          fieldConfidence,
          completeness: Number((presentFields.length / 11).toFixed(2)),
        };

        await emitEvent(
          run,
          "reconcile_conflicts",
          "trace",
          "Structured referral payload assembled from normalized fields and validation findings.",
          {
            preview: result,
          },
        );

        return { extractedReferral: result };
      }),
    )
    .addNode("publish_extracted_referral", async (state: ProcessingStateType) =>
      withStage(run, "publish_extracted_referral", state, async () => {
        if (!state.extractedReferral) throw new Error("No extracted referral available to publish.");
        await saveExtractedReferral(state.referralId, state.extractedReferral);
        const completedRun: WorkflowRun = {
          ...run,
          status: "completed",
          finishedAt: new Date().toISOString(),
        };
        await upsertProcessingRun(state.referralId, completedRun);
        await emitEvent(run, "publish_extracted_referral", "workflow_completed", "Referral extraction completed.", {
          completeness: state.extractedReferral.completeness,
        });
        return { workflowStatus: "completed" };
      }),
    )
    .addEdge(START, "load_document")
    .addEdge("load_document", "ocr_document")
    .addEdge("ocr_document", "extract_candidate_fields")
    .addEdge("extract_candidate_fields", "normalize_fields")
    .addEdge("normalize_fields", "validate_mrn")
    .addEdge("validate_mrn", "validate_demographics")
    .addEdge("validate_demographics", "validate_contact_info")
    .addEdge("validate_contact_info", "validate_services_and_physician")
    .addEdge("validate_services_and_physician", "reconcile_conflicts")
    .addEdge("reconcile_conflicts", "publish_extracted_referral")
    .addEdge("publish_extracted_referral", END)
    .compile();
}

export async function startProcessingWorkflow(referralId: string) {
  const existing = await getProcessingStatus(referralId);
  if (existing.run?.status === "running" || existing.run?.status === "completed") {
    return existing.run;
  }

  const referral = await getReferral(referralId);
  if (!referral) {
    throw new Error("Referral not found.");
  }

  const run: WorkflowRun = {
    id: createId("run"),
    referralId,
    kind: "processing",
    status: "running",
    startedAt: new Date().toISOString(),
    finishedAt: null,
  };

  await upsertProcessingRun(referralId, run);
  await emitEvent(run, "load_document", "workflow_started", "Processing workflow started.", {
    pdfName: referral.pdfName,
  });

  queueMicrotask(async () => {
    try {
      const graph = buildGraph(run);
      await graph.invoke({
        referralId,
        documentUrl: referral.pdfUrl,
        documentMetadata: { pdfName: referral.pdfName },
        rawText: "",
        ocrPages: [],
        candidateFields: {},
        normalizedFields: {},
        validationFindings: [],
        warnings: [],
        extractedReferral: null,
        workflowStatus: "running",
      });
    } catch (error) {
      const failedRun: WorkflowRun = {
        ...run,
        status: "failed",
        finishedAt: new Date().toISOString(),
      };
      await upsertProcessingRun(referralId, failedRun);
      await emitEvent(
        failedRun,
        "publish_extracted_referral",
        "workflow_failed",
        error instanceof Error ? error.message : "Processing failed.",
        { error: error instanceof Error ? error.message : "Unknown processing failure" },
      );
    }
  });

  return run;
}
