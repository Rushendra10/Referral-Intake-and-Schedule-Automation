import { type NextRequest } from "next/server";
import { getExtractedReferral } from "@/lib/data/extracted-referrals";
import { runEligibilityCheck } from "@/backend/tinyfish/eligibility/engine";
import type { EligibilityEvent, EligibilityVerdict } from "@/lib/types";

/**
 * GET /api/eligibility/[id]/stream
 * ─────────────────────────────────
 * Server-Sent Events proxy for TinyFish eligibility automation.
 *
 * Flow:
 *   1. Read ZIP + insurance from the extracted referral
 *   2. POST to TinyFish /v1/automation/run-sse for ZIP coverage check
 *   3. POST to TinyFish /v1/automation/run-sse for insurance acceptance check
 *   4. Forward TinyFish PROGRESS events as EligibilityEvent SSE to the browser
 *   5. Emit a final DONE event with the verdict
 *
 * Fallback:
 *   If TINYFISH_API_KEY or TINYFISH_TARGET_BASE_URL are not set,
 *   falls back to the simulated engine (safe for local dev without a key).
 *
 * Env vars required:
 *   TINYFISH_API_KEY         — from https://agent.tinyfish.ai/api-keys
 *   TINYFISH_TARGET_BASE_URL — public URL so TinyFish can reach /demo/* pages
 *                              e.g. https://your-app.vercel.app
 */

const TINYFISH_API = "https://agent.tinyfish.ai/v1/automation/run-sse";

// ── TinyFish SSE raw event shape ────────────────────────────────────────────
interface TFEvent {
  type: "STARTED" | "STREAMING_URL" | "PROGRESS" | "HEARTBEAT" | "COMPLETE";
  run_id?: string;
  streaming_url?: string;
  purpose?: string;
  status?: string;
  result?: unknown;
  error?: unknown;
  timestamp?: string;
}

// ── Async generator: stream raw events from the TinyFish agent API ──────────
async function* streamTinyFish(
  url: string,
  goal: string,
  apiKey: string
): AsyncGenerator<TFEvent> {
  const res = await fetch(TINYFISH_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({ url, goal, browser_profile: "lite" }),
    // Edge runtime compatible — no duplex needed since we're reading response body
  });

  if (!res.ok) {
    throw new Error(`TinyFish API error: ${res.status} ${res.statusText}`);
  }

  if (!res.body) {
    throw new Error("TinyFish API returned no response body");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data: ")) {
        try {
          const event = JSON.parse(trimmed.slice(6)) as TFEvent;
          yield event;
          if (event.type === "COMPLETE") return;
        } catch {
          // skip malformed JSON
        }
      }
    }
  }
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const apiKey = process.env.TINYFISH_API_KEY;
  const targetBase = process.env.TINYFISH_TARGET_BASE_URL?.replace(/\/$/, "");

  const encoder = new TextEncoder();

  // Format a SSE data line
  const sseEvent = (data: object) =>
    encoder.encode(`data: ${JSON.stringify(data)}\n\n`);

  // ── FALLBACK: no API key or no public URL → stream simulated events ────────
  if (!apiKey || !targetBase || apiKey === "sk-tinyfish-YOUR_KEY_HERE") {
    console.info(
      "[eligibility/stream] No TinyFish credentials — using simulated fallback engine"
    );

    const result = runEligibilityCheck(id);

    const stream = new ReadableStream({
      async start(controller) {
        for (const event of result.events) {
          // Simulate realistic timing but cap at 600ms per event
          const delay = Math.min(event.delayMs, 600);
          if (delay > 0) {
            await new Promise((r) => setTimeout(r, delay));
          }
          controller.enqueue(sseEvent(event));
        }

        // Emit DONE signal
        controller.enqueue(
          sseEvent({ type: "DONE", verdict: result.verdict, reason: result.reason })
        );
        controller.close();
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

  // ── REAL PATH: call TinyFish for each eligibility check ───────────────────
  const referral = getExtractedReferral(id);
  const zip = referral.zip;
  const insurance = referral.insuranceName;

  const stream = new ReadableStream({
    async start(controller) {
      let evtIdx = 0;
      const emit = (partial: Omit<EligibilityEvent, "delayMs">) =>
        controller.enqueue(sseEvent({ ...partial, delayMs: 0 }));
      const done = (verdict: EligibilityVerdict, reason: string) =>
        controller.enqueue(sseEvent({ type: "DONE", verdict, reason }));

      // Step 0: announce
      emit({
        id: `evt-${evtIdx++}`,
        type: "inspect",
        message: `Reading extracted referral — ZIP: ${zip ?? "unknown"}, Insurance: ${insurance ?? "unknown"}`,
      });

      // ── ZIP Coverage Check ─────────────────────────────────────────────────
      const zipPagePath = `/demo/coverage-zips${zip ? `?highlight=${zip}` : ""}`;
      emit({
        id: `evt-${evtIdx++}`,
        type: "navigate",
        message: "TinyFish opening coverage map → /demo/coverage-zips",
        targetUrl: zipPagePath,
      });

      const zipGoal =
        `Look at the ZIP code coverage table. ` +
        `Check if ZIP code "${zip}" appears in the table AND is marked as "In Coverage" (not "Not Covered"). ` +
        `Return JSON: { "covered": true } if it is In Coverage, or { "covered": false } if it is Not Covered or not found.`;

      let zipCovered = false;

      try {
        for await (const tfEvent of streamTinyFish(
          `${targetBase}${zipPagePath}`,
          zipGoal,
          apiKey
        )) {
          if (tfEvent.type === "STREAMING_URL" && tfEvent.streaming_url) {
            // Pass the live TinyFish browser preview URL to the frontend
            emit({
              id: `evt-${evtIdx++}`,
              type: "navigate",
              message: "Agent browser launched — live preview active",
              targetUrl: zipPagePath,
              streamingUrl: tfEvent.streaming_url,
            });
          } else if (tfEvent.type === "PROGRESS" && tfEvent.purpose) {
            emit({
              id: `evt-${evtIdx++}`,
              type: "inspect",
              message: tfEvent.purpose,
            });
          } else if (tfEvent.type === "COMPLETE") {
            const result = tfEvent.result as { covered?: boolean } | null;
            zipCovered = result?.covered === true;
            emit({
              id: `evt-${evtIdx++}`,
              type: zipCovered ? "match" : "nomatch",
              message: zipCovered
                ? `ZIP ${zip} ✓ — confirmed within SunCare service area`
                : `ZIP ${zip} is NOT in SunCare's coverage area`,
            });
          }
        }
      } catch (err) {
        console.error("[eligibility/stream] ZIP check error:", err);
        emit({
          id: `evt-${evtIdx++}`,
          type: "nomatch",
          message: `ZIP check failed: ${err instanceof Error ? err.message : "unknown error"}`,
        });
      }

      if (!zipCovered) {
        emit({
          id: `evt-${evtIdx++}`,
          type: "decision",
          message: "Decision: blocked_zip — patient address is outside SunCare's service coverage",
        });
        done(
          "blocked_zip",
          `ZIP code ${zip ?? "(missing)"} is outside SunCare Home Health's service area.`
        );
        controller.close();
        return;
      }

      // ── Insurance Acceptance Check ─────────────────────────────────────────
      const insPagePath = `/demo/accepted-insurance${insurance ? `?highlight=${encodeURIComponent(insurance)}` : ""}`;
      emit({
        id: `evt-${evtIdx++}`,
        type: "navigate",
        message: "TinyFish opening accepted insurance list → /demo/accepted-insurance",
        targetUrl: insPagePath,
      });

      const insGoal =
        `Look at the insurance payer table on this page. ` +
        `Find a row that matches the plan name "${insurance}". ` +
        `Based on the Status column, return JSON:\n` +
        `  { "status": "accepted" }      — if Status is "Accepted"\n` +
        `  { "status": "manual_review" } — if Status is "Manual Review"\n` +
        `  { "status": "not_accepted" }  — if Status is "Not Accepted" or plan not found`;

      let insuranceStatus: "accepted" | "manual_review" | "not_accepted" =
        "not_accepted";

      try {
        for await (const tfEvent of streamTinyFish(
          `${targetBase}${insPagePath}`,
          insGoal,
          apiKey
        )) {
          if (tfEvent.type === "STREAMING_URL" && tfEvent.streaming_url) {
            emit({
              id: `evt-${evtIdx++}`,
              type: "navigate",
              message: "Agent navigated to insurance page — live preview active",
              targetUrl: insPagePath,
              streamingUrl: tfEvent.streaming_url,
            });
          } else if (tfEvent.type === "PROGRESS" && tfEvent.purpose) {
            emit({
              id: `evt-${evtIdx++}`,
              type: "inspect",
              message: tfEvent.purpose,
            });
          } else if (tfEvent.type === "COMPLETE") {
            const result = tfEvent.result as { status?: string } | null;
            const s = result?.status;
            insuranceStatus =
              s === "accepted" || s === "manual_review" || s === "not_accepted"
                ? s
                : "not_accepted";

            const statusMsg =
              insuranceStatus === "accepted"
                ? `"${insurance}" ✓ — plan fully accepted by SunCare`
                : insuranceStatus === "manual_review"
                ? `"${insurance}" found — requires manual authorization review`
                : `"${insurance}" is NOT in SunCare's accepted payer list`;

            emit({
              id: `evt-${evtIdx++}`,
              type: insuranceStatus === "not_accepted" ? "nomatch" : "match",
              message: statusMsg,
            });
          }
        }
      } catch (err) {
        console.error("[eligibility/stream] Insurance check error:", err);
        emit({
          id: `evt-${evtIdx++}`,
          type: "nomatch",
          message: `Insurance check failed: ${err instanceof Error ? err.message : "unknown error"}`,
        });
      }

      // ── Final verdict ──────────────────────────────────────────────────────
      let verdict: EligibilityVerdict;
      let reason: string;

      if (insuranceStatus === "not_accepted") {
        verdict = "blocked_insurance";
        reason = `${insurance} is not in SunCare Home Health's accepted payer list.`;
      } else if (insuranceStatus === "manual_review") {
        verdict = "manual_review";
        reason = `${insurance} requires manual authorization before SunCare can accept this referral.`;
      } else {
        verdict = "eligible";
        reason = `ZIP ${zip} is in SunCare's service area and ${insurance} is a fully accepted plan.`;
      }

      emit({
        id: `evt-${evtIdx++}`,
        type: "decision",
        message: `Decision: ${verdict} — ${reason}`,
      });

      done(verdict, reason);
      controller.close();
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
