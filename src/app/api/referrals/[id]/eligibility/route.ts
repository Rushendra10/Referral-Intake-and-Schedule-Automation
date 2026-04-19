import { NextRequest, NextResponse } from "next/server";
import { getEligibilityStatus } from "@/lib/server/store";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const status = await getEligibilityStatus(id);
  return NextResponse.json(status);
}
