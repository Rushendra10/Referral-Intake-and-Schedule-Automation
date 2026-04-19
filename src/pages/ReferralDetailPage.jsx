import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import PageShell from "../components/layout/PageShell"
import { referrals } from "../data/referrals"
import { processSampleDocument, checkBackendHealth } from "../services/api"
import { Field, ErrorBanner, PrimaryButton } from "../components/layout/ui"

export default function ReferralDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")
  const [backendUp, setBackendUp] = useState(null) // null = checking

  const referral = useMemo(
    () => referrals.find((r) => r.id === id) || referrals[0],
    [id]
  )

  // Relative path — served by Vite proxy → backend /files/
  const pdfUrl = `/files/${referral.pdfName}`

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth().then(setBackendUp)
  }, [])

  async function handleProcess() {
    try {
      setProcessing(true)
      setError("")
      const result = await processSampleDocument()
      navigate(`/processing/${result.run_id}`)
    } catch (err) {
      setError(
        err.message?.includes("fetch")
          ? "Cannot reach the backend. Make sure the Python server is running: cd backend && uvicorn app:app --reload"
          : err.message || "Failed to process document."
      )
    } finally {
      setProcessing(false)
    }
  }

  return (
    <PageShell
      title={`Referral — ${referral.patientName}`}
      subtitle="Review the incoming packet and available intake fields before starting extraction."
      actions={
        <PrimaryButton onClick={handleProcess} disabled={processing || backendUp === false}>
          {processing ? "Processing..." : "Process / Extract"}
        </PrimaryButton>
      }
    >
      {/* Backend status banner */}
      {backendUp === false && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Backend not running.</strong> Start the Python server to enable extraction:
          <code className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-mono">
            cd backend &amp;&amp; uvicorn app:app --reload
          </code>
        </div>
      )}
      {backendUp === true && (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Backend connected — ready to process.
        </div>
      )}

      <ErrorBanner message={error} />

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Left: fields */}
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <Field label="Patient Name" value={referral.patientName} />
          <Field label="Hospital"     value={referral.hospitalName} />
          <Field label="MRN"          value={referral.mrn} />
          <Field label="DOB"          value={referral.details.dob} />
          <Field label="Insurance"    value={referral.details.insurance} />
          <Field label="Address"      value={referral.details.address} />
          <Field label="Phone"        value={referral.details.phone} />
          <Field label="Services"     value={referral.details.services?.join(", ")} />
          <Field label="PCP"          value={referral.details.pcp} />

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Attached Packet</div>
            <div className="mt-1.5 text-xs text-gray-500">
              Sample PDF: <span className="font-mono">{referral.pdfName}</span>
            </div>
          </div>
        </div>

        {/* Right: PDF preview */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Referral Packet Preview</div>
              <div className="mt-0.5 font-mono text-xs text-gray-400">{referral.pdfName}</div>
            </div>
            <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] text-gray-400">
              PDF
            </span>
          </div>

          {backendUp === false ? (
            /* Backend is down — show a clear placeholder instead of a broken iframe */
            <div className="flex h-[640px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M9 4h12l9 9v19a2 2 0 01-2 2H9a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="#d1d5db" strokeWidth="1.5" fill="none" />
                <path d="M21 4v9h9" stroke="#d1d5db" strokeWidth="1.5" />
                <path d="M13 17h10M13 21h8M13 25h6" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <div>
                <div className="text-sm font-medium text-gray-500">{referral.pdfName}</div>
                <div className="mt-1 text-xs text-gray-400">
                  PDF preview requires the backend server to be running.
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-100">
              <object data={pdfUrl} type="application/pdf" className="h-[640px] w-full">
                <embed src={pdfUrl} type="application/pdf" className="h-[640px] w-full" />
                <div className="flex h-[640px] flex-col items-center justify-center gap-3 text-sm text-gray-400">
                  <span>Unable to preview PDF inline.</span>
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-blue-600 hover:bg-gray-50"
                  >
                    Open PDF in new tab
                  </a>
                </div>
              </object>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}