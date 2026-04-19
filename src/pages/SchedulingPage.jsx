import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import PageShell from "../components/layout/PageShell"
import { getRun, getTinyfishRun, startTinyfishSchedule } from "../services/api"
import { Field, Panel, LogLine, AgentCard, ErrorBanner, PrimaryButton, SuccessBanner } from "../components/layout/ui"

export default function SchedulingPage() {
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

    async function beginSchedule() {
      try {
        const start = await startTinyfishSchedule({ runId })
        setTinyfishRunId(start.tinyfish_run_id)

        async function fetchScheduleRun() {
          try {
            const data = await getTinyfishRun(start.tinyfish_run_id)
            setTinyfishRun(data)
            if (data.status === "complete" || data.status === "failed") {
              if (intervalId) clearInterval(intervalId)
            }
          } catch (err) {
            setError(err.message || "Failed to fetch TinyFish scheduling run.")
            if (intervalId) clearInterval(intervalId)
          }
        }

        await fetchScheduleRun()
        intervalId = setInterval(fetchScheduleRun, 1500)
      } catch (err) {
        setError(err.message || "Failed to start TinyFish scheduling.")
      }
    }

    beginSchedule()
    return () => { if (intervalId) clearInterval(intervalId) }
  }, [runId])

  const done = tinyfishRun?.status === "complete"

  return (
    <PageShell
      title="TinyFish Scheduling"
      subtitle="TinyFish is matching the patient to a nurse, choosing a slot, and initializing outreach."
      actions={
        done && (
          <PrimaryButton
            onClick={() => navigate(`/complete/${runId}`, { state: { schedulingResult: tinyfishRun } })}
          >
            Complete Demo
          </PrimaryButton>
        )
      }
    >
      <ErrorBanner message={error} />

      <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-5">
          <Panel title="Scheduling Context">
            <div className="space-y-3">
              <Field label="Patient"           value={documentRun?.referral?.patient_name} />
              <Field label="ZIP"               value={documentRun?.referral?.zip_code} />
              <Field label="Services Required" value={documentRun?.referral?.services_required?.join(", ")} />
              <Field label="TinyFish Run ID"   value={tinyfishRunId || "Starting..."} />
            </div>
          </Panel>

          <Panel title="Scheduling Event Stream">
            <div className="space-y-2">
              {tinyfishRun?.logs?.map((log, idx) => (
                <LogLine key={idx} message={log.message} />
              ))}
            </div>
          </Panel>

          {done && (
            <div className="space-y-3">
              <SuccessBanner>Scheduling complete. Nurse assigned and outreach initialized.</SuccessBanner>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Assigned Nurse"    value={tinyfishRun?.assigned_nurse} />
                <Field label="Visit Slot"        value={tinyfishRun?.scheduled_slot} />
                <Field label="Call Initialized"  value={String(tinyfishRun?.call_initialized)} />
                <Field label="Scheduling Status" value={tinyfishRun?.status} />
              </div>
            </div>
          )}
        </div>

        <Panel title="TinyFish Scheduling Activity">
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