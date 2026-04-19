"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Accepted insurance table — the page TinyFish browses during eligibility checks.
 * Data matches ACCEPTED_INSURANCE and MANUAL_REVIEW_INSURANCE in engine.ts.
 */

type InsuranceStatus = "accepted" | "not_accepted" | "manual_review";

const INSURANCE_DATA: {
  payer: string;
  plan: string;
  status: InsuranceStatus;
  notes: string;
}[] = [
  {
    payer: "Aetna Medicare",
    plan: "Aetna Medicare Advantage Gold",
    status: "accepted",
    notes: "Full coverage, no prior auth required",
  },
  {
    payer: "Aetna Medicare",
    plan: "Aetna Medicare Advantage Silver",
    status: "accepted",
    notes: "Full coverage, no prior auth required",
  },
  {
    payer: "UnitedHealthcare",
    plan: "UnitedHealthcare Medicare Advantage",
    status: "accepted",
    notes: "Full coverage",
  },
  {
    payer: "UnitedHealthcare",
    plan: "UnitedHealthcare Community Plan",
    status: "manual_review",
    notes: "Accepted — requires prior authorization",
  },
  {
    payer: "UnitedHealthcare",
    plan: "UnitedHealthcare Dual Complete",
    status: "manual_review",
    notes: "Accepted — requires prior authorization and care coordinator sign-off",
  },
  {
    payer: "Medicare",
    plan: "Medicare Part A",
    status: "accepted",
    notes: "Traditional Medicare, fully accepted",
  },
  {
    payer: "Medicare",
    plan: "Medicare Part B",
    status: "accepted",
    notes: "Traditional Medicare, fully accepted",
  },
  {
    payer: "Cigna",
    plan: "Cigna Medicare Advantage",
    status: "accepted",
    notes: "Full coverage",
  },
  {
    payer: "Cigna",
    plan: "Cigna Connect",
    status: "manual_review",
    notes: "Requires care management review",
  },
  {
    payer: "Humana",
    plan: "Humana Gold Plus HMO",
    status: "not_accepted",
    notes: "Not in current network — refer to partner agencies",
  },
  {
    payer: "Humana",
    plan: "Humana Honor Health Plan",
    status: "not_accepted",
    notes: "Not contracted",
  },
  {
    payer: "Blue Cross Blue Shield",
    plan: "BCBS BlueChoice PPO",
    status: "not_accepted",
    notes: "Network contract expired 2025-Q4",
  },
  {
    payer: "Blue Cross Blue Shield",
    plan: "BCBS Blue Advantage HMO",
    status: "not_accepted",
    notes: "Not in current network",
  },
  {
    payer: "Molina Healthcare",
    plan: "Molina Dual Options",
    status: "not_accepted",
    notes: "Not contracted",
  },
];

const statusConfig: Record<
  InsuranceStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  accepted: {
    label: "Accepted",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className: "text-green-700",
  },
  not_accepted: {
    label: "Not Accepted",
    icon: <XCircle className="h-3.5 w-3.5" />,
    className: "text-red-600",
  },
  manual_review: {
    label: "Manual Review",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    className: "text-amber-600",
  },
};

export default function AcceptedInsuranceClient({ highlight }: { highlight?: string }) {
  const normalizedHighlight = highlight?.toLowerCase();

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-zinc-800">
      {/* Agency header */}
      <div className="border-b border-zinc-200 bg-white px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-bold">
            TF
          </div>
          <div>
            <div className="text-sm font-bold text-zinc-800">SunCare Home Health</div>
            <div className="text-xs text-zinc-500">Agency Management Portal</div>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            System Online
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-8 py-8">
        <div className="mb-6 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          <div>
            <h1 className="text-lg font-bold text-zinc-800">Accepted Insurance Plans</h1>
            <p className="text-sm text-zinc-500">
              Active payer contracts and authorization requirements for SunCare Home Health.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: "Accepted Plans", value: INSURANCE_DATA.filter((r) => r.status === "accepted").length },
            { label: "Manual Review", value: INSURANCE_DATA.filter((r) => r.status === "manual_review").length },
            { label: "Not Accepted", value: INSURANCE_DATA.filter((r) => r.status === "not_accepted").length },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-zinc-200 bg-white p-4 text-center">
              <div className="text-2xl font-bold text-zinc-800">{stat.value}</div>
              <div className="text-xs text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-200 bg-zinc-50 hover:bg-zinc-50">
                <TableHead className="text-zinc-600">Payer</TableHead>
                <TableHead className="text-zinc-600">Plan Name</TableHead>
                <TableHead className="text-zinc-600">Status</TableHead>
                <TableHead className="text-zinc-600">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {INSURANCE_DATA.map((row, idx) => {
                const isHighlighted =
                  normalizedHighlight &&
                  (row.payer.toLowerCase().includes(normalizedHighlight) ||
                    row.plan.toLowerCase().includes(normalizedHighlight));
                const statusCfg = statusConfig[row.status];

                return (
                  <TableRow
                    key={idx}
                    className={`border-zinc-100 ${
                      isHighlighted ? "bg-amber-50" : "bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <TableCell className="font-medium text-zinc-800">
                      {isHighlighted ? (
                        <motion.span
                          initial={{ backgroundColor: "transparent" }}
                          animate={{ backgroundColor: ["#fef3c7", "#fbbf24", "#fef3c7"] }}
                          transition={{ duration: 1.5, repeat: 2 }}
                          className="inline-block rounded px-1"
                        >
                          {row.payer}
                        </motion.span>
                      ) : (
                        row.payer
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-600">{row.plan}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${statusCfg.className}`}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">{row.notes}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-700">
          ⚠ This is a simulated agency operational page for demonstration purposes only.
        </div>
      </div>
    </div>
  );
}
