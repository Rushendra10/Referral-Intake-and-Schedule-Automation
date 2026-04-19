"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api/client";
import type { ReferralSummary } from "@/lib/types/referrals";
import { formatRelativeTimestamp } from "@/lib/utils";

export function PortalTableClient({ initialReferrals }: { initialReferrals: ReferralSummary[] }) {
  const [rows, setRows] = useState(initialReferrals);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  async function handleNewReferral() {
    setIsCreating(true);
    try {
      const next = await apiFetch<ReferralSummary>("/api/referrals/new-demo", { method: "POST" });
      setRows((prev) => [next, ...prev]);
      setHighlightedId(next.id);
      router.refresh();
      window.setTimeout(() => setHighlightedId(null), 2600);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <>
      <div className="mb-5 flex justify-end">
        <button
          onClick={handleNewReferral}
          disabled={isCreating}
          className="rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCreating ? "Adding Referral..." : "New Referral"}
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950">
        <div className="grid grid-cols-[1.3fr_1.3fr_1fr_1fr_1fr] border-b border-white/10 bg-zinc-900/70 px-6 py-4 text-sm font-semibold text-zinc-300">
          <div>Patient Name</div>
          <div>Hospital</div>
          <div>MRN</div>
          <div>Status</div>
          <div>Received</div>
        </div>

        {rows.map((row) => {
          const highlighted = row.id === highlightedId;

          return (
            <Link
              key={row.id}
              href={`/referral/${row.id}`}
              className={`grid grid-cols-[1.3fr_1.3fr_1fr_1fr_1fr] border-b border-white/5 px-6 py-5 text-left transition ${
                highlighted
                  ? "bg-cyan-400/10 ring-1 ring-inset ring-cyan-300/50"
                  : "bg-transparent hover:bg-white/5"
              }`}
            >
              <div className="font-medium">{row.patientName}</div>
              <div className="text-zinc-300">{row.hospitalName}</div>
              <div className="text-zinc-400">{row.mrn}</div>
              <div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                  {row.status}
                </span>
              </div>
              <div className="text-zinc-400">{formatRelativeTimestamp(row.receivedAt)}</div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

