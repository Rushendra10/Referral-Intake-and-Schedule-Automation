import Link from "next/link";
import { notFound } from "next/navigation";

import { FieldCard } from "@/components/app/field-card";
import { PageShell } from "@/components/app/page-shell";
import { getReferral } from "@/lib/server/store";

export default async function ReferralDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const referral = await getReferral(id);

  if (!referral) {
    notFound();
  }

  return (
    <PageShell
      title={`Referral Review - ${referral.summary.patientName}`}
      subtitle="Review the incoming packet and currently known fields before starting document processing."
      actions={
        <Link
          href={`/processing/${referral.summary.id}?autostart=1`}
          className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-semibold leading-none text-black transition hover:opacity-90"
          style={{ color: "#000000" }}
        >
          <span className="text-black">Process / Extract</span>
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-zinc-950 p-5">
          <FieldCard label="Patient Name" value={referral.summary.patientName} />
          <FieldCard label="Hospital" value={referral.summary.hospitalName} />
          <FieldCard label="MRN" value={referral.summary.mrn} />
          <FieldCard label="DOB" value={referral.knownFields.dob} />
          <FieldCard label="Insurance" value={referral.knownFields.insurance} />
          <FieldCard label="Address" value={referral.knownFields.address} />
          <FieldCard label="Phone" value={referral.knownFields.phone} />
          <FieldCard label="Services" value={referral.knownFields.services.join(", ")} />
          <FieldCard label="PCP" value={referral.knownFields.pcp} />
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Referral Packet Preview</div>
              <div className="text-xs text-zinc-500">{referral.pdfName}</div>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">PDF Preview</span>
          </div>

          <iframe
            src={referral.pdfUrl}
            title={`${referral.summary.patientName} PDF preview`}
            className="min-h-[640px] w-full rounded-2xl border border-white/10 bg-zinc-900"
          />
        </div>
      </div>
    </PageShell>
  );
}
