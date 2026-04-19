import Link from "next/link";
import { notFound } from "next/navigation";

import { FieldCard } from "@/components/app/field-card";
import { PageShell } from "@/components/app/page-shell";
import { getReferral } from "@/lib/server/store";
import { getReferralById } from "@/lib/data/referrals";

/**
 * ReferralDetailPage — shows the PDF preview and pre-intake known fields.
 *
 * Data source priority:
 *   1. getReferral(id) from the server store (supports dynamically created
 *      referrals persisted to .demo-data/processing-store.json)
 *   2. getReferralById(id) from static fixtures as fallback (covers ref-001..004
 *      before the store is seeded, and ref-new-* demo entries)
 *
 * The PDF is rendered via <iframe> pointing to the real PDF in /public/documents/.
 */

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReferralDetailPage({ params }: Props) {
  const { id } = await params;

  // Try server store first (handles persisted + newly created referrals)
  const stored = await getReferral(id);

  // Fall back to static fixtures if store doesn't have it yet
  const fixture = stored ? null : getReferralById(id);

  if (!stored && !fixture) {
    notFound();
  }

  // Normalise to a flat shape for the template
  const patientName = stored ? stored.summary.patientName : fixture!.patientName;
  const hospitalName = stored ? stored.summary.hospitalName : fixture!.hospitalName;
  const mrn = stored ? stored.summary.mrn : fixture!.mrn;
  const referralId = stored ? stored.summary.id : fixture!.id;
  const pdfName = stored ? stored.pdfName : fixture!.pdfName;
  const pdfUrl = stored ? stored.pdfUrl : fixture!.pdfUrl;
  const knownFields = stored ? stored.knownFields : fixture!.knownFields;

  return (
    <PageShell
      title={`Referral Review — ${patientName}`}
      subtitle="Review the incoming packet and currently known fields before starting document processing."
      backHref="/portal"
      backLabel="Portal"
      currentStep={2}
      actions={
        <Link
          href={`/processing/${referralId}?autostart=1`}
          className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
        >
          Process / Extract
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Known fields snapshot */}
        <div className="space-y-3 rounded-3xl border border-white/10 bg-zinc-950 p-5">
          <div className="mb-2 text-sm font-semibold text-zinc-300">
            Pre-intake Field Snapshot
          </div>
          <FieldCard label="Patient Name" value={patientName} />
          <FieldCard label="Hospital" value={hospitalName} />
          <FieldCard label="MRN" value={mrn} />
          <FieldCard label="Date of Birth" value={knownFields.dob} />
          <FieldCard label="Insurance" value={knownFields.insurance} />
          <FieldCard label="Address" value={knownFields.address} />
          <FieldCard label="Phone" value={knownFields.phone} />
          <FieldCard label="Ordered Services" value={knownFields.services.join(", ")} />
          <FieldCard label="Primary Care Physician" value={knownFields.pcp} />
        </div>

        {/* Real PDF preview via iframe */}
        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Referral Packet Preview</div>
              <div className="text-xs text-zinc-500">{pdfName}</div>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
              PDF Preview
            </span>
          </div>

          <iframe
            src={pdfUrl}
            title={`${patientName} — referral packet PDF`}
            className="min-h-[640px] w-full rounded-2xl border border-white/10 bg-zinc-900"
          />
        </div>
      </div>
    </PageShell>
  );
}
