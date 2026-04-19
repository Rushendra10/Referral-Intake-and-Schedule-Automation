import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const documents = [
  {
    name: "mary_thompson_referral.pdf",
    text: `Referral Packet\nPatient Name: Mary Thompson\nMRN: MRN-483920\nDOB: 02/14/1948\nPhone: (214) 555-0192\nAddress: 123 Main St, Dallas, TX 75201\nDischarging Hospital: Baylor Scott & White\nInsurance: Aetna Medicare Advantage Gold\nPrimary Care Physician: Dr. Sarah Lee\nOrdering Physician: Dr. James Carter\nOrdered Services: Physical Therapy; Occupational Therapy; Skilled Nursing`,
  },
  {
    name: "james_carter_referral.pdf",
    text: `Referral Packet\nPatient Name: James Carter\nMRN: MRN-210443\nDOB: 09/03/1953\nAddress: 2440 West Oak Ave, Dallas, TX 75211\nInsurance: Humana Choice PPO\nDischarging Hospital: Cleveland Clinic\nPrimary Care Physician: Dr. Alan West\nOrdering Physician: Dr. Maya Patel\nOrdered Services: Skilled Nursing\nEmergency Contact Phone: (469) 555-0174`,
  },
  {
    name: "linda_martinez_referral.pdf",
    text: `Referral Packet\nPatient Name: Linda Martinez\nMRN: MRN-991204\nDOB: 07/28/1944\nPhone: (713) 555-0107\nAddress: 1802 Maple Dr, Houston, TX 77002\nDischarging Hospital: Houston Methodist\nInsurance: Blue Cross Blue Shield Medicare\nPrimary Care Physician: Dr. Sarah Kim\nOrdering Physician: Dr. Nathan Reeves\nOrdered Services: Physical Therapy; Occupational Therapy; Speech Therapy`,
  },
  {
    name: "robert_chen_referral.pdf",
    text: `Referral Packet\nPatient Name: Robert Chen\nMRN: MRN-334211\nDOB: 11/21/1950\nPhone: (512) 555-0140\nAddress: 88 Cedar Lane, Austin, TX 73301\nDischarging Hospital: Mount Sinai\nInsurance: UnitedHealthcare Secure Horizons\nOrdering Physician: Dr. Priya Raman\nOrdered Services: Occupational Therapy`,
  },
  {
    name: "incoming_referral_packet.pdf",
    text: `Referral Packet\nPatient Name: Evelyn Brooks\nMRN: MRN-772901\nDOB: 10/09/1946\nPhone: (972) 555-0115\nAddress: 9801 Legacy Dr, Plano, TX 75024\nDischarging Hospital: UT Southwestern\nInsurance: Aetna Medicare Advantage Gold\nPrimary Care Physician: Dr. Leena Shah\nOrdering Physician: Dr. Michael Grant\nOrdered Services: Physical Therapy; Skilled Nursing`,
  },
];

async function generateDocument(document) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const lines = document.text.split("\n");

  let y = 740;
  page.drawText("Home Health Referral Packet", {
    x: 48,
    y,
    size: 18,
    font,
    color: rgb(0.12, 0.18, 0.24),
  });

  y -= 36;
  for (const line of lines) {
    page.drawText(line, {
      x: 48,
      y,
      size: 11,
      font,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: 500,
    });
    y -= 22;
  }

  return pdf.save();
}

async function main() {
  const outputDir = path.join(process.cwd(), "public", "documents");
  await mkdir(outputDir, { recursive: true });

  await Promise.all(
    documents.map(async (document) => {
      const bytes = await generateDocument(document);
      await writeFile(path.join(outputDir, document.name), bytes);
    }),
  );
}

await main();
