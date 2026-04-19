/**
 * TDD: Eligibility Workflow Tests — pure function logic only
 */

import { jest } from "@jest/globals";

jest.mock("@/lib/server/store", () => ({
  getExtractedReferral: jest.fn(),
  getEligibilityStatus: jest.fn(),
  upsertEligibilityRun: jest.fn().mockResolvedValue(undefined),
  appendEligibilityEvent: jest.fn().mockResolvedValue(undefined),
  upsertEligibilityAgentRun: jest.fn().mockResolvedValue(undefined),
  saveEligibilityResult: jest.fn().mockResolvedValue(undefined),
  getCoveredZips: jest.fn().mockResolvedValue(["75201", "75211", "77002"]),
  getAcceptedInsurancePlans: jest.fn().mockResolvedValue([
    "Aetna Medicare Advantage Gold",
    "Humana Choice PPO",
  ]),
}));

jest.mock("@/lib/server/eligibility-streams", () => ({
  publishEligibilityEvent: jest.fn(),
}));

import {
  checkZipCoverage,
  checkInsuranceAcceptance,
  determineEligibilityDecision,
} from "@/lib/server/eligibility-workflow";

describe("Eligibility Decision Logic", () => {
  test("eligible when both ZIP and insurance pass", () => {
    expect(determineEligibilityDecision({ zipCovered: true, insuranceAccepted: true })).toBe("eligible");
  });

  test("blocked_zip when ZIP fails", () => {
    expect(determineEligibilityDecision({ zipCovered: false, insuranceAccepted: true })).toBe("blocked_zip");
  });

  test("blocked_insurance when insurance fails", () => {
    expect(determineEligibilityDecision({ zipCovered: true, insuranceAccepted: false })).toBe("blocked_insurance");
  });

  test("manual_review when both fail", () => {
    expect(determineEligibilityDecision({ zipCovered: false, insuranceAccepted: false })).toBe("manual_review");
  });
});

describe("ZIP Coverage Check", () => {
  test("returns true for exact match", () => {
    expect(checkZipCoverage("75201", ["75201", "75211"])).toBe(true);
  });

  test("returns false for unknown ZIP", () => {
    expect(checkZipCoverage("99999", ["75201", "75211"])).toBe(false);
  });

  test("returns false for null ZIP", () => {
    expect(checkZipCoverage(null, ["75201"])).toBe(false);
  });
});

describe("Insurance Acceptance Check", () => {
  const plans = ["Aetna Medicare Advantage Gold", "Humana Choice PPO"];

  test("returns true for exact match", () => {
    expect(checkInsuranceAcceptance("Aetna Medicare Advantage Gold", plans)).toBe(true);
  });

  test("is case-insensitive", () => {
    expect(checkInsuranceAcceptance("aetna medicare advantage gold", plans)).toBe(true);
  });

  test("returns false for unaccepted plan", () => {
    expect(checkInsuranceAcceptance("Cigna PPO", plans)).toBe(false);
  });

  test("returns false for null", () => {
    expect(checkInsuranceAcceptance(null, plans)).toBe(false);
  });
});
