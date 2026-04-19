import type { KnownReferralFields } from "@/lib/types/referrals";
import type { NurseRecord } from "@/lib/types/workflows";

export type DemoReferralSeed = {
  id: string;
  patientName: string;
  hospitalName: string;
  mrn: string;
  status: string;
  receivedAt: string;
  pdfName: string;
  pdfUrl: string;
  knownFields: KnownReferralFields;
  packetText: string;
};

const demoTimestamp = [
  "2026-04-18T09:15:00.000Z",
  "2026-04-18T08:42:00.000Z",
  "2026-04-18T07:58:00.000Z",
  "2026-04-18T10:04:00.000Z",
] as const;

export const statsSnapshot = [
  { label: "U.S. healthcare economy", value: "$5T+" },
  { label: "Home health share of spend", value: "$150B+" },
  { label: "Referral packets delayed by missing data", value: "1 in 3" },
  { label: "Manual intake time per packet", value: "30-60 min" },
];

export const demoReferralSeeds: DemoReferralSeed[] = [
  {
    id: "ref-001",
    patientName: "Mary Thompson",
    hospitalName: "Baylor Scott & White",
    mrn: "MRN-483920",
    status: "Pending Review",
    receivedAt: demoTimestamp[0],
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
    packetText: `Referral Packet
Patient Name: Mary Thompson
MRN: MRN-483920
DOB: 02/14/1948
Phone: (214) 555-0192
Address: 123 Main St, Dallas, TX 75201
Discharging Hospital: Baylor Scott & White
Insurance: Aetna Medicare Advantage Gold
Primary Care Physician: Dr. Sarah Lee
Ordering Physician: Dr. James Carter
Ordered Services: Physical Therapy; Occupational Therapy; Skilled Nursing
Diagnosis: generalized weakness after inpatient stay
`,
  },
  {
    id: "ref-002",
    patientName: "James Carter",
    hospitalName: "Cleveland Clinic",
    mrn: "MRN-210443",
    status: "Awaiting Verification",
    receivedAt: demoTimestamp[1],
    pdfName: "james_carter_referral.pdf",
    pdfUrl: "/documents/james_carter_referral.pdf",
    knownFields: {
      dob: "1953-09-03",
      insurance: "Humana Choice PPO",
      address: "2440 West Oak Ave, Dallas, TX 75211",
      phone: null,
      services: ["Skilled Nursing"],
      pcp: "Dr. Alan West",
    },
    packetText: `Referral Packet
Patient Name: James Carter
MRN: MRN-210443
DOB: 09/03/1953
Address: 2440 West Oak Ave, Dallas, TX 75211
Insurance: Humana Choice PPO
Discharging Hospital: Cleveland Clinic
Primary Care Physician: Dr. Alan West
Ordering Physician: Dr. Maya Patel
Ordered Services: Skilled Nursing
Emergency Contact Phone: (469) 555-0174
`,
  },
  {
    id: "ref-003",
    patientName: "Linda Martinez",
    hospitalName: "Houston Methodist",
    mrn: "MRN-991204",
    status: "Ready for Placement",
    receivedAt: demoTimestamp[2],
    pdfName: "linda_martinez_referral.pdf",
    pdfUrl: "/documents/linda_martinez_referral.pdf",
    knownFields: {
      dob: "1944-07-28",
      insurance: "Blue Cross Blue Shield Medicare",
      address: "1802 Maple Dr, Houston, TX 77002",
      phone: "(713) 555-0107",
      services: ["PT", "OT", "ST"],
      pcp: "Dr. Sarah Kim",
    },
    packetText: `Referral Packet
Patient Name: Linda Martinez
MRN: MRN-991204
DOB: 07/28/1944
Phone: (713) 555-0107
Address: 1802 Maple Dr, Houston, TX 77002
Discharging Hospital: Houston Methodist
Insurance: Blue Cross Blue Shield Medicare
Primary Care Physician: Dr. Sarah Kim
Ordering Physician: Dr. Nathan Reeves
Ordered Services: Physical Therapy; Occupational Therapy; Speech Therapy
`,
  },
  {
    id: "ref-004",
    patientName: "Robert Chen",
    hospitalName: "Mount Sinai",
    mrn: "MRN-334211",
    status: "Pending Review",
    receivedAt: demoTimestamp[3],
    pdfName: "robert_chen_referral.pdf",
    pdfUrl: "/documents/robert_chen_referral.pdf",
    knownFields: {
      dob: "1950-11-21",
      insurance: "UnitedHealthcare Secure Horizons",
      address: "88 Cedar Lane, Austin, TX 73301",
      phone: "(512) 555-0140",
      services: ["OT"],
      pcp: null,
    },
    packetText: `Referral Packet
Patient Name: Robert Chen
MRN: MRN-334211
DOB: 11/21/1950
Phone: (512) 555-0140
Address: 88 Cedar Lane, Austin, TX 73301
Discharging Hospital: Mount Sinai
Insurance: UnitedHealthcare Secure Horizons
Ordering Physician: Dr. Priya Raman
Ordered Services: Occupational Therapy
`,
  },
];

export function createIncomingDemoReferral(): DemoReferralSeed {
  return {
    id: `ref-new-${Date.now()}`,
    patientName: "Evelyn Brooks",
    hospitalName: "UT Southwestern",
    mrn: "MRN-772901",
    status: "New Referral",
    receivedAt: new Date().toISOString(),
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
    packetText: `Referral Packet
Patient Name: Evelyn Brooks
MRN: MRN-772901
DOB: 10/09/1946
Phone: (972) 555-0115
Address: 9801 Legacy Dr, Plano, TX 75024
Discharging Hospital: UT Southwestern
Insurance: Aetna Medicare Advantage Gold
Primary Care Physician: Dr. Leena Shah
Ordering Physician: Dr. Michael Grant
Ordered Services: Physical Therapy; Skilled Nursing
`,
  };
}

/** ZIPs covered by the demo agency */
export const coveredZips: string[] = [
  "75201", "75211", "75024", "75201", "75202", "75203", "75204", "75205",
  "75206", "75207", "75208", "75209", "75210", "75212", "75214",
  "77002", "77003", "77004", "77005", "77006", "77007", "77008",
  "73301", "73344",
];

/** Insurance plans accepted by the demo agency */
export const acceptedInsurancePlans: string[] = [
  "Aetna Medicare Advantage Gold",
  "Aetna Medicare Advantage Silver",
  "Humana Choice PPO",
  "Humana Gold Plus HMO",
  "Blue Cross Blue Shield Medicare",
  "Blue Cross Blue Shield PPO",
  "UnitedHealthcare Secure Horizons",
  "UnitedHealthcare Community Plan",
];

/** Demo nurse roster with specializations and availability */
export const nurseSeeds: NurseRecord[] = [
  {
    id: "nurse-001",
    name: "Alice Nguyen, RN",
    specializations: ["PT", "OT", "Skilled Nursing"],
    availableSlots: ["2026-04-21 09:00", "2026-04-22 10:00", "2026-04-23 14:00"],
  },
  {
    id: "nurse-002",
    name: "Marcus Webb, RN",
    specializations: ["Skilled Nursing", "Wound Care"],
    availableSlots: ["2026-04-21 11:00", "2026-04-22 13:00", "2026-04-24 09:00"],
  },
  {
    id: "nurse-003",
    name: "Diane Patel, PT",
    specializations: ["PT", "ST"],
    availableSlots: ["2026-04-21 14:00", "2026-04-23 09:00", "2026-04-25 11:00"],
  },
  {
    id: "nurse-004",
    name: "Carlos Reyes, OT",
    specializations: ["OT", "PT"],
    availableSlots: ["2026-04-22 09:00", "2026-04-24 14:00", "2026-04-25 10:00"],
  },
];
