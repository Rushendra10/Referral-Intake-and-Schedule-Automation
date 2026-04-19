import { useNavigate, useLocation } from "react-router-dom"
import { motion } from "framer-motion"

const STEPS = [
  { label: "Portal", path: "/portal" },
  { label: "Referral", path: "/referral" },
  { label: "Processing", path: "/processing" },
  { label: "Review", path: "/review" },
  { label: "Eligibility", path: "/eligibility" },
  { label: "Scheduling", path: "/schedule" },
  { label: "Complete", path: "/complete" },
]

function Logo({ navigate }) {
  return (
    <button onClick={() => navigate("/")} className="flex items-center gap-2 group">
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 2L20 7V15L11 20L2 15V7L11 2Z" stroke="#2563eb" strokeWidth="1.6" fill="#eff6ff" />
        <circle cx="11" cy="11" r="2.5" fill="#2563eb" />
      </svg>
      <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
        RISA AI
      </span>
    </button>
  )
}

function StepBreadcrumb({ pathname }) {
  const activeIdx = STEPS.findLastIndex((s) => pathname.startsWith(s.path))
  if (activeIdx < 0) return null

  return (
    <div className="hidden items-center gap-0.5 md:flex">
      {STEPS.map((step, idx) => {
        const isActive = idx === activeIdx
        const isDone = idx < activeIdx
        const isFuture = idx > activeIdx
        return (
          <div key={step.label} className="flex items-center gap-0.5">
            {idx > 0 && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                <path d="M4 2.5L7.5 6L4 9.5" stroke={isDone ? "#2563eb" : "#d1d5db"} strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            )}
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium
              ${isActive ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200" : ""}
              ${isDone ? "text-blue-500" : ""}
              ${isFuture ? "text-gray-300" : ""}
            `}>
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function PageShell({ title, subtitle, children, actions }) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-13 max-w-7xl items-center justify-between gap-6 px-6 py-3">
          <Logo navigate={navigate} />
          <StepBreadcrumb pathname={location.pathname} />
          <span className="hidden rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-600 sm:inline-flex">
            TinyFish Powered
          </span>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-7 flex items-start justify-between gap-6"
        >
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
            {subtitle && (
              <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{subtitle}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-7xl border-t border-gray-100 px-6 py-4">
        <p className="text-[11px] text-gray-400">RISA AI — Agentic Referral Intake · Powered by TinyFish</p>
      </footer>
    </div>
  )
}