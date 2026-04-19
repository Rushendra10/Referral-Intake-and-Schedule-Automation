import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useNavigate, useParams } from "react-router-dom"
import PageShell from "../components/layout/PageShell"
import { getRun } from "../services/api"
import { Panel, LogLine, AgentCard, ErrorBanner, PrimaryButton } from "../components/layout/ui"

const PROGRESS_LABELS = [
  "Queued",
  "Packet loaded",
  "OCR / text extraction",
  "LLM extraction",
  "Validation",
  "Complete",
]

export default function ProcessingPage() {
  const { id: runId } = useParams()
  const navigate = useNavigate()

  const [run, setRun] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let intervalId

    async function fetchRun() {
      try {
        const data = await getRun(runId)
        setRun(data)
        if (data.status === "complete" || data.status === "failed") {
          if (intervalId) clearInterval(intervalId)
        }
      } catch (err) {
        setError(err.message || "Failed to fetch workflow status.")
        if (intervalId) clearInterval(intervalId)
      }
    }

    fetchRun()
    intervalId = setInterval(fetchRun, 1500)
    return () => { if (intervalId) clearInterval(intervalId) }
  }, [runId])

  const done = run?.status === "complete"

  return (
    <PageShell
      title="Document Processing"
      subtitle="The referral packet is being analyzed, extracted into structured fields, and validated before downstream operational workflows begin."
      actions={
        done && (
          <PrimaryButton onClick={() => navigate(`/review/${runId}`)}>
            Next: Review Extracted Referral
          </PrimaryButton>
        )
      }
    >
      <ErrorBanner message={error} />
      {run?.status === "failed" && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Workflow failed: {run.error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-5">
          {/* Packet summary */}
          <Panel title="Packet Summary">
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-400">File:</span> <span className="text-gray-800">{run?.file_name || "Loading..."}</span></div>
              <div><span className="text-gray-400">Document type:</span> <span className="text-gray-800">{run?.document_type || "Detecting..."}</span></div>
              <div><span className="text-gray-400">Stage:</span> <span className="text-gray-800">{run?.current_stage || "Queued"}</span></div>
              <div><span className="text-gray-400">Status:</span> <span className="text-gray-800">{run?.status || "Queued"}</span></div>
            </div>
          </Panel>

          {/* Pipeline steps */}
          <Panel title="Document Pipeline Progress">
            <div className="space-y-2">
              {PROGRESS_LABELS.map((label, idx) => {
                const active = run ? idx <= run.progress : idx === 0
                return (
                  <div
                    key={label}
                    className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                      active
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-gray-100 bg-gray-50 text-gray-400"
                    }`}
                  >
                    {label}
                  </div>
                )
              })}
            </div>
          </Panel>

          {/* Log stream */}
          <Panel title="Document Event Stream">
            <div className="space-y-2">
              {run?.logs?.map((log, idx) => (
                <LogLine key={idx} message={log.message} />
              ))}
            </div>
          </Panel>

          {done && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Document understanding complete. Structured referral is ready for operational checks.
            </div>
          )}
        </div>

        {/* Agent activity */}
        <Panel title="Agent Activity">
          <div className="grid gap-4 xl:grid-cols-2">
            {run?.agents?.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </Panel>
      </div>
    </PageShell>
  )
}