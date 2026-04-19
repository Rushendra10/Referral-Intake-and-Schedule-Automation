import Link from "next/link";
import { notFound } from "next/navigation";

import { FieldCard } from "@/components/app/field-card";
import { PageShell } from "@/components/app/page-shell";
import { getExtractedReferral } from "@/lib/server/store";
import { formatDateLabel } from "@/lib/utils";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
      <div className="mb-4 text-sm font-medium">{title}</div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getExtractedReferral(id);

  if (!result) {
    notFound();
  }

  return (
    <PageShell
      title="Extracted Referral Summary"
      subtitle="Structured intake data has been assembled from the packet and persisted for downstream operational checks."
      actions={
        <button
          disabled
          className="rounded-lg bg-cyan-400/30 px-5 py-3 text-sm font-semibold text-cyan-100 opacity-70"
        >
          Eligibility Orchestration Coming Next
        </button>
      }
    >
      <div className="mb-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-emerald-200">
        Referral extracted successfully. This structured record is now ready for eligibility and scheduling workflows.
      </div>

      <div className="space-y-6">
        <Section title="Patient Demographics">
          <FieldCard label="Patient Name" value={result.patientName} />
          <FieldCard label="MRN" value={result.mrn} />
          <FieldCard label="DOB" value={formatDateLabel(result.dob)} />
          <FieldCard label="Phone" value={result.phone} />
          <FieldCard label="Address" value={result.address} />
          <FieldCard label="ZIP" value={result.zip} />
        </Section>

        <Section title="Referral & Insurance">
          <FieldCard label="Hospital" value={result.hospitalName} />
          <FieldCard label="Insurance Payer" value={result.insuranceName} />
          <FieldCard label="Insurance Plan" value={result.insurancePlan} />
          <FieldCard label="Completeness" value={`${Math.round(result.completeness * 100)}%`} />
        </Section>

        <Section title="Clinical Requirements">
          <FieldCard label="Ordered Services" value={result.orderedServices.join(", ")} />
          <FieldCard label="Primary Care Physician" value={result.pcp} />
          <FieldCard label="Ordering Physician" value={result.orderingPhysician} />
          <FieldCard label="Warnings" value={result.warnings.length > 0 ? result.warnings.join(" | ") : "None"} />
        </Section>

        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
          <div className="mb-4 text-sm font-medium">Field Confidence</div>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(result.fieldConfidence).map(([field, confidence]) => (
              <div key={field} className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
                <div className="text-xs uppercase tracking-wide text-zinc-500">{field}</div>
                <div className="mt-2 text-sm text-white">{Math.round(confidence * 100)}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Link href="/portal" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300">
            Back to Portal
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

