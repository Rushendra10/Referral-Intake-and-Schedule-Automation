/**
 * TDD: Store eligibility & scheduling tests
 * These verify the CRUD functions added to store.ts for the new workflows.
 *
 * We mock the file system to avoid touching .demo-data/ on disk.
 */

import { jest } from "@jest/globals";

// We must mock fs/promises before importing the store
const mockFileStore: Record<string, string> = {};

jest.mock("node:fs/promises", () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn(async (filePath: string) => {
    if (mockFileStore[filePath as string] === undefined) {
      throw new Error("ENOENT");
    }
    return mockFileStore[filePath as string];
  }),
  writeFile: jest.fn(async (filePath: string, content: string) => {
    mockFileStore[filePath as string] = content;
  }),
}));

import {
  saveEligibilityResult,
  getEligibilityStatus,
  upsertEligibilityRun,
  appendEligibilityEvent,
  saveSchedulingResult,
  getSchedulingStatus,
  upsertSchedulingRun,
  appendSchedulingEvent,
  getNurses,
  getCoveredZips,
  getAcceptedInsurancePlans,
} from "@/lib/server/store";
import type { EligibilityResult, SchedulingResult, WorkflowRun, WorkflowEvent } from "@/lib/types/workflows";

const mockRun: WorkflowRun = {
  id: "run-test-001",
  referralId: "ref-001",
  kind: "eligibility",
  status: "running",
  startedAt: "2026-04-19T00:00:00.000Z",
  finishedAt: null,
};

const mockEligibilityResult: EligibilityResult = {
  referralId: "ref-001",
  runId: "run-test-001",
  decision: "eligible",
  zipChecked: "75201",
  zipCovered: true,
  insuranceChecked: "Aetna Medicare Advantage Gold",
  insuranceAccepted: true,
  reasoning: "ZIP 75201 is in service area. Insurance plan is accepted.",
  checkedAt: "2026-04-19T00:01:00.000Z",
};

const mockSchedulingResult: SchedulingResult = {
  referralId: "ref-001",
  runId: "run-test-001",
  decision: "initialized",
  assignedNurse: "Alice Nguyen, RN",
  nurseRationale: "Alice covers PT, OT, and Skilled Nursing - all services ordered.",
  proposedSlot: "2026-04-21 09:00",
  outreachStatus: "initiated",
  reasoning: "Best match based on specializations and earliest available slot.",
  scheduledAt: "2026-04-19T00:02:00.000Z",
};

const mockEvent: WorkflowEvent = {
  id: "evt-test-001",
  runId: "run-test-001",
  referralId: "ref-001",
  timestamp: "2026-04-19T00:00:30.000Z",
  kind: "trace",
  stage: "load_patient_record",
  message: "Patient record loaded for eligibility check.",
  payload: {},
};

beforeEach(() => {
  // Clear the mock store before each test
  for (const key of Object.keys(mockFileStore)) {
    delete mockFileStore[key];
  }
});

describe("Eligibility Store", () => {
  test("getEligibilityStatus returns nulls when no data exists", async () => {
    const status = await getEligibilityStatus("ref-001");
    expect(status.run).toBeNull();
    expect(status.events).toEqual([]);
    expect(status.agents).toEqual([]);
    expect(status.result).toBeNull();
  });

  test("upsertEligibilityRun persists and retrieves a run", async () => {
    await upsertEligibilityRun("ref-001", mockRun);
    const status = await getEligibilityStatus("ref-001");
    expect(status.run).toMatchObject({ id: "run-test-001", kind: "eligibility" });
  });

  test("appendEligibilityEvent accumulates events", async () => {
    await appendEligibilityEvent("ref-001", mockEvent);
    await appendEligibilityEvent("ref-001", { ...mockEvent, id: "evt-test-002" });
    const status = await getEligibilityStatus("ref-001");
    expect(status.events).toHaveLength(2);
    expect(status.events[0].id).toBe("evt-test-001");
    expect(status.events[1].id).toBe("evt-test-002");
  });

  test("saveEligibilityResult persists and retrieves result", async () => {
    await saveEligibilityResult("ref-001", mockEligibilityResult);
    const status = await getEligibilityStatus("ref-001");
    expect(status.result).toMatchObject({
      decision: "eligible",
      zipCovered: true,
      insuranceAccepted: true,
    });
  });

  test("getEligibilityStatus returns all fields together", async () => {
    await upsertEligibilityRun("ref-001", mockRun);
    await appendEligibilityEvent("ref-001", mockEvent);
    await saveEligibilityResult("ref-001", mockEligibilityResult);

    const status = await getEligibilityStatus("ref-001");
    expect(status.run?.id).toBe("run-test-001");
    expect(status.events).toHaveLength(1);
    expect(status.result?.decision).toBe("eligible");
  });
});

describe("Scheduling Store", () => {
  test("getSchedulingStatus returns nulls when no data exists", async () => {
    const status = await getSchedulingStatus("ref-001");
    expect(status.run).toBeNull();
    expect(status.result).toBeNull();
  });

  test("upsertSchedulingRun persists and retrieves a scheduling run", async () => {
    await upsertSchedulingRun("ref-001", { ...mockRun, kind: "scheduling" });
    const status = await getSchedulingStatus("ref-001");
    expect(status.run?.kind).toBe("scheduling");
  });

  test("appendSchedulingEvent accumulates events", async () => {
    await appendSchedulingEvent("ref-001", mockEvent);
    await appendSchedulingEvent("ref-001", { ...mockEvent, id: "evt-sched-002" });
    const status = await getSchedulingStatus("ref-001");
    expect(status.events).toHaveLength(2);
  });

  test("saveSchedulingResult persists and retrieves result", async () => {
    await saveSchedulingResult("ref-001", mockSchedulingResult);
    const status = await getSchedulingStatus("ref-001");
    expect(status.result).toMatchObject({
      decision: "initialized",
      assignedNurse: "Alice Nguyen, RN",
    });
  });

  test("scheduling blocked when ZIP is not covered (decision: blocked)", async () => {
    const blockedResult: SchedulingResult = {
      ...mockSchedulingResult,
      decision: "blocked",
      assignedNurse: null,
      proposedSlot: null,
      outreachStatus: null,
      reasoning: "Patient ZIP not in service area.",
    };
    await saveSchedulingResult("ref-001", blockedResult);
    const status = await getSchedulingStatus("ref-001");
    expect(status.result?.decision).toBe("blocked");
    expect(status.result?.assignedNurse).toBeNull();
  });
});

describe("Reference Data", () => {
  test("getNurses returns all 4 demo nurses", async () => {
    const nurses = await getNurses();
    expect(nurses).toHaveLength(4);
    expect(nurses[0].name).toBe("Alice Nguyen, RN");
    expect(nurses[0].specializations).toContain("PT");
  });

  test("getCoveredZips includes Texas ZIPs", async () => {
    const zips = await getCoveredZips();
    expect(zips).toContain("75201");
    expect(zips).toContain("77002");
    expect(zips.length).toBeGreaterThan(10);
  });

  test("getAcceptedInsurancePlans includes Aetna and Humana", async () => {
    const plans = await getAcceptedInsurancePlans();
    expect(plans).toContain("Aetna Medicare Advantage Gold");
    expect(plans).toContain("Humana Choice PPO");
  });
});
