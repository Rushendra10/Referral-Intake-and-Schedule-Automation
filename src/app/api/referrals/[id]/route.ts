import { NextResponse } from "next/server";

import { getReferral } from "@/lib/server/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const referral = await getReferral(id);

  if (!referral) {
    return new NextResponse("Referral not found.", { status: 404 });
  }

  return NextResponse.json(referral);
}

