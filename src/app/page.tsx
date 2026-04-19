import Image from "next/image";
import Link from "next/link";

import hero from "@/assets/hero.png";
import { PageShell } from "@/components/app/page-shell";
import { getStats } from "@/lib/server/store";

export default async function HomePage() {
  const stats = await getStats();

  return (
    <PageShell
      title="Agentic Referral Intake for Home Health"
      subtitle="From discharge packets to structured referrals, live processing visibility, and downstream scheduling readiness."
      actions={
        <Link
          href="/portal"
          className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-semibold leading-none text-black transition hover:opacity-90"
          style={{ color: "#000000" }}
        >
          <span className="text-black">Start Demo</span>
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl">
          <Image
            src={hero}
            alt="Home health referral automation dashboard"
            className="absolute inset-0 h-full w-full object-cover opacity-30"
            priority
          />
          <div className="relative p-8">
            <p className="mb-4 text-sm uppercase tracking-[0.2em] text-cyan-400">Intake automation</p>
            <h2 className="max-w-3xl text-5xl font-semibold leading-tight">
              Home health referral processing that turns messy packets into operationally ready referrals.
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-300">
              This demo shows a realistic referral portal, a live LangGraph document-processing run, and the
              extracted patient record that downstream operational agents can use.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6">
              <div className="text-3xl font-semibold">{stat.value}</div>
              <div className="mt-2 text-sm text-zinc-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
