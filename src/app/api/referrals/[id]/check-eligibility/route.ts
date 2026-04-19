import { NextRequest, NextResponse } from "next/server";
import { startEligibilityWorkflow } from "@/lib/server/eligibility-workflow";
import { getEligibilityStatus } from "@/lib/server/store";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const run = await startEligibilityWorkflow(id);
    return NextResponse.json({ run });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start eligibility workflow";
    console.error("[eligibility] start error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const status = await getEligibilityStatus(id);
    return NextResponse.json(status);
  } catch (error) {
    console.error("[eligibility] get error:", error);
    return NextResponse.json(
      { run: null, events: [], agents: [], result: null },
      { status: 200 },
    );
  }
}
