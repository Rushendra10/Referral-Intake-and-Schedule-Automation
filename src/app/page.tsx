import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/app/page-shell";

export const metadata = {
  title: "ReferralIQ — Agentic Home Health Referral Intake",
  description:
    "AI-powered home health referral intake: LangGraph PDF extraction + TinyFish browser automation for eligibility and scheduling.",
};

const stats = [
  { label: "U.S. healthcare economy", value: "$5T+" },
  { label: "Home health referrals processed yearly", value: "Millions" },
  { label: "Referrals delayed by missing data", value: "High" },
  { label: "Manual intake time per packet", value: "30–60 min" },
];

export default function LandingPage() {
  return (
    <PageShell
      title="Agentic Referral Intake for Home Health"
      subtitle="From messy discharge packets to structured referral placement, eligibility verification, and scheduling initialization."
      actions={
        <Link
          href="/portal"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
        >
          Start Demo
          <ArrowRight className="h-4 w-4" />
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Hero card */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8 shadow-2xl">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm uppercase tracking-[0.2em] text-cyan-400">
              Intake automation
            </p>
            <h2 className="text-5xl font-semibold leading-tight">
              Home health referral processing built for speed, accuracy, and operational scale.
            </h2>
            <p className="mt-5 text-lg leading-8 text-zinc-400">
              Referral packets arrive incomplete, inconsistent, and delayed. Our system extracts
              critical intake data, runs TinyFish browser checks against agency portals, and prepares referrals for
              placement with agentic orchestration.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                LangGraph Processing
              </div>
              <div className="flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                TinyFish Browser Agent
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4">
          {stats.map((stat, idx) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="text-3xl font-semibold">{stat.value}</div>
              <div className="mt-2 text-sm text-zinc-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
