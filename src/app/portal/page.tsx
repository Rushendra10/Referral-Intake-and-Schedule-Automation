import { PageShell } from "@/components/app/page-shell";
import { PortalTableClient } from "@/components/app/portal-table-client";
import { getReferrals } from "@/lib/server/store";

export default async function PortalPage() {
  const referrals = await getReferrals();

  return (
    <PageShell
      title="Referral Portal"
      subtitle="Incoming referrals from hospital discharge teams. Select a referral to review the packet and begin extraction."
    >
      <PortalTableClient initialReferrals={referrals} />
    </PageShell>
  );
}

