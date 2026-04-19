import { NextResponse } from "next/server";

import { createNewReferral } from "@/lib/server/store";

export async function POST() {
  return NextResponse.json(await createNewReferral());
}

