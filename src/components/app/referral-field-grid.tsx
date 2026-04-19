import { FieldCard } from "@/components/ui/field-card";
import { AlertTriangle } from "lucide-react";
import type { ExtractedReferral } from "@/lib/types";

/**
 * ReferralFieldGrid — renders an ExtractedReferral object in grouped sections.
 *
 * Sections:
 *   1. Patient Demographics
 *   2. Insurance & Referral
 *   3. Clinical Requirements
 *   4. Extraction Warnings
 */

interface Props {
  data: ExtractedReferral;
  showConfidence?: boolean;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
      <div className="mb-4 text-sm font-semibold text-zinc-300">{title}</div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}

export function ReferralFieldGrid({ data, showConfidence = true }: Props) {
  const conf = (field: string) =>
    showConfidence ? data.fieldConfidence[field] : undefined;

  return (
    <div className="space-y-5">
      {/* Demographics */}
      <Section title="Patient Demographics">
        <FieldCard label="Patient Name" value={data.patientName} confidence={conf("patientName")} />
        <FieldCard label="MRN" value={data.mrn} confidence={conf("mrn")} />
        <FieldCard label="Date of Birth" value={data.dob} confidence={conf("dob")} />
        <FieldCard label="Phone" value={data.phone} confidence={conf("phone")} />
        <FieldCard label="Address" value={data.address} confidence={conf("address")} />
        <FieldCard label="ZIP Code" value={data.zip} confidence={conf("zip")} />
      </Section>

      {/* Insurance */}
      <Section title="Insurance & Referral">
        <FieldCard label="Hospital / Discharge Facility" value={data.hospitalName} confidence={conf("hospitalName")} />
        <FieldCard label="Insurance Payer" value={data.insuranceName} confidence={conf("insuranceName")} />
        <FieldCard label="Insurance Plan" value={data.insurancePlan} confidence={conf("insurancePlan")} />
        <FieldCard label="Primary Care Physician" value={data.pcp} confidence={conf("pcp")} />
        <FieldCard label="Ordering Physician" value={data.orderingPhysician} confidence={conf("orderingPhysician")} />
      </Section>

      {/* Clinical */}
      <Section title="Clinical Requirements">
        <FieldCard
          label="Ordered Services"
          value={data.orderedServices.length > 0 ? data.orderedServices.join(", ") : null}
          confidence={conf("orderedServices")}
          className="sm:col-span-2 lg:col-span-3"
        />
      </Section>

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <div className="rounded-3xl border border-amber-400/20 bg-amber-400/5 p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            Extraction Warnings
          </div>
          <ul className="space-y-1.5">
            {data.warnings.map((w, i) => (
              <li key={i} className="text-sm text-amber-200/80">
                · {w}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
