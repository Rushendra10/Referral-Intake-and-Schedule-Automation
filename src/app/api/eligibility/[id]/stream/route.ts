import { type NextRequest } from "next/server";
import { TinyFish } from "@tiny-fish/sdk";
import { getExtractedReferral } from "@/lib/data/extracted-referrals";
import { runEligibilityCheck } from "@/backend/tinyfish/eligibility/engine";
import type { EligibilityEvent, EligibilityVerdict } from "@/lib/types";

/**
 * GET /api/eligibility/[id]/stream
 * ─────────────────────────────────
 * SSE proxy for TinyFish eligibility checks using the official @tiny-fish/sdk.
 *
 * Real mode:  TINYFISH_API_KEY + TINYFISH_TARGET_BASE_URL both set.
 *             SDK creates a TinyFish client, calls client.agent.stream() for:
 *               1. ZIP coverage check  → /demo/coverage-zips
 *               2. Insurance check     → /demo/accepted-insurance
 *             Progress events are forwarded to the browser in real time.
 *
 * Fallback:   Either env var missing → deterministic simulated engine.
 *             First SSE event is always { type: "MODE", mode: "simulated"|"real" }
 *             so the UI badge updates immediately.
 */

// ── Route handler ──────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const apiKey = process.env.TINYFISH_API_KEY;
  const targetBase = process.env.TINYFISH_TARGET_BASE_URL?.replace(/\/$/, "");

  const encoder = new TextEncoder();
  const sseEvent = (data: object) =>
    encoder.encode(`data: ${JSON.stringify(data)}\n\n`);

  // ── Determine mode ─────────────────────────────────────────────────────────
  const missingVars: string[] = [];
  if (!apiKey || apiKey === "sk-tinyfish-YOUR_KEY_HERE") missingVars.push("TINYFISH_API_KEY");
  if (!targetBase) missingVars.push("TINYFISH_TARGET_BASE_URL");
  const isRealMode = missingVars.length === 0;

  if (isRealMode) {
    console.log(
      `\n✅ [eligibility/stream] REAL TinyFish SDK MODE` +
      `\n   Referral : ${id}` +
      `\n   Target   : ${targetBase}` +
      `\n   API Key  : ${apiKey!.slice(0, 18)}...\n`
    );
  } else {
    console.log(
      `\n🟡 [eligibility/stream] SIMULATED MODE` +
      `\n   Referral : ${id}` +
      `\n   Missing  : ${missingVars.join(", ")}\n`
    );
  }

  // ── FALLBACK ───────────────────────────────────────────────────────────────
  if (!isRealMode) {
    const result = runEligibilityCheck(id);
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(sseEvent({ type: "MODE", mode: "simulated", missingVars }));
        for (const event of result.events) {
          const delay = Math.min(event.delayMs, 600);
          if (delay > 0) await new Promise((r) => setTimeout(r, delay));
          controller.enqueue(sseEvent(event));
        }
        controller.enqueue(sseEvent({ type: "DONE", verdict: result.verdict, reason: result.reason }));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  }

  // ── REAL MODE: official TinyFish SDK ──────────────────────────────────────
  // SDK auto-reads TINYFISH_API_KEY from process.env — no explicit key needed.
  const client = new TinyFish();
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

      // Tell the UI we're live
      controller.enqueue(sseEvent({ type: "MODE", mode: "real", targetBase }));

      emit({
        id: `evt-${evtIdx++}`,
        type: "inspect",
        message: `Extracted referral — ZIP: ${zip ?? "unknown"}, Insurance: ${insurance ?? "unknown"}`,
      });

      // ── CHECK 1: ZIP coverage ──────────────────────────────────────────────
      const zipPath = `/demo/coverage-zips?highlight=${zip ?? ""}`;
      const zipUrl = `${targetBase}${zipPath}`;

      emit({ id: `evt-${evtIdx++}`, type: "navigate", message: `Opening coverage map → ${zipPath}`, targetUrl: zipPath });
      console.log(`[eligibility/stream] TinyFish ZIP check → ${zipUrl}`);

      const zipGoal =
        `Look at the ZIP code coverage table on this page. ` +
        `Find the row for ZIP code "${zip}". ` +
        `Check the Coverage Status column — "In Coverage" means covered, "Not Covered" means not covered. ` +
        `Return JSON: { "covered": true } if it is In Coverage, or { "covered": false } otherwise.`;

      let zipCovered = false;

      try {
        const zipStream = await client.agent.stream({ url: zipUrl, goal: zipGoal });

        for await (const event of zipStream) {
          console.log(`[eligibility/stream] ZIP event: ${event.type}${event.type === "PROGRESS" ? ` — ${event.purpose}` : ""}`);

          if (event.type === "STREAMING_URL") {
            emit({
              id: `evt-${evtIdx++}`,
              type: "navigate",
              message: "Agent browser live — real-time preview active",
              targetUrl: zipPath,
              streamingUrl: event.streaming_url,
            });
          } else if (event.type === "PROGRESS") {
            emit({ id: `evt-${evtIdx++}`, type: "inspect", message: event.purpose });
          } else if (event.type === "COMPLETE") {
            console.log(`[eligibility/stream] ZIP result:`, event.result);
            const covered = (event.result as { covered?: boolean } | null)?.covered === true;
            zipCovered = covered;
            emit({
              id: `evt-${evtIdx++}`,
              type: covered ? "match" : "nomatch",
              message: covered
                ? `ZIP ${zip} ✓ — confirmed within SunCare service area`
                : `ZIP ${zip} is NOT in SunCare's coverage area`,
            });
          }
        }
      } catch (err) {
        console.error("[eligibility/stream] ZIP check error:", err);
        emit({ id: `evt-${evtIdx++}`, type: "nomatch", message: `ZIP check failed: ${err instanceof Error ? err.message : String(err)}` });
      }

      if (!zipCovered) {
        emit({ id: `evt-${evtIdx++}`, type: "decision", message: "Decision: blocked_zip — address outside SunCare service area" });
        done("blocked_zip", `ZIP code ${zip ?? "(missing)"} is outside SunCare Home Health's service area.`);
        controller.close();
        return;
      }

      // ── CHECK 2: Insurance acceptance ──────────────────────────────────────
      const insPath = `/demo/accepted-insurance?highlight=${encodeURIComponent(insurance ?? "")}`;
      const insUrl = `${targetBase}${insPath}`;

      emit({ id: `evt-${evtIdx++}`, type: "navigate", message: `Opening accepted insurance list → ${insPath}`, targetUrl: insPath });
      console.log(`[eligibility/stream] TinyFish insurance check → ${insUrl}`);

      const insGoal =
        `Look at the insurance payer table on this page. ` +
        `Find a row where the Payer or Plan Name contains "${insurance}". ` +
        `Read the Status column and return JSON:\n` +
        `  { "status": "accepted" }      — if Status is "Accepted"\n` +
        `  { "status": "manual_review" } — if Status is "Manual Review"\n` +
        `  { "status": "not_accepted" }  — if Status is "Not Accepted" or the plan is not found`;

      let insuranceStatus: "accepted" | "manual_review" | "not_accepted" = "not_accepted";

      try {
        const insStream = await client.agent.stream({ url: insUrl, goal: insGoal });

        for await (const event of insStream) {
          console.log(`[eligibility/stream] Insurance event: ${event.type}${event.type === "PROGRESS" ? ` — ${event.purpose}` : ""}`);

          if (event.type === "STREAMING_URL") {
            emit({
              id: `evt-${evtIdx++}`,
              type: "navigate",
              message: "Agent navigated to insurance page — live preview active",
              targetUrl: insPath,
              streamingUrl: event.streaming_url,
            });
          } else if (event.type === "PROGRESS") {
            emit({ id: `evt-${evtIdx++}`, type: "inspect", message: event.purpose });
          } else if (event.type === "COMPLETE") {
            console.log(`[eligibility/stream] Insurance result:`, event.result);
            const s = (event.result as { status?: string } | null)?.status;
            insuranceStatus =
              s === "accepted" || s === "manual_review" || s === "not_accepted" ? s : "not_accepted";
            const msg =
              insuranceStatus === "accepted"
                ? `"${insurance}" ✓ — plan fully accepted by SunCare`
                : insuranceStatus === "manual_review"
                ? `"${insurance}" — requires manual authorization review`
                : `"${insurance}" is NOT in SunCare's accepted payer list`;
            emit({ id: `evt-${evtIdx++}`, type: insuranceStatus === "not_accepted" ? "nomatch" : "match", message: msg });
          }
        }
      } catch (err) {
        console.error("[eligibility/stream] Insurance check error:", err);
        emit({ id: `evt-${evtIdx++}`, type: "nomatch", message: `Insurance check failed: ${err instanceof Error ? err.message : String(err)}` });
      }

      // ── Final verdict ──────────────────────────────────────────────────────
      const verdict: EligibilityVerdict =
        insuranceStatus === "not_accepted" ? "blocked_insurance" :
        insuranceStatus === "manual_review" ? "manual_review" : "eligible";

      const reason =
        verdict === "blocked_insurance" ? `${insurance} is not in SunCare Home Health's accepted payer list.` :
        verdict === "manual_review" ? `${insurance} requires manual authorization before SunCare can accept this referral.` :
        `ZIP ${zip} is in SunCare's service area and ${insurance} is a fully accepted plan.`;

      console.log(`[eligibility/stream] Final verdict: ${verdict}`);
      emit({ id: `evt-${evtIdx++}`, type: "decision", message: `Decision: ${verdict} — ${reason}` });
      done(verdict, reason);
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
