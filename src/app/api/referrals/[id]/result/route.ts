import { NextResponse } from "next/server";

import { getExtractedReferral } from "@/lib/server/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await getExtractedReferral(id);

  if (!result) {
    return new NextResponse("Result not found.", { status: 404 });
  }

  return NextResponse.json(result);
}
