import Link from "next/link";
import { PageShell } from "@/components/app/page-shell";
import { ReferralFieldGrid } from "@/components/app/referral-field-grid";
import { VerdictBanner } from "@/components/ui/verdict-banner";
import { Button } from "@/components/ui/button";
import { getExtractedReferral } from "@/lib/data/extracted-referrals";
import { runEligibilityCheck } from "@/backend/tinyfish/eligibility/engine";
import { getReferralById } from "@/lib/data/referrals";

/**
 * ResultPage — refactored to show real extracted data + eligibility verdict.
 *
 * Data sources:
 *   - getExtractedReferral(id)  → ExtractedReferral with field confidence
 *   - runEligibilityCheck(id)   → EligibilityResult with verdict + reason
 *
 * "Initialize Scheduling" CTA is only shown for eligible or manual_review.
 * Blocked referrals show a clear stop state with no forward navigation.
 *
 * Step 5 in the pipeline.
 */

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ResultPage({ params }: Props) {
  const { id } = await params;

  const extracted = getExtractedReferral(id);
  const eligibility = runEligibilityCheck(id);
  const referral = getReferralById(id);
  const patientName = referral?.patientName ?? extracted.patientName ?? "Patient";

  const canSchedule =
    eligibility.verdict === "eligible" || eligibility.verdict === "manual_review";

  return (
    <PageShell
      title={`Extracted Referral — ${patientName}`}
      subtitle="Structured intake data assembled by LangGraph agents, with SunCare eligibility decision via TinyFish automation."
      backHref={`/eligibility/${id}`}
      backLabel="Eligibility Check"
      currentStep={5}
      actions={
        canSchedule ? (
          <Link href={`/schedule/${id}`}>
            <Button>Initialize Scheduling</Button>
          </Link>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* Completeness summary */}
        <div className="flex items-center gap-6 rounded-2xl border border-white/10 bg-zinc-900/60 px-6 py-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Extraction Completeness
            </div>
            <div className="mt-1 text-2xl font-semibold">
              {Math.round(extracted.completeness * 100)}%
            </div>
          </div>
          <div className="flex-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-full rounded-full transition-all ${
                  extracted.completeness >= 0.9
                    ? "bg-emerald-400"
                    : extracted.completeness >= 0.7
                    ? "bg-cyan-400"
                    : "bg-amber-400"
                }`}
                style={{ width: `${extracted.completeness * 100}%` }}
              />
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-zinc-500">Referral ID</div>
            <div className="mt-1 font-mono text-sm text-zinc-300">{id}</div>
          </div>
        </div>

        {/* Eligibility verdict */}
        <VerdictBanner
          verdict={eligibility.verdict}
          reason={eligibility.reason}
          ctaLabel={canSchedule ? "Proceed to Scheduling" : undefined}
          ctaHref={canSchedule ? `/schedule/${id}` : undefined}
        />

        {/* Extracted fields grid with confidence bars */}
        <ReferralFieldGrid data={extracted} showConfidence={true} />
      </div>
    </PageShell>
  );
}
