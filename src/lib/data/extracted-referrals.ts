import type { ExtractedReferral } from "@/lib/types";

/**
 * Deterministic ExtractedReferral fixtures — one per referralId.
 *
 * These simulate what Person 1's LangGraph pipeline would emit.
 * Each fixture is designed to produce a specific eligibility outcome:
 *
 *   ref-001 → eligible           (ZIP+insurance both accepted)
 *   ref-002 → blocked_zip        (ZIP 75211 not in TinyFish coverage)
 *   ref-003 → blocked_insurance  (BCBS not accepted by TinyFish)
 *   ref-004 → manual_review      (UHC Community Plan — tier ambiguous)
 *
 * fieldConfidence values are 0–1. Anything below 0.7 is flagged in the UI.
 * completeness is the average confidence across all fields.
 */
const extractedReferrals: Record<string, ExtractedReferral> = {
  "ref-001": {
    referralId: "ref-001",
    patientName: "Mary Thompson",
    mrn: "MRN-483920",
    dob: "1948-02-14",
    phone: "(214) 555-0192",
    address: "412 Elm Street, Dallas, TX 75201",
    zip: "75201",
    hospitalName: "Baylor Scott & White Medical Center – Dallas",
    insuranceName: "Aetna Medicare",
    insurancePlan: "Aetna Medicare Advantage Gold",
    orderedServices: ["PT", "OT"],
    pcp: "Dr. Sarah Lee",
    orderingPhysician: "Dr. James Nguyen",
    warnings: [
      "Address inferred from referring hospital — not explicit in packet",
    ],
    fieldConfidence: {
      patientName: 0.99,
      mrn: 0.97,
      dob: 0.97,
      phone: 0.94,
      address: 0.71,
      zip: 0.71,
      hospitalName: 0.98,
      insuranceName: 0.96,
      insurancePlan: 0.96,
      orderedServices: 0.99,
      pcp: 0.82,
      orderingPhysician: 0.91,
    },
    completeness: 0.93,
  },

  "ref-002": {
    referralId: "ref-002",
    patientName: "James Carter",
    mrn: "MRN-210443",
    dob: "1953-09-03",
    phone: null,
    address: "2440 West Oak Ave, Dallas, TX 75211",
    zip: "75211",
    hospitalName: "Cleveland Clinic",
    insuranceName: "Humana",
    insurancePlan: "Humana Gold Plus HMO",
    orderedServices: ["Skilled Nursing"],
    pcp: "Dr. Alan West",
    orderingPhysician: "Dr. Patricia Wong",
    warnings: [
      "Phone number not found in packet",
      "ZIP 75211 is outside TinyFish primary service zone",
    ],
    fieldConfidence: {
      patientName: 0.98,
      mrn: 0.96,
      dob: 0.95,
      phone: 0.0,
      address: 0.93,
      zip: 0.93,
      hospitalName: 0.99,
      insuranceName: 0.88,
      insurancePlan: 0.88,
      orderedServices: 0.97,
      pcp: 0.92,
      orderingPhysician: 0.87,
    },
    completeness: 0.86,
  },

  "ref-003": {
    referralId: "ref-003",
    patientName: "Linda Martinez",
    mrn: "MRN-991204",
    dob: "1944-07-28",
    phone: "(713) 555-0107",
    address: "1802 Maple Dr, Houston, TX 77002",
    zip: "77002",
    hospitalName: "Houston Methodist Hospital",
    insuranceName: "Blue Cross Blue Shield",
    insurancePlan: "BCBS BlueChoice PPO",
    orderedServices: ["PT", "OT", "ST"],
    pcp: "Dr. Sarah Kim",
    orderingPhysician: "Dr. Marcus Rivera",
    warnings: [
      "BCBS PPO plans are not currently accepted by TinyFish Home Health",
    ],
    fieldConfidence: {
      patientName: 0.99,
      mrn: 0.98,
      dob: 0.96,
      phone: 0.95,
      address: 0.94,
      zip: 0.94,
      hospitalName: 0.98,
      insuranceName: 0.91,
      insurancePlan: 0.91,
      orderedServices: 0.99,
      pcp: 0.95,
      orderingPhysician: 0.89,
    },
    completeness: 0.95,
  },

  "ref-004": {
    referralId: "ref-004",
    patientName: "Robert Chen",
    mrn: "MRN-334211",
    dob: "1950-11-21",
    phone: "(512) 555-0140",
    address: "88 Cedar Lane, Austin, TX 73301",
    zip: "73301",
    hospitalName: "Mount Sinai Medical Center",
    insuranceName: "UnitedHealthcare",
    insurancePlan: "UnitedHealthcare Community Plan",
    orderedServices: ["OT"],
    pcp: null,
    orderingPhysician: "Dr. Linda Park",
    warnings: [
      "PCP not identified in packet",
      "UnitedHealthcare Community Plan requires manual authorization review",
    ],
    fieldConfidence: {
      patientName: 0.97,
      mrn: 0.95,
      dob: 0.94,
      phone: 0.93,
      address: 0.92,
      zip: 0.92,
      hospitalName: 0.96,
      insuranceName: 0.89,
      insurancePlan: 0.89,
      orderedServices: 0.98,
      pcp: 0.0,
      orderingPhysician: 0.88,
    },
    completeness: 0.87,
  },
};

export function getExtractedReferral(referralId: string): ExtractedReferral {
  const found = extractedReferrals[referralId];
  if (found) return found;

  // Fallback for dynamically created referrals (ref-new-<timestamp>)
  return {
    referralId,
    patientName: "Evelyn Brooks",
    mrn: "MRN-772901",
    dob: "1946-10-09",
    phone: null,
    address: null,
    zip: "75201",
    hospitalName: "UT Southwestern Medical Center",
    insuranceName: "Aetna Medicare",
    insurancePlan: "Aetna Medicare Advantage Gold",
    orderedServices: ["PT", "Skilled Nursing"],
    pcp: null,
    orderingPhysician: null,
    warnings: ["Phone not found", "Address not found", "PCP not found"],
    fieldConfidence: {
      patientName: 0.95,
      mrn: 0.91,
      dob: 0.9,
      phone: 0.0,
      address: 0.0,
      zip: 0.85,
      hospitalName: 0.97,
      insuranceName: 0.88,
      insurancePlan: 0.88,
      orderedServices: 0.95,
      pcp: 0.0,
      orderingPhysician: 0.0,
    },
    completeness: 0.66,
  };
}
