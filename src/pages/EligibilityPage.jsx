import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import PageShell from "../components/layout/PageShell"
import { getRun, getTinyfishRun, startTinyfishEligibility } from "../services/api"
import { Field, Panel, LogLine, AgentCard, ErrorBanner, PrimaryButton, SuccessBanner, WarningBanner } from "../components/layout/ui"

export default function EligibilityPage() {
  const { id: runId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const insuranceProviderOverride = location.state?.insuranceProvider || ""
  const zipCodeOverride = location.state?.zipCode || ""

  const [documentRun, setDocumentRun] = useState(null)
  const [tinyfishRun, setTinyfishRun] = useState(null)
  const [tinyfishRunId, setTinyfishRunId] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchDocumentRun() {
      try {
        const data = await getRun(runId)
        setDocumentRun(data)
      } catch (err) {
        setError(err.message || "Failed to fetch document run.")
      }
    }
    fetchDocumentRun()
  }, [runId])

  useEffect(() => {
    let intervalId

    async function beginTinyfish() {
      try {
        const start = await startTinyfishEligibility({
          runId,
          insuranceProvider: insuranceProviderOverride,
          zipCode: zipCodeOverride,
        })
        setTinyfishRunId(start.tinyfish_run_id)

        async function fetchTinyfishRun() {
          try {
            const data = await getTinyfishRun(start.tinyfish_run_id)
            setTinyfishRun(data)
            if (data.status === "complete" || data.status === "failed") {
              if (intervalId) clearInterval(intervalId)
            }
          } catch (err) {
            setError(err.message || "Failed to fetch TinyFish run.")
            if (intervalId) clearInterval(intervalId)
          }
        }

        await fetchTinyfishRun()
        intervalId = setInterval(fetchTinyfishRun, 1500)
      } catch (err) {
        setError(err.message || "Failed to start TinyFish eligibility.")
      }
    }

    beginTinyfish()
    return () => { if (intervalId) clearInterval(intervalId) }
  }, [runId, insuranceProviderOverride, zipCodeOverride])

  const done = tinyfishRun?.status === "complete"
  const passed = tinyfishRun?.insurance_accepted && tinyfishRun?.serviceable_zip

  return (
    <PageShell
      title="Eligibility Checks"
      subtitle="TinyFish agents are verifying payer acceptance and serviceability through real browser workflows."
      actions={
        done && (
          <PrimaryButton onClick={() => navigate(`/schedule/${runId}`)}>
            Schedule Visit
          </PrimaryButton>
        )
      }
    >
      <ErrorBanner message={error} />
      {tinyfishRun?.status === "failed" && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          TinyFish workflow failed: {tinyfishRun.error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-5">
          <Panel title="Eligibility Context">
            <div className="space-y-3">
              <Field label="Patient Name"          value={documentRun?.referral?.patient_name} />
              <Field label="Insurance Provider Used" value={insuranceProviderOverride || documentRun?.referral?.insurance_provider} />
              <Field label="ZIP Code Used"          value={zipCodeOverride || documentRun?.referral?.zip_code} />
              <Field label="TinyFish Run ID"        value={tinyfishRunId || "Starting..."} />
            </div>
          </Panel>

          <Panel title="TinyFish Event Stream">
            <div className="space-y-2">
              {tinyfishRun?.logs?.map((log, idx) => (
                <LogLine key={idx} message={log.message} />
              ))}
            </div>
          </Panel>

          {done && (
            <div className="space-y-3">
              {passed
                ? <SuccessBanner>Eligibility checks passed. Insurance accepted, ZIP is serviceable, and referral is accepted for intake.</SuccessBanner>
                : <WarningBanner>Eligibility checks completed. One or more checks did not pass.</WarningBanner>
              }
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Insurance Accepted" value={String(tinyfishRun?.insurance_accepted)} />
                <Field label="Serviceable ZIP"    value={String(tinyfishRun?.serviceable_zip)} />
                <Field label="Matched Branch"     value={tinyfishRun?.matched_branch} />
                <Field label="Eligibility Status" value={tinyfishRun?.status} />
              </div>
            </div>
          )}
        </div>

        <Panel title="TinyFish Agent Activity">
          <div className="grid gap-4 xl:grid-cols-2">
            {tinyfishRun?.agents?.map((agent) => (
              <AgentCard key={agent.id} agent={agent} showSite showStreamLink />
            ))}
          </div>
        </Panel>
      </div>
    </PageShell>
  )
}