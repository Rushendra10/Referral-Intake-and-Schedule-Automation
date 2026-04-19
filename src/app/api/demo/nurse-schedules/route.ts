import { NextResponse } from "next/server";
import { getNurses } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const nurses = await getNurses();
  // Return nurse schedule/availability data
  const schedules = nurses.map((nurse) => ({
    id: nurse.id,
    name: nurse.name,
    availableSlots: nurse.availableSlots,
  }));
  return NextResponse.json({ schedules });
}
