import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import PageShell from "../components/layout/PageShell"
import { getRun } from "../services/api"
import { Field, Section, SecondaryButton, SuccessBanner } from "../components/layout/ui"

export default function CompletePage() {
  const { id: runId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const schedulingResult = location.state?.schedulingResult

  const [documentRun, setDocumentRun] = useState(null)

  useEffect(() => {
    async function fetchDocumentRun() {
      const data = await getRun(runId)
      setDocumentRun(data)
    }
    fetchDocumentRun()
  }, [runId])

  return (
    <PageShell
      title="Referral Workflow Complete"
      subtitle="The referral has been extracted, checked, placed, and scheduled successfully."
      actions={
        <SecondaryButton onClick={() => navigate("/portal")}>
          Back to Portal
        </SecondaryButton>
      }
    >
      <SuccessBanner>
        End-to-end workflow complete. Referral accepted and initial visit scheduled.
      </SuccessBanner>

      <div className="space-y-5">
        <Section title="Referral Intake Summary">
          <Field label="Patient Name" value={documentRun?.referral?.patient_name} />
          <Field label="MRN"          value={documentRun?.referral?.mrn} />
          <Field label="Hospital"     value={documentRun?.referral?.hospital_name} />
          <Field label="Diagnosis"    value={documentRun?.referral?.diagnosis} />
        </Section>

        <Section title="Placement & Scheduling Summary">
          <Field label="Assigned Nurse"    value={schedulingResult?.assigned_nurse} />
          <Field label="Visit Slot"        value={schedulingResult?.scheduled_slot} />
          <Field label="Call Initialized"  value={String(schedulingResult?.call_initialized)} />
          <Field label="Services Required" value={documentRun?.referral?.services_required?.join(", ")} />
        </Section>
      </div>
    </PageShell>
  )
}