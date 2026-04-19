import { notFound } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/app/page-shell";
import { FieldCard } from "@/components/ui/field-card";
import { getReferralById } from "@/lib/data/referrals";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReferralDetailPage({ params }: Props) {
  const { id } = await params;
  const referral = getReferralById(id);

  if (!referral) notFound();

  return (
    <PageShell
      title={`Referral Review — ${referral.patientName}`}
      subtitle="Review the incoming packet and available intake fields before starting extraction."
      backHref="/portal"
      backLabel="Portal"
      currentStep={2}
      actions={
        <Link
          href={`/processing/${referral.id}`}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
        >
          Process / Extract
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Known fields */}
        <div className="space-y-3 rounded-3xl border border-white/10 bg-zinc-950 p-5">
          <div className="mb-2 text-sm font-semibold text-zinc-300">Pre-intake Field Snapshot</div>
          <FieldCard label="Patient Name" value={referral.patientName} />
          <FieldCard label="Hospital" value={referral.hospitalName} />
          <FieldCard label="MRN" value={referral.mrn} />
          <FieldCard label="Date of Birth" value={referral.knownFields.dob} />
          <FieldCard label="Insurance" value={referral.knownFields.insurance} />
          <FieldCard label="Address" value={referral.knownFields.address} />
          <FieldCard label="Phone" value={referral.knownFields.phone} />
          <FieldCard
            label="Ordered Services"
            value={referral.knownFields.services.join(", ")}
          />
          <FieldCard label="Primary Care Physician" value={referral.knownFields.pcp} />
        </div>

        {/* PDF preview pane */}
        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Referral Packet Preview</div>
              <div className="text-xs text-zinc-500">{referral.pdfName}</div>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
              PDF Preview
            </span>
          </div>

          {/* Simulated PDF content */}
          <div className="min-h-[580px] rounded-2xl border border-dashed border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8">
            <div className="space-y-4 font-mono text-xs text-zinc-400">
              <div className="text-zinc-300 font-semibold text-sm">REFERRAL PACKET</div>
              <div className="border-b border-white/5 pb-2 text-zinc-500">
                ─────────────────────────────────
              </div>
              <div>Patient: {referral.patientName}</div>
              <div>DOB: {referral.knownFields.dob ?? "[not found]"}</div>
              <div>MRN: {referral.mrn}</div>
              <div className="pt-2">Referring Hospital:</div>
              <div className="pl-2">{referral.hospitalName}</div>
              <div className="pt-2">Insurance:</div>
              <div className="pl-2">{referral.knownFields.insurance ?? "[not found]"}</div>
              <div className="pt-2">Address:</div>
              <div className="pl-2">{referral.knownFields.address ?? "[not found]"}</div>
              <div className="pt-2">Phone:</div>
              <div className="pl-2">{referral.knownFields.phone ?? "[not found]"}</div>
              <div className="pt-2">Ordered Services:</div>
              {referral.knownFields.services.map((s) => (
                <div key={s} className="pl-2">• {s}</div>
              ))}
              <div className="pt-2">PCP:</div>
              <div className="pl-2">{referral.knownFields.pcp ?? "[not found]"}</div>
              <div className="border-t border-white/5 pt-4 text-[10px] text-zinc-600">
                [Page 1 of 3 — Discharge Summary]
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
