import { useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import PageShell from "../components/layout/PageShell"
import { referrals } from "../data/referrals"

function Field({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mt-2 text-sm ${value ? "text-white" : "text-amber-300"}`}>
        {value || "Missing / incomplete"}
      </div>
    </div>
  )
}

export default function ReferralDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const referral = useMemo(
    () => referrals.find((r) => r.id === id) || referrals[0],
    [id]
  )

  return (
    <PageShell
      title={`Referral Review — ${referral.patientName}`}
      subtitle="Review the incoming packet and available intake fields before starting extraction."
      actions={
        <button
          onClick={() => navigate(`/processing/${referral.id}`)}
          className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
        >
          Process / Extract
        </button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-zinc-950 p-5">
          <Field label="Patient Name" value={referral.patientName} />
          <Field label="Hospital" value={referral.hospitalName} />
          <Field label="MRN" value={referral.mrn} />
          <Field label="DOB" value={referral.details.dob} />
          <Field label="Insurance" value={referral.details.insurance} />
          <Field label="Address" value={referral.details.address} />
          <Field label="Phone" value={referral.details.phone} />
          <Field
            label="Services"
            value={referral.details.services?.join(", ")}
          />
          <Field label="PCP" value={referral.details.pcp} />
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Referral Packet Preview</div>
              <div className="text-xs text-zinc-500">{referral.pdfName}</div>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
              PDF Preview
            </span>
          </div>

          <div className="flex min-h-[640px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 text-zinc-500">
            Put sample PDF preview here later
          </div>
        </div>
      </div>
    </PageShell>
  )
}