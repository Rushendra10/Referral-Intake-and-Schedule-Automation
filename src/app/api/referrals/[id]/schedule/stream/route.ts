import { NextRequest } from "next/server";
import { subscribeToSchedulingEvents } from "@/lib/server/scheduling-streams";
import { getSchedulingStatus } from "@/lib/server/store";

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

      getSchedulingStatus(id)
        .then((status) => {
          for (const event of status.events) send(event);
        })
        .catch(() => {});

      const unsub = subscribeToSchedulingEvents(id, send);

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
