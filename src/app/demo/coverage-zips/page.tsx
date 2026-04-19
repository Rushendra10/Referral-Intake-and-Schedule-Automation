import { Suspense } from "react";
import CoverageZipsClient from "./client";

export const metadata = {
  title: "SunCare Home Health — ZIP Coverage Map",
  description: "SunCare Home Health service area ZIP codes (internal agency portal)",
};

// Server component wrapper — passes searchParams to client
export default function CoverageZipsPage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <CoverageZipsPageInner searchParams={searchParams} />
    </Suspense>
  );
}

async function CoverageZipsPageInner({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>;
}) {
  const params = await searchParams;
  return <CoverageZipsClient highlight={params.highlight} />;
}
