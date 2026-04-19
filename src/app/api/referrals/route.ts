import { NextResponse } from "next/server";

import { getReferrals } from "@/lib/server/store";

export async function GET() {
  return NextResponse.json(await getReferrals());
}
