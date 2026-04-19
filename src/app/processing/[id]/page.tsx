import { notFound } from "next/navigation";

import { PageShell } from "@/components/app/page-shell";
import { ProcessingClient } from "@/components/app/processing-client";
import { getReferral } from "@/lib/server/store";

export default async function ProcessingPage({
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
      title="LangGraph Processing"
      subtitle="The referral packet is being OCRd, extracted, normalized, and validated before publishing a structured referral record."
    >
      <ProcessingClient referral={referral} />
    </PageShell>
  );
}

