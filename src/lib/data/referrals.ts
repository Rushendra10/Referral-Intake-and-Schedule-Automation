import type { ReferralDetail } from "@/lib/types";

/**
 * Seeded referral fixtures — used by the portal, detail, and processing pages.
 * Matches the DemoReferralSeed format from the plan's payload.txt.
 *
 * Note: ref-002 has a ZIP outside our coverage area (blocked_zip demo).
 *       ref-003 has an insurance not in our accepted list (blocked_insurance demo).
 *       ref-004 has UnitedHealthcare but a matching ZIP — goes to manual_review
 *       because the plan tier is ambiguous.
 */
export const referrals: ReferralDetail[] = [
  {
    id: "ref-001",
    patientName: "Mary Thompson",
    hospitalName: "Baylor Scott & White",
    mrn: "MRN-483920",
    status: "Pending Review",
    receivedAt: "2026-04-18T09:15:00.000Z",
    pdfName: "mary_thompson_referral.pdf",
    pdfUrl: "/documents/mary_thompson_referral.pdf",
    knownFields: {
      dob: "1948-02-14",
      insurance: "Aetna Medicare Advantage Gold",
      address: null,
      phone: "(214) 555-0192",
      services: ["PT", "OT"],
      pcp: null,
    },
    packetText:
      "Referral Packet — Mary Thompson, DOB 02/14/1948. Discharging from Baylor Scott & White Dallas. Insurance: Aetna Medicare Advantage Gold. Ordered services: Physical Therapy, Occupational Therapy. Contact: (214) 555-0192.",
  },
  {
    id: "ref-002",
    patientName: "James Carter",
    hospitalName: "Cleveland Clinic",
    mrn: "MRN-210443",
    status: "Awaiting Verification",
    receivedAt: "2026-04-18T08:42:00.000Z",
    pdfName: "james_carter_referral.pdf",
    pdfUrl: "/documents/james_carter_referral.pdf",
    knownFields: {
      dob: "1953-09-03",
      insurance: "Humana Gold Plus",
      address: "2440 West Oak Ave, Dallas, TX 75211",
      phone: null,
      services: ["Skilled Nursing"],
      pcp: "Dr. Alan West",
    },
    packetText:
      "Referral Packet — James Carter, DOB 09/03/1953. Discharging from Cleveland Clinic. Address: 2440 West Oak Ave, Dallas, TX 75211. Insurance: Humana Gold Plus HMO. Ordered services: Skilled Nursing. PCP: Dr. Alan West.",
  },
  {
    id: "ref-003",
    patientName: "Linda Martinez",
    hospitalName: "Houston Methodist",
    mrn: "MRN-991204",
    status: "Ready for Placement",
    receivedAt: "2026-04-18T07:58:00.000Z",
    pdfName: "linda_martinez_referral.pdf",
    pdfUrl: "/documents/linda_martinez_referral.pdf",
    knownFields: {
      dob: "1944-07-28",
      insurance: "Blue Cross Blue Shield PPO",
      address: "1802 Maple Dr, Houston, TX 77002",
      phone: "(713) 555-0107",
      services: ["PT", "OT", "ST"],
      pcp: "Dr. Sarah Kim",
    },
    packetText:
      "Referral Packet — Linda Martinez, DOB 07/28/1944. Discharging from Houston Methodist. Address: 1802 Maple Dr, Houston, TX 77002. Insurance: Blue Cross Blue Shield PPO. Ordered services: Physical Therapy, Occupational Therapy, Speech Therapy. PCP: Dr. Sarah Kim.",
  },
  {
    id: "ref-004",
    patientName: "Robert Chen",
    hospitalName: "Mount Sinai",
    mrn: "MRN-334211",
    status: "Pending Review",
    receivedAt: "2026-04-18T10:04:00.000Z",
    pdfName: "robert_chen_referral.pdf",
    pdfUrl: "/documents/robert_chen_referral.pdf",
    knownFields: {
      dob: "1950-11-21",
      insurance: "UnitedHealthcare Community Plan",
      address: "88 Cedar Lane, Austin, TX 73301",
      phone: "(512) 555-0140",
      services: ["OT"],
      pcp: null,
    },
    packetText:
      "Referral Packet — Robert Chen, DOB 11/21/1950. Discharging from Mount Sinai. Address: 88 Cedar Lane, Austin, TX 73301. Insurance: UnitedHealthcare Community Plan. Ordered services: Occupational Therapy. No PCP on file.",
  },
];

export function getReferralById(id: string): ReferralDetail | undefined {
  // Check seeded fixtures first
  const seeded = referrals.find((r) => r.id === id);
  if (seeded) return seeded;

  // New referrals added dynamically from the portal (ref-new-*) are only in
  // client React state, so the server component can't look them up from the
  // array. Synthesize a ReferralDetail so the detail page renders instead of 404.
  if (id.startsWith("ref-new-")) {
    return {
      id,
      patientName: "Evelyn Brooks",
      hospitalName: "UT Southwestern",
      mrn: "MRN-772901",
      status: "New Referral",
      // Use a stable timestamp — new Date() differs between SSR and hydration
      // causing a React hydration mismatch warning.
      receivedAt: "2026-04-19T00:00:00.000Z",
      pdfName: "incoming_referral_packet.pdf",
      pdfUrl: "/documents/incoming_referral_packet.pdf",
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
  }

  return undefined;
}
