import { motion } from "framer-motion"

// ── Status badge classes (light theme) ──────────────────────────────────────
export function statusClasses(status) {
  if (status === "complete") return "bg-green-50 text-green-700 border border-green-200"
  if (status === "running")  return "bg-blue-50 text-blue-700 border border-blue-200"
  if (status === "failed")   return "bg-red-50 text-red-700 border border-red-200"
  return "bg-gray-100 text-gray-500 border border-gray-200"
}

// ── Error banner ─────────────────────────────────────────────────────────────
export function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  )
}

// ── Key–value field ──────────────────────────────────────────────────────────
export function Field({ label, value, missing }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</div>
      <div className={`mt-1.5 text-sm font-medium ${missing || !value ? "text-amber-600" : "text-gray-900"}`}>
        {value || "Missing / incomplete"}
      </div>
    </div>
  )
}

// ── Section wrapper ──────────────────────────────────────────────────────────
export function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">{title}</div>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </div>
  )
}

// ── Panel wrapper (sidebar / main) ───────────────────────────────────────────
export function Panel({ title, children }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">{title}</div>
      {children}
    </div>
  )
}

// ── Log line ─────────────────────────────────────────────────────────────────
export function LogLine({ message }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm text-gray-700">
      {message}
    </div>
  )
}

// ── Agent card ───────────────────────────────────────────────────────────────
export function AgentCard({ agent, showSite = false, showStreamLink = false }) {
  return (
    <motion.div layout className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-gray-900">{agent.name}</div>
          <div className="mt-0.5 text-xs text-gray-400">{agent.goal}</div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusClasses(agent.status)}`}>
          {agent.status}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {showSite && (
          <DataBlock label="Website" value={agent.site} mono />
        )}
        <DataBlock label="Current task" value={agent.current_task} />
        <DataBlock label="Observation"  value={agent.observation}  />
        <DataBlock label="Action"       value={agent.action}       />

        {agent.updates?.length > 0 && (
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Recent updates</div>
            <div className="space-y-1">
              {agent.updates.map((u, idx) => (
                <div key={idx} className="text-xs text-gray-600">– {u}</div>
              ))}
            </div>
          </div>
        )}

        {showStreamLink && agent.streaming_url && (
          <a
            href={agent.streaming_url}
            target="_blank"
            rel="noreferrer"
            className="block rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 transition"
          >
            Open TinyFish Live Browser
          </a>
        )}

        {showSite && (
          <a
            href={agent.site}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition"
          >
            Open Target Page
          </a>
        )}
      </div>
    </motion.div>
  )
}

function DataBlock({ label, value, mono }) {
  if (!value) return null
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</div>
      <div className={`mt-1 text-xs text-gray-700 ${mono ? "break-all font-mono" : ""}`}>{value}</div>
    </div>
  )
}

// ── Primary CTA button ────────────────────────────────────────────────────────
export function PrimaryButton({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  )
}

// ── Secondary (ghost) button ──────────────────────────────────────────────────
export function SecondaryButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
    >
      {children}
    </button>
  )
}

// ── Success banner ────────────────────────────────────────────────────────────
export function SuccessBanner({ children }) {
  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
      <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2.5 7.5L5.5 10.5L11.5 4.5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{children}</span>
    </div>
  )
}

// ── Warning banner ────────────────────────────────────────────────────────────
export function WarningBanner({ children }) {
  return (
    <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      {children}
    </div>
  )
}

// ── Info banner ───────────────────────────────────────────────────────────────
export function InfoBanner({ children }) {
  return (
    <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
      {children}
    </div>
  )
}
