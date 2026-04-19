/**
 * TDD: Scheduling Workflow Tests — pure function logic only
 */

import { jest } from "@jest/globals";

jest.mock("@/lib/server/store", () => ({
  getExtractedReferral: jest.fn(),
  getEligibilityStatus: jest.fn(),
  getSchedulingStatus: jest.fn(),
  upsertSchedulingRun: jest.fn().mockResolvedValue(undefined),
  appendSchedulingEvent: jest.fn().mockResolvedValue(undefined),
  upsertSchedulingAgentRun: jest.fn().mockResolvedValue(undefined),
  saveSchedulingResult: jest.fn().mockResolvedValue(undefined),
  getNurses: jest.fn(),
}));

jest.mock("@/lib/server/scheduling-streams", () => ({
  publishSchedulingEvent: jest.fn(),
}));

import {
  selectBestNurse,
  determineSchedulingDecision,
} from "@/lib/server/scheduling-workflow";
import type { NurseRecord } from "@/lib/types/workflows";

const nurses: NurseRecord[] = [
  { id: "nurse-001", name: "Alice Nguyen, RN", specializations: ["PT", "OT", "Skilled Nursing"], availableSlots: ["2026-04-21 09:00"] },
  { id: "nurse-002", name: "Marcus Webb, RN", specializations: ["Skilled Nursing"], availableSlots: ["2026-04-21 11:00"] },
  { id: "nurse-003", name: "Diane Patel, PT", specializations: ["PT", "ST"], availableSlots: ["2026-04-21 14:00"] },
  { id: "nurse-004", name: "Carlos Reyes, OT", specializations: ["OT", "PT"], availableSlots: [] },
];

describe("selectBestNurse", () => {
  test("picks nurse covering all ordered services", () => {
    const result = selectBestNurse(["PT", "OT", "Skilled Nursing"], nurses);
    expect(result?.name).toBe("Alice Nguyen, RN");
  });

  test("ignores nurses with no available slots", () => {
    const result = selectBestNurse(["OT", "PT"], nurses);
    expect(result?.availableSlots.length).toBeGreaterThan(0);
    expect(result?.name).not.toBe("Carlos Reyes, OT");
  });

  test("returns null for empty nurse list", () => {
    expect(selectBestNurse(["PT"], [])).toBeNull();
  });

  test("returns null when all nurses have no slots", () => {
    const noSlotNurses = nurses.map(n => ({ ...n, availableSlots: [] }));
    expect(selectBestNurse(["PT"], noSlotNurses)).toBeNull();
  });

  test("returns best partial match when no full match", () => {
    const result = selectBestNurse(["PT", "ST", "Wound Care"], nurses);
    expect(result).not.toBeNull();
    expect(result?.availableSlots.length).toBeGreaterThan(0);
  });
});

describe("determineSchedulingDecision", () => {
  test("initialized when nurse and slot found", () => {
    expect(determineSchedulingDecision({ assignedNurse: "Alice", proposedSlot: "2026-04-21 09:00" })).toBe("initialized");
  });

  test("blocked when no nurse", () => {
    expect(determineSchedulingDecision({ assignedNurse: null, proposedSlot: null })).toBe("blocked");
  });

  test("blocked when nurse found but no slot", () => {
    expect(determineSchedulingDecision({ assignedNurse: "Alice", proposedSlot: null })).toBe("blocked");
  });
});
