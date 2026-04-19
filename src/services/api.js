// All paths are relative — Vite proxies /api and /files to http://localhost:8000
// so these work whether you hit port 5173 (Vite) or 8000 (backend) directly.

export async function processSampleDocument() {
  const res = await fetch(`/api/documents/process-sample`, {
    method: "POST",
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function processUploadedDocument(file) {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`/api/documents/process`, {
    method: "POST",
    body: formData,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getRun(runId) {
  const res = await fetch(`/api/runs/${runId}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function startTinyfishEligibility({ runId, insuranceProvider, zipCode }) {
  const res = await fetch(`/api/tinyfish/eligibility/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      run_id: runId,
      insurance_provider: insuranceProvider || null,
      zip_code: zipCode || null,
    }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function startTinyfishPlacement({ runId }) {
  const res = await fetch(`/api/tinyfish/placement/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ run_id: runId }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function startTinyfishSchedule({ runId }) {
  const res = await fetch(`/api/tinyfish/schedule/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ run_id: runId }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getTinyfishRun(tinyfishRunId) {
  const res = await fetch(`/api/tinyfish/runs/${tinyfishRunId}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

/** Check if the Python backend is reachable */
export async function checkBackendHealth() {
  try {
    const res = await fetch("/health", { signal: AbortSignal.timeout(2000) })
    return res.ok
  } catch {
    return false
  }
}