import { notFound } from "next/navigation";
import { PageShell } from "@/components/app/page-shell";
import { SchedulingClient } from "@/components/app/scheduling-client";
import { getExtractedReferral, getEligibilityStatus } from "@/lib/server/store";

export default async function SchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const extracted = await getExtractedReferral(id);
  if (!extracted) notFound();

  const eligibility = await getEligibilityStatus(id);
  if (eligibility.result && eligibility.result.decision !== "eligible") {
    return (
      <PageShell title="Scheduling Blocked" subtitle="This patient is not eligible for scheduling.">
        <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-6 text-rose-200">
          <div className="text-lg font-semibold">Eligibility check failed</div>
          <p className="mt-2 text-sm">{eligibility.result.reasoning}</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Scheduling"
      subtitle={`TinyFish is matching nurses and finding the best available slot for ${extracted.patientName ?? "patient"}.`}
    >
      <SchedulingClient referralId={id} />
    </PageShell>
  );
}
