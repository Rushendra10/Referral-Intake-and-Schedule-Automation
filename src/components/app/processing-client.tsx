"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { ReferralDetail } from "@/lib/types/referrals";
import type { ExtractedReferral, ProcessingStage, WorkflowEvent } from "@/lib/types/workflows";
import { useProcessingStream } from "@/lib/sse/use-processing-stream";
import { FieldCard } from "@/components/app/field-card";

const stages: { key: ProcessingStage; label: string }[] = [
  { key: "load_document", label: "Referral packet received" },
  { key: "ocr_document", label: "OCR in progress" },
  { key: "extract_candidate_fields", label: "Candidate fields extracted" },
  { key: "normalize_fields", label: "Fields normalized" },
  { key: "validate_mrn", label: "MRN validated" },
  { key: "validate_demographics", label: "Demographics validated" },
  { key: "validate_contact_info", label: "Contact info validated" },
  { key: "validate_services_and_physician", label: "Clinical requirements validated" },
  { key: "reconcile_conflicts", label: "Cross-field reconciliation complete" },
  { key: "publish_extracted_referral", label: "Referral ready for results" },
];

export function ProcessingClient({ referral }: { referral: ReferralDetail }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoStart = searchParams?.get("autostart") === "1";
  const { run, events, agents, loading, reconnecting, error, status } = useProcessingStream(
    referral.summary.id,
    autoStart,
  );
  const [redirectReady, setRedirectReady] = useState(false);

  useEffect(() => {
    if (status === "completed") {
      const timer = window.setTimeout(() => {
        setRedirectReady(true);
        router.replace(`/result/${referral.summary.id}`);
      }, 2200);

      return () => window.clearTimeout(timer);
    }
  }, [referral.summary.id, router, status]);

  const currentStageIndex = useMemo(() => {
    if (events.length === 0) return 0;
    const latestStage = events.at(-1)?.stage;
    const index = stages.findIndex((stage) => stage.key === latestStage);
    return index === -1 ? 0 : index + 1;
  }, [events]);

  const traceEvents = useMemo(
    () => events.filter((event) => event.kind === "trace"),
    [events],
  );

  const preview = useMemo(() => buildPreview(events), [events]);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
      <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
        <div className="mb-4 text-sm font-medium">Packet Preview</div>
        <iframe
          src={referral.pdfUrl}
          title={`${referral.summary.patientName} packet`}
          className="min-h-[420px] w-full rounded-2xl border border-white/10 bg-zinc-900"
        />
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-medium">Workflow Progress</div>
            {reconnecting ? <div className="text-xs text-amber-300">Reconnecting stream...</div> : null}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {stages.map((stage, index) => {
              const active = index < currentStageIndex;
              return (
                <div
                  key={stage.key}
                  className={`rounded-2xl border p-4 text-xs ${
                    active
                      ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-200"
                      : "border-white/10 bg-zinc-900 text-zinc-500"
                  }`}
                >
                  {stage.label}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
          <div className="mb-4 text-sm font-medium">Processing Agents</div>
          <div className="grid gap-4 md:grid-cols-2">
            {agents.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4 text-sm text-zinc-500">
                {loading ? "Waiting for processing workflow..." : "Processing agents will appear here once the run starts."}
              </div>
            ) : (
              agents.map((agent) => (
                <div key={agent.id} className="rounded-2xl border border-white/10 bg-zinc-900/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium">{agent.name}</div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        agent.status === "completed"
                          ? "bg-emerald-400/15 text-emerald-300"
                          : agent.status === "running"
                            ? "bg-cyan-400/15 text-cyan-300"
                            : agent.status === "failed"
                              ? "bg-rose-400/15 text-rose-300"
                              : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {agent.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
          <div className="mb-4 text-sm font-medium">LangGraph Trace</div>
          <div className="space-y-3">
            {traceEvents.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-500">
                Waiting for the graph to emit trace steps...
              </div>
            ) : (
              traceEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-cyan-400/10 bg-cyan-400/5 px-4 py-3 text-sm text-zinc-200"
                >
                  <div className="font-medium text-cyan-200">{event.stage}</div>
                  <div className="mt-1 text-zinc-300">{event.message}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-medium">Structured Referral Building Live</div>
            {status === "completed" && !redirectReady ? (
              <div className="text-xs text-emerald-300">Finalizing result view...</div>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldCard label="Patient Name" value={preview.patientName} />
            <FieldCard label="MRN" value={preview.mrn} />
            <FieldCard label="DOB" value={preview.dob} />
            <FieldCard label="Phone" value={preview.phone} />
            <FieldCard label="Address" value={preview.address} />
            <FieldCard label="ZIP" value={preview.zip} />
            <FieldCard label="Hospital" value={preview.hospitalName} />
            <FieldCard label="Insurance Payer" value={preview.insuranceName} />
            <FieldCard label="Insurance Plan" value={preview.insurancePlan} />
            <FieldCard label="Services" value={preview.orderedServices} />
            <FieldCard label="PCP" value={preview.pcp} />
            <FieldCard label="Ordering Physician" value={preview.orderingPhysician} />
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">Validation Warnings</div>
            <div className="mt-2 text-sm text-zinc-300">
              {preview.warnings.length > 0 ? preview.warnings.join(" | ") : "No warnings yet."}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
          <div className="mb-4 text-sm font-medium">Processing Event Stream</div>
          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
          <div className="space-y-3">
            {events.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-500">
                {loading ? "Loading processing run..." : "No processing events yet."}
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-white/5 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-300"
                >
                  <div className="font-medium text-white">{event.message}</div>
                  <div className="mt-2 text-xs uppercase tracking-wide text-zinc-500">{event.stage}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {run?.status === "failed" ? (
          <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-5 text-rose-200">
            Processing failed. Review the event stream and retry with a stable seeded packet.
          </div>
        ) : null}
      </div>
    </div>
  );
}

type PreviewShape = Pick<
  ExtractedReferral,
  | "patientName"
  | "mrn"
  | "dob"
  | "phone"
  | "address"
  | "zip"
  | "hospitalName"
  | "insuranceName"
  | "insurancePlan"
  | "pcp"
  | "orderingPhysician"
> & {
  orderedServices: string | null;
  warnings: string[];
};

function buildPreview(events: WorkflowEvent[]): PreviewShape {
  const preview: PreviewShape = {
    patientName: null,
    mrn: null,
    dob: null,
    phone: null,
    address: null,
    zip: null,
    hospitalName: null,
    insuranceName: null,
    insurancePlan: null,
    pcp: null,
    orderingPhysician: null,
    orderedServices: null,
    warnings: [],
  };

  for (const event of events) {
    if (event.kind === "field_normalized") {
      const field = String(event.payload.field ?? "");
      const value = event.payload.value;

      if (field === "orderedServices" && Array.isArray(value)) {
        preview.orderedServices = value.join(", ");
      } else if (field in preview && typeof value === "string") {
        (preview as Record<string, string | string[] | null>)[field] = value;
      }
    }

    if (event.kind === "validation_warning" && typeof event.payload.warning === "string") {
      preview.warnings = [...preview.warnings, event.payload.warning];
    }

    if (event.kind === "trace" && event.payload.preview && typeof event.payload.preview === "object") {
      const result = event.payload.preview as ExtractedReferral;
      preview.patientName = result.patientName;
      preview.mrn = result.mrn;
      preview.dob = result.dob;
      preview.phone = result.phone;
      preview.address = result.address;
      preview.zip = result.zip;
      preview.hospitalName = result.hospitalName;
      preview.insuranceName = result.insuranceName;
      preview.insurancePlan = result.insurancePlan;
      preview.pcp = result.pcp;
      preview.orderingPhysician = result.orderingPhysician;
      preview.orderedServices = result.orderedServices.join(", ");
      preview.warnings = result.warnings;
    }
  }

  return preview;
}
