"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell } from "@/components/app/page-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Calendar, User, Clock } from "lucide-react";

/**
 * SchedulingPage — TinyFish scheduling simulation.
 *
 * Note: Per final_plan.txt, TinyFish scheduling is owned by Person 3.
 * Person 2 builds/skins the scheduling status/result UI (Milestone 4).
 * This page provides that UI shell, ready for Person 3 to wire live data.
 */

const SCHEDULING_AGENTS = [
  { name: "Patient Outreach Agent", detail: "Initiating contact with patient" },
  { name: "Nurse Capability Matcher", detail: "Matching ordered services to nurse skills" },
  { name: "Nurse Availability Agent", detail: "Checking schedule calendar" },
  { name: "Assignment Agent", detail: "Confirming nurse assignment and visit slot" },
] as const;

type AgentName = (typeof SCHEDULING_AGENTS)[number]["name"];
type AgentStatus = "queued" | "running" | "complete";

type AgentState = { name: AgentName; detail: string; status: AgentStatus };

interface Props {
  params: Promise<{ id: string }>;
}

export default function SchedulingPage({ params }: Props) {
  const [id, setId] = useState<string>("");
  const [agents, setAgents] = useState<AgentState[]>(
    SCHEDULING_AGENTS.map((a, i) => ({
      ...a,
      status: i === 0 ? "running" : "queued",
    }))
  );
  const [done, setDone] = useState(false);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    const sequence: [number, AgentName, AgentName | null][] = [
      [1600, "Patient Outreach Agent", "Nurse Capability Matcher"],
      [3200, "Nurse Capability Matcher", "Nurse Availability Agent"],
      [4800, "Nurse Availability Agent", "Assignment Agent"],
      [6400, "Assignment Agent", null],
    ];

    sequence.forEach(([delay, completeAgent, nextAgent]) => {
      timers.push(
        setTimeout(() => {
          setAgents((prev) =>
            prev.map((a) => {
              if (a.name === completeAgent) return { ...a, status: "complete" };
              if (nextAgent && a.name === nextAgent) return { ...a, status: "running" };
              return a;
            })
          );
          if (!nextAgent) setTimeout(() => setDone(true), 600);
        }, delay)
      );
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <PageShell
      title="Scheduling Initialization"
      subtitle="TinyFish scheduling agents are matching nurse capabilities, checking availability, and initiating patient outreach."
      backHref={id ? `/result/${id}` : "/portal"}
      backLabel="Extracted Result"
      currentStep={5}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Scheduling agents */}
        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
          <div className="mb-4 text-sm font-semibold text-zinc-300">Scheduling Agents</div>
          <div className="flex flex-col gap-3">
            {agents.map((agent) => (
              <motion.div
                key={agent.name}
                layout
                className="rounded-2xl border border-white/10 bg-zinc-900/70 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{agent.name}</div>
                    <div className="mt-0.5 text-xs text-zinc-500">{agent.detail}</div>
                  </div>
                  <StatusBadge variant={agent.status} pulse={agent.status === "running"} />
                </div>

                {/* Progress bar for running agent */}
                {agent.status === "running" && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="mt-3 h-0.5 origin-left rounded-full bg-cyan-400/60"
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Outcome panel */}
        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
          <div className="mb-4 text-sm font-semibold text-zinc-300">Scheduling Outcome</div>

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col gap-4"
              >
                {/* Success banner */}
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-5 py-4">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                  <div>
                    <div className="text-sm font-semibold text-emerald-200">
                      Scheduling Initialization Complete
                    </div>
                    <div className="mt-0.5 text-xs text-emerald-300/70">
                      Patient outreach initiated and visit slot confirmed.
                    </div>
                  </div>
                </div>

                {/* Assignment details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-4 w-4 text-cyan-400" />
                      Assigned Clinician
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-base font-semibold">Sarah Nguyen, RN</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      Specializations: PT, OT, Skilled Nursing · 4.9★ · 12 active patients
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-cyan-400" />
                      Visit Slot
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-base font-semibold">Tomorrow, 10:30 AM</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      Initial assessment · ~60 min · In-home
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-cyan-400" />
                      Outreach Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm font-semibold text-amber-300">
                      Awaiting Patient Confirmation
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      SMS and voicemail sent · Auto-confirms in 24h if no response
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-64 flex-col items-center justify-center gap-3 text-center"
              >
                <div className="relative flex h-10 w-10 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400/30" />
                  <span className="relative h-4 w-4 rounded-full bg-cyan-400" />
                </div>
                <div className="text-sm text-zinc-500">
                  Waiting for scheduling agents to complete…
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageShell>
  );
}
