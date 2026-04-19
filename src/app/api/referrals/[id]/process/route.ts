import { NextResponse } from "next/server";

import { startProcessingWorkflow } from "@/lib/server/processing-graph";
import { getProcessingStatus } from "@/lib/server/store";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return NextResponse.json(await getProcessingStatus(id));
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const run = await startProcessingWorkflow(id);
    return NextResponse.json({ run });
  } catch (error) {
    return new NextResponse(error instanceof Error ? error.message : "Unable to start processing.", {
      status: 400,
    });
  }
}

