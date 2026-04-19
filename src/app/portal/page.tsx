"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell } from "@/components/app/page-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { referrals as initialReferrals } from "@/lib/data/referrals";
import type { ReferralDetail } from "@/lib/types";
import { Plus } from "lucide-react";

export default function PortalPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ReferralDetail[]>(initialReferrals);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  function handleNewReferral() {
    const id = `ref-new-${Date.now()}`;
    const newReferral: ReferralDetail = {
      id,
      patientName: "Evelyn Brooks",
      hospitalName: "UT Southwestern",
      mrn: "MRN-772901",
      status: "New Referral",
      receivedAt: new Date().toISOString(),
      pdfName: "evelyn_brooks_referral.pdf",
      pdfUrl: "/documents/evelyn_brooks_referral.pdf",
      knownFields: {
        dob: "1946-10-09",
        insurance: "Aetna Medicare Advantage Gold",
        address: null,
        phone: null,
        services: ["PT", "Skilled Nursing"],
        pcp: null,
      },
      packetText:
        "Referral Packet — Evelyn Brooks. Discharge from UT Southwestern. Insurance: Aetna Medicare Advantage Gold. Services: PT, Skilled Nursing.",
    };

    setRows((prev) => [newReferral, ...prev]);
    setHighlightedId(id);
    setTimeout(() => setHighlightedId(null), 3500);
  }

  return (
    <PageShell
      title="Referral Portal"
      subtitle="Incoming referrals from hospital discharge teams. Select a referral to review the packet and begin intake."
      currentStep={1}
      actions={
        <button
          onClick={handleNewReferral}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
        >
          <Plus className="h-4 w-4" />
          New Referral
        </button>
      }
    >
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950">
        {/* Table header */}
        <div className="grid grid-cols-[1.3fr_1.3fr_1fr_1fr_1fr] border-b border-white/10 bg-zinc-900/70 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          <div>Patient Name</div>
          <div>Hospital</div>
          <div>MRN</div>
          <div>Status</div>
          <div>Received</div>
        </div>

        <AnimatePresence initial={false}>
          {rows.map((row) => {
            const highlighted = row.id === highlightedId;

            return (
              <motion.button
                key={row.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => router.push(`/referral/${row.id}`)}
                className={`grid w-full grid-cols-[1.3fr_1.3fr_1fr_1fr_1fr] border-b border-white/5 px-6 py-5 text-left transition ${
                  highlighted
                    ? "bg-cyan-400/10 ring-1 ring-inset ring-cyan-300/50"
                    : "bg-transparent hover:bg-white/5"
                }`}
              >
                <div className="font-medium">{row.patientName}</div>
                <div className="text-zinc-300">{row.hospitalName}</div>
                <div className="font-mono text-xs text-zinc-400">{row.mrn}</div>
                <div>
                  <StatusBadge
                    variant={
                      row.status === "New Referral"
                        ? "new"
                        : row.status === "Ready for Placement"
                        ? "complete"
                        : "pending"
                    }
                    label={row.status}
                  />
                </div>
                <div className="text-xs text-zinc-400">
                  {row.receivedAt === "Just now"
                    ? "Just now"
                    : new Date(row.receivedAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </PageShell>
  );
}
