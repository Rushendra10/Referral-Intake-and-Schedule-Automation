import { notFound } from "next/navigation";
import { PageShell } from "@/components/app/page-shell";
import { EligibilityClient } from "@/components/app/eligibility-client";
import { getExtractedReferral } from "@/lib/server/store";

export default async function EligibilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const extracted = await getExtractedReferral(id);
  if (!extracted) notFound();

  return (
    <PageShell
      title="Eligibility Check"
      subtitle={`Running TinyFish eligibility workflows for ${extracted.patientName ?? "patient"} — ZIP coverage and insurance acceptance.`}
    >
      <EligibilityClient referralId={id} />
    </PageShell>
  );
}
