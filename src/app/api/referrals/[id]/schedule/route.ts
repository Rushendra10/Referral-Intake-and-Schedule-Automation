import { NextRequest, NextResponse } from "next/server";
import { startSchedulingWorkflow } from "@/lib/server/scheduling-workflow";
import { getSchedulingStatus } from "@/lib/server/store";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const run = await startSchedulingWorkflow(id);
    return NextResponse.json({ run });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start scheduling workflow";
    console.error("[scheduling] start error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const status = await getSchedulingStatus(id);
    return NextResponse.json(status);
  } catch (error) {
    console.error("[scheduling] get error:", error);
    return NextResponse.json(
      { run: null, events: [], agents: [], result: null },
      { status: 200 },
    );
  }
}
