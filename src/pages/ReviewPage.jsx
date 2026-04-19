import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import PageShell from "../components/layout/PageShell"
import { getRun } from "../services/api"
import { Field, Section, Panel, LogLine, ErrorBanner, PrimaryButton, SecondaryButton, InfoBanner } from "../components/layout/ui"

export default function ReviewPage() {
  const { id: runId } = useParams()
  const navigate = useNavigate()

  const [run, setRun] = useState(null)
  const [error, setError] = useState("")
  const [insuranceProvider, setInsuranceProvider] = useState("")
  const [zipCode, setZipCode] = useState("")

  useEffect(() => {
    async function fetchRun() {
      try {
        const data = await getRun(runId)
        setRun(data)
        setInsuranceProvider(data?.referral?.insurance_provider || "")
        setZipCode(data?.referral?.zip_code || "")
      } catch (err) {
        setError(err.message || "Failed to fetch extracted referral.")
      }
    }
    fetchRun()
  }, [runId])

  const referral = run?.referral

  function handleRunEligibility() {
    navigate(`/eligibility/${runId}`, { state: { insuranceProvider, zipCode } })
  }

  return (
    <PageShell
      title="Structured Referral Review"
      subtitle="The document has been parsed, validated, and converted into structured operational fields."
      actions={
        <div className="flex gap-2">
          <SecondaryButton onClick={() => navigate(`/processing/${runId}`)}>
            Back to Processing
          </SecondaryButton>
          <PrimaryButton onClick={handleRunEligibility}>
            Run Eligibility Checks
          </PrimaryButton>
        </div>
      }
    >
      <ErrorBanner message={error} />

      {!referral ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-400 shadow-sm">
          Loading extracted referral...
        </div>
      ) : (
        <>
          <InfoBanner>
            Document understanding complete. Structured referral is ready for operational checks.
          </InfoBanner>

          <div className="space-y-5">
            <Section title="Patient Demographics">
              <Field label="Patient Name"   value={referral.patient_name} />
              <Field label="MRN"            value={referral.mrn} />
              <Field label="DOB"            value={referral.dob} />
              <Field label="Discharge Date" value={referral.discharge_date} />
            </Section>

            <Section title="Contact Information">
              <Field label="Phone"         value={referral.phone} />
              <Field label="Address"       value={referral.address} />
              <Field label="ZIP Code"      value={referral.zip_code} />
              <Field label="Missing Fields" value={referral.missing_fields?.join(", ")} />
            </Section>

            <Section title="Referral Source & Insurance">
              <Field label="Hospital"          value={referral.hospital_name} />
              <Field label="Insurance Provider" value={referral.insurance_provider} />
              <Field label="Member ID"         value={referral.member_id} />
              <Field label="Diagnosis"         value={referral.diagnosis} />
            </Section>

            <Section title="Clinical Services & Physicians">
              <Field label="Services Required"     value={referral.services_required?.join(", ")} />
              <Field label="Primary Care Physician" value={referral.primary_care_physician} />
              <Field label="Ordering Physician"     value={referral.ordering_physician} />
              <Field label="Validation Status"      value={run.status} />
            </Section>

            {/* Eligibility overrides */}
            <Panel title="Eligibility Override Inputs">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Insurance Provider
                  </label>
                  <input
                    value={insuranceProvider}
                    onChange={(e) => setInsuranceProvider(e.target.value)}
                    className="mt-2.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-400"
                    placeholder="Enter insurance provider"
                  />
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    ZIP Code
                  </label>
                  <input
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="mt-2.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-400"
                    placeholder="Enter ZIP code"
                  />
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-400">
                These values are used for TinyFish eligibility checks if extraction missed or misread them.
              </p>
            </Panel>

            {/* Validation notes */}
            <Panel title="Validation Notes">
              <div className="space-y-2">
                {referral.validation_notes?.map((note, idx) => (
                  <LogLine key={idx} message={`– ${note}`} />
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}
    </PageShell>
  )
}