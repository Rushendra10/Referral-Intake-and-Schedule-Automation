import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  createIncomingDemoReferral,
  coveredZips,
  acceptedInsurancePlans,
  nurseSeeds,
  demoReferralSeeds,
  statsSnapshot,
  type DemoReferralSeed,
} from "@/lib/server/demo-data";
import type { ReferralDetail, ReferralSummary, StatsSnapshot } from "@/lib/types/referrals";
import type {
  AgentRun,
  EligibilityResult,
  ExtractedReferral,
  NurseRecord,
  ProcessingStatusResponse,
  SchedulingResult,
  WorkflowEvent,
  WorkflowRun,
} from "@/lib/types/workflows";

type DemoStore = {
  referrals: DemoReferralSeed[];
  runs: Record<string, WorkflowRun>;
  events: Record<string, WorkflowEvent[]>;
  agents: Record<string, AgentRun[]>;
  results: Record<string, ExtractedReferral>;
  eligibilityRuns: Record<string, WorkflowRun>;
  eligibilityEvents: Record<string, WorkflowEvent[]>;
  eligibilityAgents: Record<string, AgentRun[]>;
  eligibilityResults: Record<string, EligibilityResult>;
  schedulingRuns: Record<string, WorkflowRun>;
  schedulingEvents: Record<string, WorkflowEvent[]>;
  schedulingAgents: Record<string, AgentRun[]>;
  schedulingResults: Record<string, SchedulingResult>;
};

const storeDir = path.join(process.cwd(), ".demo-data");
const storePath = path.join(storeDir, "processing-store.json");

function buildInitialStore(): DemoStore {
  return {
    referrals: demoReferralSeeds.map((seed) => JSON.parse(JSON.stringify(seed)) as DemoReferralSeed),
    runs: {},
    events: {},
    agents: {},
    results: {},
    eligibilityRuns: {},
    eligibilityEvents: {},
    eligibilityAgents: {},
    eligibilityResults: {},
    schedulingRuns: {},
    schedulingEvents: {},
    schedulingAgents: {},
    schedulingResults: {},
  };
}

async function ensureStore() {
  await mkdir(storeDir, { recursive: true });

  try {
    await readFile(storePath, "utf8");
  } catch {
    await writeFile(storePath, JSON.stringify(buildInitialStore(), null, 2), "utf8");
  }
}

async function readStore(): Promise<DemoStore> {
  await ensureStore();
  const raw = await readFile(storePath, "utf8");
  const parsed = JSON.parse(raw) as Partial<DemoStore>;
  // Merge with defaults so any field added after the store was first written is present
  return { ...buildInitialStore(), ...parsed };
}

async function writeStore(store: DemoStore) {
  await ensureStore();
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

function toSummary(seed: DemoReferralSeed): ReferralSummary {
  return {
    id: seed.id,
    patientName: seed.patientName,
    hospitalName: seed.hospitalName,
    mrn: seed.mrn,
    status: seed.status,
    receivedAt: seed.receivedAt,
  };
}

function toDetail(seed: DemoReferralSeed, processingStatus: ReferralDetail["processingStatus"]): ReferralDetail {
  return {
    summary: toSummary(seed),
    pdfName: seed.pdfName,
    pdfUrl: seed.pdfUrl,
    knownFields: seed.knownFields,
    processingStatus,
  };
}

export async function getStats(): Promise<StatsSnapshot[]> {
  return statsSnapshot;
}

export async function getReferrals(): Promise<ReferralSummary[]> {
  const store = await readStore();
  return store.referrals.slice().sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1)).map(toSummary);
}

export async function createNewReferral() {
  const store = await readStore();
  const next = createIncomingDemoReferral();
  store.referrals.unshift(next);
  await writeStore(store);
  return toSummary(next);
}

export async function getReferralSeed(referralId: string) {
  const store = await readStore();
  return store.referrals.find((referral) => referral.id === referralId) ?? null;
}

export async function getReferral(referralId: string): Promise<ReferralDetail | null> {
  const store = await readStore();
  const referral = store.referrals.find((item) => item.id === referralId);
  if (!referral) {
    return null;
  }

  return toDetail(referral, store.runs[referralId]?.status ?? "idle");
}

export async function getReferralPacketText(referralId: string) {
  const referral = await getReferralSeed(referralId);
  return referral?.packetText ?? null;
}

export async function upsertProcessingRun(referralId: string, run: WorkflowRun) {
  const store = await readStore();
  store.runs[referralId] = run;
  await writeStore(store);
  return run;
}

export async function getProcessingStatus(referralId: string): Promise<ProcessingStatusResponse> {
  const store = await readStore();
  return {
    run: store.runs[referralId] ?? null,
    events: store.events[referralId] ?? [],
    agents: store.agents[referralId] ?? [],
  };
}

export async function appendProcessingEvent(referralId: string, event: WorkflowEvent) {
  const store = await readStore();
  store.events[referralId] = [...(store.events[referralId] ?? []), event];
  await writeStore(store);
  return event;
}

export async function upsertAgentRun(referralId: string, agent: AgentRun) {
  const store = await readStore();
  const next = (store.agents[referralId] ?? []).filter((item) => item.id !== agent.id);
  next.push(agent);
  store.agents[referralId] = next;
  await writeStore(store);
  return agent;
}

export async function saveExtractedReferral(referralId: string, result: ExtractedReferral) {
  const store = await readStore();
  store.results[referralId] = result;
  await writeStore(store);
  return result;
}

export async function getExtractedReferral(referralId: string) {
  const store = await readStore();
  return store.results[referralId] ?? null;
}

// ── Eligibility ────────────────────────────────────────────────────────────

export async function upsertEligibilityRun(referralId: string, run: WorkflowRun) {
  const store = await readStore();
  store.eligibilityRuns[referralId] = run;
  await writeStore(store);
  return run;
}

export async function appendEligibilityEvent(referralId: string, event: WorkflowEvent) {
  const store = await readStore();
  store.eligibilityEvents[referralId] = [...(store.eligibilityEvents[referralId] ?? []), event];
  await writeStore(store);
  return event;
}

export async function upsertEligibilityAgentRun(referralId: string, agent: AgentRun) {
  const store = await readStore();
  const next = (store.eligibilityAgents[referralId] ?? []).filter((item) => item.id !== agent.id);
  next.push(agent);
  store.eligibilityAgents[referralId] = next;
  await writeStore(store);
  return agent;
}

export async function saveEligibilityResult(referralId: string, result: EligibilityResult) {
  const store = await readStore();
  store.eligibilityResults[referralId] = result;
  await writeStore(store);
  return result;
}

export async function getEligibilityStatus(referralId: string) {
  const store = await readStore();
  return {
    run: store.eligibilityRuns[referralId] ?? null,
    events: store.eligibilityEvents[referralId] ?? [],
    agents: store.eligibilityAgents[referralId] ?? [],
    result: store.eligibilityResults[referralId] ?? null,
  };
}

// ── Scheduling ─────────────────────────────────────────────────────────────

export async function upsertSchedulingRun(referralId: string, run: WorkflowRun) {
  const store = await readStore();
  store.schedulingRuns[referralId] = run;
  await writeStore(store);
  return run;
}

export async function appendSchedulingEvent(referralId: string, event: WorkflowEvent) {
  const store = await readStore();
  store.schedulingEvents[referralId] = [...(store.schedulingEvents[referralId] ?? []), event];
  await writeStore(store);
  return event;
}

export async function upsertSchedulingAgentRun(referralId: string, agent: AgentRun) {
  const store = await readStore();
  const next = (store.schedulingAgents[referralId] ?? []).filter((item) => item.id !== agent.id);
  next.push(agent);
  store.schedulingAgents[referralId] = next;
  await writeStore(store);
  return agent;
}

export async function saveSchedulingResult(referralId: string, result: SchedulingResult) {
  const store = await readStore();
  store.schedulingResults[referralId] = result;
  await writeStore(store);
  return result;
}

export async function getSchedulingStatus(referralId: string) {
  const store = await readStore();
  return {
    run: store.schedulingRuns[referralId] ?? null,
    events: store.schedulingEvents[referralId] ?? [],
    agents: store.schedulingAgents[referralId] ?? [],
    result: store.schedulingResults[referralId] ?? null,
  };
}

// ── Nurse data ─────────────────────────────────────────────────────────────

export async function getNurses(): Promise<NurseRecord[]> {
  return nurseSeeds;
}

export async function getCoveredZips(): Promise<string[]> {
  return coveredZips;
}

export async function getAcceptedInsurancePlans(): Promise<string[]> {
  return acceptedInsurancePlans;
}
