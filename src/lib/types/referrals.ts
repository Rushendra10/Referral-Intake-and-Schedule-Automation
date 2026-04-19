export type KnownReferralFields = {
  dob: string | null;
  insurance: string | null;
  address: string | null;
  phone: string | null;
  services: string[];
  pcp: string | null;
};

export type ReferralSummary = {
  id: string;
  patientName: string;
  hospitalName: string;
  mrn: string;
  status: string;
  receivedAt: string;
};

export type ReferralDetail = {
  summary: ReferralSummary;
  pdfName: string;
  pdfUrl: string;
  knownFields: KnownReferralFields;
  processingStatus: "idle" | "running" | "completed" | "failed";
};

export type StatsSnapshot = {
  label: string;
  value: string;
};

