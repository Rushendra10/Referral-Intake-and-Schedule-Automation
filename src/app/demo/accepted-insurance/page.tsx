import { Suspense } from "react";
import AcceptedInsuranceClient from "./client";

export const metadata = {
  title: "TinyFish — Accepted Insurance Plans",
  description: "TinyFish Home Health accepted payers and insurance plans (demo page)",
};

export default function AcceptedInsurancePage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <AcceptedInsurancePageInner searchParams={searchParams} />
    </Suspense>
  );
}

async function AcceptedInsurancePageInner({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>;
}) {
  const params = await searchParams;
  return <AcceptedInsuranceClient highlight={params.highlight} />;
}
