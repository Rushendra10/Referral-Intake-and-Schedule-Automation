import { NextResponse } from "next/server";
import { getNurses } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const nurses = await getNurses();
  return NextResponse.json({ nurses });
}
