import { NextResponse } from "next/server";
import { getCoveredZips } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const zips = await getCoveredZips();
  return NextResponse.json({ zips });
}
