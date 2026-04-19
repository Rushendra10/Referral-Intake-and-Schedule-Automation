import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import PageShell from "../components/layout/PageShell"
import { getRun, getTinyfishRun, startTinyfishPlacement } from "../services/api"
import { Field, Panel, LogLine, AgentCard, ErrorBanner, PrimaryButton, SuccessBanner, WarningBanner } from "../components/layout/ui"

export default function PlacementPage() {
  const { id: runId } = useParams()
  const navigate = useNavigate()

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

    async function beginPlacement() {
      try {
        const start = await startTinyfishPlacement({ runId })
        setTinyfishRunId(start.tinyfish_run_id)

        async function fetchPlacementRun() {
          try {
            const data = await getTinyfishRun(start.tinyfish_run_id)
            setTinyfishRun(data)
            if (data.status === "complete" || data.status === "failed") {
              if (intervalId) clearInterval(intervalId)
            }
          } catch (err) {
            setError(err.message || "Failed to fetch TinyFish placement run.")
            if (intervalId) clearInterval(intervalId)
          }
        }

        await fetchPlacementRun()
        intervalId = setInterval(fetchPlacementRun, 1500)
      } catch (err) {
        setError(err.message || "Failed to start TinyFish placement.")
      }
    }

    beginPlacement()
    return () => { if (intervalId) clearInterval(intervalId) }
  }, [runId])

  const done = tinyfishRun?.status === "complete"

  return (
    <PageShell
      title="Referral Placement"
      subtitle="TinyFish is submitting the referral into the placement workflow."
      actions={
        done && (
          <PrimaryButton onClick={() => navigate(`/schedule/${runId}`)}>
            Schedule Visit
          </PrimaryButton>
        )
      }
    >
      <ErrorBanner message={error} />

      <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-5">
          <Panel title="Placement Context">
            <div className="space-y-3">
              <Field label="Patient"        value={documentRun?.referral?.patient_name} />
              <Field label="Insurance"      value={documentRun?.referral?.insurance_provider} />
              <Field label="ZIP"            value={documentRun?.referral?.zip_code} />
              <Field label="Services"       value={documentRun?.referral?.services_required?.join(", ")} />
              <Field label="TinyFish Run ID" value={tinyfishRunId || "Starting..."} />
            </div>
          </Panel>

          <Panel title="Placement Event Stream">
            <div className="space-y-2">
              {tinyfishRun?.logs?.map((log, idx) => (
                <LogLine key={idx} message={log.message} />
              ))}
            </div>
          </Panel>

          {done && (
            tinyfishRun?.placement_submitted
              ? <SuccessBanner>Placement complete. Referral submitted successfully.</SuccessBanner>
              : <WarningBanner>Placement workflow completed, but submission was not confirmed.</WarningBanner>
          )}
        </div>

        <Panel title="TinyFish Placement Activity">
          <div className="grid gap-4">
            {tinyfishRun?.agents?.map((agent) => (
              <AgentCard key={agent.id} agent={agent} showSite />
            ))}
          </div>
        </Panel>
      </div>
    </PageShell>
  )
}