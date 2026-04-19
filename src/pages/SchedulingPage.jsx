import { useEffect, useState } from "react"
import PageShell from "../components/layout/PageShell"

const initial = [
  { name: "Patient Outreach Agent", status: "running" },
  { name: "Call Scheduling Agent", status: "queued" },
  { name: "Nurse Availability Agent", status: "queued" },
  { name: "Assignment Agent", status: "queued" },
]

export default function SchedulingPage() {
  const [agents, setAgents] = useState(initial)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const timers = []

    timers.push(
      setTimeout(() => {
        setAgents((prev) =>
          prev.map((a) =>
            a.name === "Patient Outreach Agent"
              ? { ...a, status: "complete" }
              : a.name === "Call Scheduling Agent"
              ? { ...a, status: "running" }
              : a
          )
        )
      }, 1400)
    )

    timers.push(
      setTimeout(() => {
        setAgents((prev) =>
          prev.map((a) =>
            a.name === "Call Scheduling Agent"
              ? { ...a, status: "complete" }
              : a.name === "Nurse Availability Agent"
              ? { ...a, status: "running" }
              : a
          )
        )
      }, 2600)
    )

    timers.push(
      setTimeout(() => {
        setAgents((prev) =>
          prev.map((a) =>
            a.name === "Nurse Availability Agent"
              ? { ...a, status: "complete" }
              : a.name === "Assignment Agent"
              ? { ...a, status: "running" }
              : a
          )
        )
      }, 3800)
    )

    timers.push(
      setTimeout(() => {
        setAgents((prev) => prev.map((a) => ({ ...a, status: "complete" })))
        setDone(true)
      }, 5200)
    )

    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <PageShell
      title="Scheduling Initialization"
      subtitle="Patient outreach, nurse availability matching, and visit initialization are being coordinated."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
          <div className="mb-4 text-sm font-medium">Scheduling Agents</div>
          <div className="space-y-4">
            {agents.map((agent) => (
              <div
                key={agent.name}
                className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4"
              >
                <div className="flex items-center justify-between">
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
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
          <div className="mb-4 text-sm font-medium">Outcome</div>

          {done ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-emerald-200">
                Scheduling initialization complete.
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 text-sm">
                <div className="mb-2 font-medium">Assigned Nurse</div>
                <div className="text-zinc-300">Sarah Nguyen, RN</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 text-sm">
                <div className="mb-2 font-medium">Tentative Visit Slot</div>
                <div className="text-zinc-300">Tomorrow, 10:30 AM</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 text-sm">
                <div className="mb-2 font-medium">Status</div>
                <div className="text-zinc-300">Awaiting patient confirmation</div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 text-sm text-zinc-400">
              Waiting for all scheduling agents to finish.
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}