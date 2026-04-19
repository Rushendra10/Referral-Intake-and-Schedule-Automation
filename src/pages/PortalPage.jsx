import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import PageShell from "../components/layout/PageShell"
import { referrals as initialReferrals } from "../data/referrals"

const STATUS_STYLES = {
  "New Referral": "border-blue-200 bg-blue-50 text-blue-700",
  "In Progress":  "border-amber-200 bg-amber-50 text-amber-700",
  "Complete":     "border-green-200 bg-green-50 text-green-700",
}

function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] ?? "border-gray-200 bg-gray-50 text-gray-600"
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cls}`}>
      {status}
    </span>
  )
}

export default function PortalPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState(initialReferrals)
  const [highlightedId, setHighlightedId] = useState(null)

  const sortedRows = useMemo(() => rows, [rows])

  function handleNewReferral() {
    const newReferral = {
      id: `ref-new-${Date.now()}`,
      patientName: "John Doe",
      hospitalName: "UT Southwestern",
      mrn: "MRN-772901",
      status: "New Referral",
      receivedAt: "Just now",
      pdfName: "sample_referral.pdf",
      usesSamplePdf: true,
      details: {
        dob: "1946-10-09",
        insurance: "Aetna Medicare",
        address: null,
        phone: null,
        services: ["PT", "Skilled Nursing"],
        pcp: null,
      },
    }
    setRows((prev) => [newReferral, ...prev])
    setHighlightedId(newReferral.id)
    setTimeout(() => setHighlightedId(null), 3000)
  }

  return (
    <PageShell
      title="Referral Portal"
      subtitle="Incoming referrals from hospital discharge teams. Select a referral to review the packet and begin intake."
      actions={
        <button
          onClick={handleNewReferral}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          New Referral
        </button>
      }
    >
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Header row */}
        <div className="grid grid-cols-[1.4fr_1.3fr_1fr_1fr_1fr] border-b border-gray-100 bg-gray-50 px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          <div>Patient Name</div>
          <div>Hospital</div>
          <div>MRN</div>
          <div>Status</div>
          <div>Received</div>
        </div>

        <AnimatePresence initial={false}>
          {sortedRows.map((row) => (
            <motion.button
              key={row.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate(`/referral/${row.id}`)}
              className={`group grid w-full grid-cols-[1.4fr_1.3fr_1fr_1fr_1fr] items-center border-b border-gray-50 px-6 py-4 text-left transition last:border-b-0 hover:bg-gray-50 ${
                row.id === highlightedId ? "bg-blue-50 ring-1 ring-inset ring-blue-200" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                  {row.patientName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <span className="text-sm font-medium text-gray-900">{row.patientName}</span>
              </div>
              <div className="text-sm text-gray-600">{row.hospitalName}</div>
              <div className="font-mono text-xs text-gray-400">{row.mrn}</div>
              <div><StatusBadge status={row.status} /></div>
              <div className="text-xs text-gray-400">{row.receivedAt}</div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </PageShell>
  )
}