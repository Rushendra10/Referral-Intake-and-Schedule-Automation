import { NextRequest } from "next/server";
import { subscribeToEligibilityEvents } from "@/lib/server/eligibility-streams";
import { getEligibilityStatus } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // client disconnected
        }
      };

      // Replay existing events first
      getEligibilityStatus(id)
        .then((status) => {
          for (const event of status.events) send(event);
        })
        .catch(() => {});

      // Live events
      const unsub = subscribeToEligibilityEvents(id, send);

      _req.signal.addEventListener("abort", () => {
        unsub();
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
