import { NextResponse } from "next/server";
import { getAcceptedInsurancePlans } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const plans = await getAcceptedInsurancePlans();
  return NextResponse.json({ plans });
}
