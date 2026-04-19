import { NextResponse } from "next/server";

import { getStats } from "@/lib/server/store";

export async function GET() {
  return NextResponse.json(await getStats());
}

