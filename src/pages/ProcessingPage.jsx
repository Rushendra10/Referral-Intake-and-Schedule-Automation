import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useNavigate, useParams } from "react-router-dom"
import PageShell from "../components/layout/PageShell"

const steps = [
  "Referral packet received",
  "Eligibility checks in progress",
  "Extraction agents running",
  "Cross-validation complete",
  "Referral ready for placement",
]

const initialAgents = [
  { name: "Insurance Eligibility Agent", status: "running" },
  { name: "ZIP Serviceability Agent", status: "running" },
  { name: "Demographics Extraction Agent", status: "queued" },
  { name: "Clinical Services Agent", status: "queued" },
  { name: "Physician Extraction Agent", status: "queued" },
  { name: "Contact Validation Agent", status: "queued" },
  { name: "Cross-Field Validator", status: "queued" },
]

export default function ProcessingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [progress, setProgress] = useState(1)
  const [agents, setAgents] = useState(initialAgents)
  const [logs, setLogs] = useState([
    "Referral packet loaded.",
    "Spawning Insurance Eligibility Agent.",
    "Spawning ZIP Serviceability Agent.",
  ])

  useEffect(() => {
    const timers = []

    timers.push(
      setTimeout(() => {
        setLogs((prev) => [...prev, "Insurance eligibility verified."])
        setAgents((prev) =>
          prev.map((a) =>
            a.name === "Insurance Eligibility Agent"
              ? { ...a, status: "complete" }
              : a
          )
        )
      }, 1500)
    )

    timers.push(
      setTimeout(() => {
        setLogs((prev) => [...prev, "ZIP is within service area."])
        setAgents((prev) =>
          prev.map((a) =>
            a.name === "ZIP Serviceability Agent"
              ? { ...a, status: "complete" }
              : a.name.includes("Extraction") || a.name.includes("Validation") || a.name === "Clinical Services Agent"
              ? { ...a, status: "running" }
              : a
          )
        )
        setProgress(2)
      }, 2600)
    )

    timers.push(
      setTimeout(() => {
        setLogs((prev) => [
          ...prev,
          "Patient demographics extracted.",
          "Ordered services identified: PT, OT, Skilled Nursing.",
          "Primary physician candidate found.",
        ])
        setProgress(3)
      }, 4200)
    )

    timers.push(
      setTimeout(() => {
        setAgents((prev) =>
          prev.map((a) => ({ ...a, status: "complete" }))
        )
        setLogs((prev) => [
          ...prev,
          "Cross-field consistency verified.",
          "Referral package extraction complete.",
        ])
        setProgress(4)
      }, 6000)
    )

    timers.push(
      setTimeout(() => {
        setProgress(5)
      }, 7200)
    )

    timers.push(
      setTimeout(() => {
        navigate(`/result/${id}`)
      }, 8500)
    )

    return () => timers.forEach(clearTimeout)
  }, [id, navigate])

  return (
    <PageShell
      title="Agentic Processing"
      subtitle="Specialized agents are validating eligibility, extracting referral data, and preparing the packet for placement."
    >
      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
          <div className="mb-4 text-sm font-medium">Packet Thumbnail</div>
          <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-zinc-900 text-zinc-500">
            PDF thumbnail / preview
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
            <div className="mb-4 text-sm font-medium">Workflow Progress</div>
            <div className="grid gap-3 md:grid-cols-5">
              {steps.map((step, idx) => {
                const active = idx < progress
                return (
                  <div
                    key={step}
                    className={`rounded-2xl border p-4 text-xs ${
                      active
                        ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-200"
                        : "border-white/10 bg-zinc-900 text-zinc-500"
                    }`}
                  >
                    {step}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
            <div className="mb-4 text-sm font-medium">Active Agents</div>
            <div className="grid gap-4 md:grid-cols-2">
              {agents.map((agent) => (
                <motion.div
                  key={agent.name}
                  layout
                  className="rounded-2xl border border-white/10 bg-zinc-900/80 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium">{agent.name}</div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        agent.status === "complete"
                          ? "bg-emerald-400/15 text-emerald-300"
                          : agent.status === "running"
                          ? "bg-cyan-400/15 text-cyan-300"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {agent.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
            <div className="mb-4 text-sm font-medium">Agent Event Stream</div>
            <div className="space-y-3">
              {logs.map((log, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-white/5 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-300"
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}